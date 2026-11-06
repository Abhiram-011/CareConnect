import mongoose from 'mongoose';
import Organization from '../models/Organization.js';
import Requirement from '../models/Requirement.js';
import VolunteerOpportunity from '../models/VolunteerOpportunity.js';
import Donation from '../models/Donation.js';

/**
 * @desc    Search Old-Age Homes with filters, sorting, and pagination
 * @route   GET /api/search/homes
 * @access  Public
 */
export const searchHomes = async (req, res, next) => {
  try {
    const {
      search = '',
      city = '',
      state = '',
      careType = '',
      verificationStatus = '',
      sortBy = 'verifiedFirst',
      page = 1,
      limit = 12
    } = req.query;

    const query = {};

    // Filter by verification status if explicitly provided, else allow all
    if (verificationStatus && verificationStatus !== 'All' && verificationStatus !== 'all') {
      query.verificationStatus = verificationStatus.toUpperCase();
    }

    if (city && city.trim()) {
      query.city = { $regex: city.trim(), $options: 'i' };
    }

    if (state && state.trim()) {
      query.state = { $regex: state.trim(), $options: 'i' };
    }

    if (careType && careType.trim()) {
      query.careTypes = { $in: [new RegExp(careType.trim(), 'i')] };
    }

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { name: { $regex: s, $options: 'i' } },
        { city: { $regex: s, $options: 'i' } },
        { state: { $regex: s, $options: 'i' } },
        { description: { $regex: s, $options: 'i' } },
        { careTypes: { $in: [new RegExp(s, 'i')] } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    // Sorting strategies
    let sortOptions = {};
    if (sortBy === 'nameAsc') {
      sortOptions = { name: 1 };
    } else if (sortBy === 'nameDesc') {
      sortOptions = { name: -1 };
    } else if (sortBy === 'newest') {
      sortOptions = { createdAt: -1 };
    } else {
      // Default: Verified organizations first, then newest
      sortOptions = { verificationStatus: -1, createdAt: -1 };
    }

    const [total, homes] = await Promise.all([
      Organization.countDocuments(query),
      Organization.find(query)
        .select('-documents -duplicateFlags -checklist -verificationHistory') // Strip sensitive documents and internal flags
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
    ]);

    return res.status(200).json({
      success: true,
      message: 'Old-age homes retrieved successfully.',
      data: {
        homes,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get safe public profile of an Old-Age Home with requirements and opportunities
 * @route   GET /api/search/homes/:id
 * @access  Public
 */
export const getPublicHomeDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid home organization ID.' });
    }

    const home = await Organization.findById(id).select(
      '-documents -duplicateFlags -checklist -verificationHistory'
    );

    if (!home) {
      return res.status(404).json({ success: false, message: 'Old-age home not found.' });
    }

    // Fetch open donation requirements and active volunteer opportunities for this home
    const [requirements, opportunities] = await Promise.all([
      Requirement.find({
        organization: home._id,
        status: { $in: ['Open', 'Partially Fulfilled', 'OPEN'] }
      }).limit(10),
      VolunteerOpportunity.find({
        homeId: home._id,
        status: { $in: ['OPEN', 'Open'] }
      }).limit(6)
    ]);

    return res.status(200).json({
      success: true,
      data: {
        home,
        requirements,
        opportunities
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Search Donation Needs / Opportunities across Old-Age Homes
 * @route   GET /api/search/donations
 * @access  Public
 */
export const searchDonations = async (req, res, next) => {
  try {
    const { search = '', category = '', location = '', urgency = '', page = 1, limit = 12 } = req.query;

    const query = { status: { $in: ['Open', 'Partially Fulfilled'] } };

    if (category && category !== 'All' && category !== 'all') {
      query.category = { $regex: category.trim(), $options: 'i' };
    }

    if (urgency && urgency !== 'All' && urgency !== 'all') {
      query.urgency = { $regex: new RegExp(`^${urgency.trim()}$`, 'i') };
    }

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { title: { $regex: s, $options: 'i' } },
        { description: { $regex: s, $options: 'i' } },
        { category: { $regex: s, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    // Filter by organization location if provided
    let populatedQuery = Requirement.find(query)
      .sort({ urgency: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate({
        path: 'organization',
        select: 'name city state address phone email verificationStatus profileImage'
      });

    const [total, items] = await Promise.all([
      Requirement.countDocuments(query),
      populatedQuery
    ]);

    // Optional post-filter for location on populated organization
    let filteredItems = items;
    if (location && location.trim()) {
      const loc = location.trim().toLowerCase();
      filteredItems = items.filter(
        (it) =>
          it.organization?.city?.toLowerCase().includes(loc) ||
          it.organization?.state?.toLowerCase().includes(loc)
      );
    }

    return res.status(200).json({
      success: true,
      data: {
        donationNeeds: filteredItems,
        needs: filteredItems,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Search Volunteer Opportunities with filters
 * @route   GET /api/search/volunteer-opportunities
 * @access  Public
 */
export const searchVolunteerOpportunities = async (req, res, next) => {
  try {
    const { search = '', category = '', location = '', date = '', page = 1, limit = 12 } = req.query;

    const query = { status: { $in: ['OPEN', 'Open'] } };

    if (category && category !== 'All' && category !== 'all') {
      query.category = { $regex: category.trim(), $options: 'i' };
    }

    if (location && location.trim()) {
      query.location = { $regex: location.trim(), $options: 'i' };
    }

    if (date && date.trim()) {
      const targetDate = new Date(date);
      if (!isNaN(targetDate.getTime())) {
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);
        query.eventDate = { $gte: targetDate, $lt: nextDay };
      }
    }

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { title: { $regex: s, $options: 'i' } },
        { description: { $regex: s, $options: 'i' } },
        { requiredSkills: { $in: [new RegExp(s, 'i')] } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const [total, opportunities] = await Promise.all([
      VolunteerOpportunity.countDocuments(query),
      VolunteerOpportunity.find(query)
        .sort({ eventDate: 1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate({
          path: 'homeId',
          select: 'name city state phone email verificationStatus profileImage'
        })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        opportunities,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
