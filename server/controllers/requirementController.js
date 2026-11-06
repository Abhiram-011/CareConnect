import Requirement from '../models/Requirement.js';
import Organization from '../models/Organization.js';

/**
 * Helper to get the organization associated with the logged in user
 */
const getHomeOrg = async (userId) => {
  const org = await Organization.findOne({ user: userId });
  return org;
};

/**
 * @desc    Create a new requirement (Old-Age Home)
 * @route   POST /api/requirements
 * @access  Private (Home role)
 */
export const createRequirement = async (req, res, next) => {
  try {
    const org = await getHomeOrg(req.user._id);
    if (!org) {
      return res.status(404).json({
        success: false,
        message: 'Organization profile not found. Please complete your profile first.'
      });
    }

    const {
      title,
      description,
      category,
      unit,
      quantityRequired,
      urgency,
      neededByDate,
      notes
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a requirement title.'
      });
    }

    if (!quantityRequired || Number(quantityRequired) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid required quantity greater than 0.'
      });
    }

    const requirement = await Requirement.create({
      organization: org._id,
      title: title.trim(),
      description: description ? description.trim() : '',
      category: category || 'Groceries & Food',
      unit: unit ? unit.trim() : 'units',
      quantityRequired: Number(quantityRequired),
      quantityFulfilled: 0,
      urgency: urgency || 'Medium',
      neededByDate: neededByDate ? new Date(neededByDate) : undefined,
      notes: notes ? notes.trim() : '',
      status: 'Open'
    });

    return res.status(201).json({
      success: true,
      message: 'Requirement created successfully.',
      data: {
        requirement
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all requirements of the logged in home
 * @route   GET /api/requirements/my-requirements
 * @access  Private (Home role)
 */
export const getMyRequirements = async (req, res, next) => {
  try {
    const org = await getHomeOrg(req.user._id);
    if (!org) {
      return res.status(200).json({
        success: true,
        data: {
          requirements: [],
          stats: { total: 0, open: 0, partiallyFulfilled: 0, fulfilled: 0, closed: 0 }
        }
      });
    }

    const { status, category, urgency, search } = req.query;
    const query = { organization: org._id };

    if (status && status !== 'All') {
      query.status = status;
    }
    if (category && category !== 'All') {
      query.category = category;
    }
    if (urgency && urgency !== 'All') {
      query.urgency = urgency;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const requirements = await Requirement.find(query).sort({ createdAt: -1 });

    // Aggregate summary metrics
    const allOrgReqs = await Requirement.find({ organization: org._id });
    const stats = {
      total: allOrgReqs.length,
      open: allOrgReqs.filter((r) => r.status === 'Open').length,
      partiallyFulfilled: allOrgReqs.filter((r) => r.status === 'Partially Fulfilled').length,
      fulfilled: allOrgReqs.filter((r) => r.status === 'Fulfilled').length,
      closed: allOrgReqs.filter((r) => r.status === 'Closed').length
    };

    return res.status(200).json({
      success: true,
      data: {
        requirements,
        stats
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single requirement by ID
 * @route   GET /api/requirements/:id
 * @access  Public / Authenticated
 */
export const getRequirementById = async (req, res, next) => {
  try {
    const requirement = await Requirement.findById(req.params.id).populate(
      'organization',
      'name city state verificationStatus phone email profileImage'
    );

    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: 'Requirement not found.'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        requirement
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update requirement (Old-Age Home owner or Admin)
 * @route   PUT /api/requirements/:id
 * @access  Private
 */
export const updateRequirement = async (req, res, next) => {
  try {
    const requirement = await Requirement.findById(req.params.id);
    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: 'Requirement not found.'
      });
    }

    // Authorization check: Must be owner org or admin
    if (req.user.role !== 'admin') {
      const org = await getHomeOrg(req.user._id);
      if (!org || requirement.organization.toString() !== org._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this requirement.'
        });
      }
    }

    const {
      title,
      description,
      category,
      unit,
      quantityRequired,
      quantityFulfilled,
      urgency,
      status,
      neededByDate,
      notes
    } = req.body;

    if (title !== undefined) requirement.title = title.trim();
    if (description !== undefined) requirement.description = description.trim();
    if (category !== undefined) requirement.category = category;
    if (unit !== undefined) requirement.unit = unit.trim();
    if (quantityRequired !== undefined) {
      const qReq = Number(quantityRequired);
      if (qReq <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantity required must be greater than 0.'
        });
      }
      requirement.quantityRequired = qReq;
    }
    if (quantityFulfilled !== undefined) {
      const qFul = Number(quantityFulfilled);
      if (qFul < 0) {
        return res.status(400).json({
          success: false,
          message: 'Fulfilled quantity cannot be negative.'
        });
      }
      requirement.quantityFulfilled = qFul;
    }
    if (urgency !== undefined) requirement.urgency = urgency;
    if (status !== undefined) requirement.status = status;
    if (neededByDate !== undefined) requirement.neededByDate = neededByDate ? new Date(neededByDate) : null;
    if (notes !== undefined) requirement.notes = notes.trim();

    await requirement.save();

    return res.status(200).json({
      success: true,
      message: 'Requirement updated successfully.',
      data: {
        requirement
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete requirement (Old-Age Home owner or Admin)
 * @route   DELETE /api/requirements/:id
 * @access  Private
 */
export const deleteRequirement = async (req, res, next) => {
  try {
    const requirement = await Requirement.findById(req.params.id);
    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: 'Requirement not found.'
      });
    }

    if (req.user.role !== 'admin') {
      const org = await getHomeOrg(req.user._id);
      if (!org || requirement.organization.toString() !== org._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this requirement.'
        });
      }
    }

    await requirement.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Requirement deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get public list of requirements (For Donors to browse)
 * @route   GET /api/requirements/public
 * @access  Public
 */
export const getPublicRequirements = async (req, res, next) => {
  try {
    const { category, urgency, status, city, search, organizationId } = req.query;
    const query = {};

    if (organizationId) {
      query.organization = organizationId;
    }

    if (status && status !== 'All') {
      query.status = status;
    } else if (!status) {
      // By default show Open & Partially Fulfilled for donors
      query.status = { $in: ['Open', 'Partially Fulfilled'] };
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (urgency && urgency !== 'All') {
      query.urgency = urgency;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    let requirements = await Requirement.find(query)
      .populate('organization', 'name city district state verificationStatus profileImage')
      .sort({ urgency: -1, createdAt: -1 });

    if (city) {
      requirements = requirements.filter(
        (r) => r.organization && r.organization.city && r.organization.city.toLowerCase().includes(city.toLowerCase())
      );
    }

    return res.status(200).json({
      success: true,
      count: requirements.length,
      data: {
        requirements
      }
    });
  } catch (error) {
    next(error);
  }
};
