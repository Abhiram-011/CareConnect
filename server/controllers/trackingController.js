import mongoose from 'mongoose';
import Donation from '../models/Donation.js';
import Organization from '../models/Organization.js';
import VolunteerApplication from '../models/VolunteerApplication.js';
import VolunteerOpportunity from '../models/VolunteerOpportunity.js';

/**
 * Standard progression steps for visual donation tracking
 */
const DONATION_FLOW = ['PENDING', 'ACCEPTED', 'SCHEDULED', 'DELIVERED', 'COMPLETED'];

/**
 * @desc    Get tracking list of donations for current user
 * @route   GET /api/tracking/donations
 * @access  Private (Donor, Home, Admin)
 */
export const getDonationsTracking = async (req, res, next) => {
  try {
    const { status = '', search = '', page = 1, limit = 15 } = req.query;

    const query = {};

    // Ownership scoping
    if (req.user.role === 'donor') {
      query.donorId = req.user._id;
    } else if (req.user.role === 'home') {
      const org = await Organization.findOne({ user: req.user._id });
      if (!org) {
        return res.status(200).json({ success: true, data: { donations: [], pagination: { total: 0 } } });
      }
      query.homeId = org._id;
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied to donation tracking.' });
    }

    if (status && status !== 'All' && status !== 'all') {
      query.status = status.toUpperCase();
    }

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { itemName: { $regex: s, $options: 'i' } },
        { category: { $regex: s, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 15));
    const skip = (pageNum - 1) * limitNum;

    const [total, donations] = await Promise.all([
      Donation.countDocuments(query),
      Donation.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('donorId', 'name email phone')
        .populate('homeId', 'name city state address phone verificationStatus profileImage')
    ]);

    // Enhance each record with current visual progression index
    const enriched = donations.map((d) => {
      const obj = d.toObject();
      const currentStepIdx = DONATION_FLOW.indexOf(d.status);
      obj.flow = {
        steps: DONATION_FLOW,
        currentStep: d.status,
        currentStepIndex: currentStepIdx >= 0 ? currentStepIdx : -1,
        isTerminalFailed: d.status === 'REJECTED' || d.status === 'CANCELLED'
      };
      return obj;
    });

    return res.status(200).json({
      success: true,
      data: {
        donations: enriched,
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
 * @desc    Get detailed tracking information & visual timeline for a single donation
 * @route   GET /api/tracking/donations/:id
 * @access  Private (Owner Donor, Recipient Home, or Admin)
 */
export const getDonationTrackingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid donation ID format.' });
    }

    const donation = await Donation.findById(id)
      .populate('donorId', 'name email phone location')
      .populate('homeId', 'name city state address phone email verificationStatus profileImage')
      .populate('statusHistory.changedBy', 'name role');

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation record not found.' });
    }

    // Authorization / ownership check: only donor, recipient home, or admin
    let isAuthorized = false;
    if (req.user.role === 'admin') {
      isAuthorized = true;
    } else if (req.user.role === 'donor' && donation.donorId?._id.equals(req.user._id)) {
      isAuthorized = true;
    } else if (req.user.role === 'home') {
      const org = await Organization.findOne({ user: req.user._id });
      if (org && donation.homeId?._id.equals(org._id)) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to track this donation.'
      });
    }

    const currentStepIdx = DONATION_FLOW.indexOf(donation.status);
    const flow = {
      steps: DONATION_FLOW,
      currentStep: donation.status,
      currentStepIndex: currentStepIdx >= 0 ? currentStepIdx : -1,
      isTerminalFailed: donation.status === 'REJECTED' || donation.status === 'CANCELLED'
    };

    const donObj = donation.toObject ? donation.toObject() : { ...donation };
    donObj.timeline = DONATION_FLOW.map((s, idx) => ({
      status: s,
      state: idx < currentStepIdx ? 'completed' : idx === currentStepIdx ? 'current' : 'upcoming'
    }));

    return res.status(200).json({
      success: true,
      data: {
        donation: donObj,
        flow
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Standard progression steps for volunteer applications
 */
const VOLUNTEER_FLOW = ['PENDING', 'ACCEPTED', 'COMPLETED'];

/**
 * @desc    Get tracking list of volunteer applications for current volunteer or home
 * @route   GET /api/tracking/volunteer-applications
 * @access  Private (Volunteer, Home, Admin)
 */
export const getVolunteerApplicationsTracking = async (req, res, next) => {
  try {
    const { status = '', search = '', page = 1, limit = 15 } = req.query;

    const query = {};

    // Ownership scoping
    if (req.user.role === 'volunteer') {
      query.volunteerId = req.user._id;
    } else if (req.user.role === 'home') {
      // Find all opportunities owned by this home
      const opps = await VolunteerOpportunity.find({ homeUser: req.user._id }).select('_id');
      const oppIds = opps.map((o) => o._id);
      query.opportunityId = { $in: oppIds };
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied to volunteer tracking.' });
    }

    if (status && status !== 'All' && status !== 'all') {
      query.status = status.toUpperCase();
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 15));
    const skip = (pageNum - 1) * limitNum;

    const [total, applications] = await Promise.all([
      VolunteerApplication.countDocuments(query),
      VolunteerApplication.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('volunteerId', 'name email phone location')
        .populate({
          path: 'opportunityId',
          select: 'title category eventDate location durationHours status homeId',
          populate: { path: 'homeId', select: 'name city state phone verificationStatus profileImage' }
        })
    ]);

    const enriched = applications.map((app) => {
      const obj = app.toObject();
      const currentStepIdx = VOLUNTEER_FLOW.indexOf(app.status);
      obj.flow = {
        steps: VOLUNTEER_FLOW,
        currentStep: app.status,
        currentStepIndex: currentStepIdx >= 0 ? currentStepIdx : -1,
        isTerminalFailed: app.status === 'REJECTED' || app.status === 'WITHDRAWN'
      };
      return obj;
    });

    return res.status(200).json({
      success: true,
      data: {
        applications: enriched,
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
 * @desc    Get tracking details for a single volunteer application
 * @route   GET /api/tracking/volunteer-applications/:id
 * @access  Private (Owner Volunteer, Opportunity Home, or Admin)
 */
export const getVolunteerApplicationTrackingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid application ID.' });
    }

    const application = await VolunteerApplication.findById(id)
      .populate('volunteerId', 'name email phone location')
      .populate({
        path: 'opportunityId',
        populate: { path: 'homeId', select: 'name city state address phone email verificationStatus profileImage' }
      })
      .populate('statusHistory.changedBy', 'name role');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application record not found.' });
    }

    // Ownership check
    let isAuthorized = false;
    if (req.user.role === 'admin') {
      isAuthorized = true;
    } else if (req.user.role === 'volunteer' && application.volunteerId?._id.equals(req.user._id)) {
      isAuthorized = true;
    } else if (req.user.role === 'home' && application.opportunityId?.homeUser?.equals(req.user._id)) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to track this volunteer application.'
      });
    }

    const currentStepIdx = VOLUNTEER_FLOW.indexOf(application.status);
    const flow = {
      steps: VOLUNTEER_FLOW,
      currentStep: application.status,
      currentStepIndex: currentStepIdx >= 0 ? currentStepIdx : -1,
      isTerminalFailed: application.status === 'REJECTED' || application.status === 'WITHDRAWN'
    };

    const appObj = application.toObject ? application.toObject() : { ...application };
    appObj.timeline = VOLUNTEER_FLOW.map((s, idx) => ({
      status: s,
      state: idx < currentStepIdx ? 'completed' : idx === currentStepIdx ? 'current' : 'upcoming'
    }));

    return res.status(200).json({
      success: true,
      data: {
        application: appObj,
        flow
      }
    });
  } catch (error) {
    next(error);
  }
};
