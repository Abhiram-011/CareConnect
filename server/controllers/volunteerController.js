import mongoose from 'mongoose';
import VolunteerProfile from '../models/VolunteerProfile.js';
import VolunteerOpportunity, { VOLUNTEER_OPPORTUNITY_CATEGORIES } from '../models/VolunteerOpportunity.js';
import VolunteerApplication from '../models/VolunteerApplication.js';
import Organization from '../models/Organization.js';
import User from '../models/User.js';
import { createNotification } from '../utils/notificationService.js';

/**
 * Helper: Retrieve or auto-create an Organization record for an authenticated home user
 */
const getOrCreateHomeOrg = async (user) => {
  let org = await Organization.findOne({ user: user._id });
  if (!org) {
    // If an Organization profile hasn't been formally submitted via Module 2 yet,
    // generate an active organization profile linking to this home account so
    // volunteer opportunity posting functions reliably.
    org = await Organization.create({
      user: user._id,
      name: user.name || 'Old-Age Care Facility',
      address: user.location || 'Care Facility Campus',
      city: 'Local Area',
      state: 'State',
      pincode: '000000',
      phone: user.phone || '0000000000',
      email: user.email,
      responsiblePerson: user.name,
      organizationType: 'Trust',
      registrationNumber: `REG-${user._id.toString().slice(-6).toUpperCase()}`,
      verificationStatus: 'VERIFIED'
    });
  }
  return org;
};

// ============================================================================
// 1. VOLUNTEER PROFILES
// ============================================================================

/**
 * @desc    Get the profile of the authenticated volunteer
 * @route   GET /api/volunteers/profile
 * @access  Private (Volunteer role)
 */
export const getVolunteerProfile = async (req, res, next) => {
  try {
    let profile = await VolunteerProfile.findOne({ userId: req.user._id }).populate(
      'userId',
      'name email phone location profileImage role'
    );

    if (!profile) {
      // Create a default initial profile if one does not exist yet
      profile = await VolunteerProfile.create({
        userId: req.user._id,
        bio: '',
        skills: [],
        interests: [],
        availability: ['Flexible'],
        preferredLocation: req.user.location || '',
        preferredWorkTypes: [],
        experience: ''
      });
      profile = await VolunteerProfile.findById(profile._id).populate(
        'userId',
        'name email phone location profileImage role'
      );
    }

    res.status(200).json({
      success: true,
      data: {
        profile
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update or create the profile of the authenticated volunteer
 * @route   PUT /api/volunteers/profile
 * @access  Private (Volunteer role)
 */
export const updateVolunteerProfile = async (req, res, next) => {
  try {
    const {
      bio,
      skills,
      interests,
      availability,
      preferredLocation,
      preferredWorkTypes,
      experience
    } = req.body;

    const sanitizeArray = (val) => {
      if (Array.isArray(val)) {
        return val.map((s) => String(s).trim()).filter(Boolean);
      }
      if (typeof val === 'string') {
        return val.split(',').map((s) => s.trim()).filter(Boolean);
      }
      return [];
    };

    const updateFields = {
      bio: typeof bio === 'string' ? bio.trim() : '',
      skills: sanitizeArray(skills),
      interests: sanitizeArray(interests),
      availability: sanitizeArray(availability),
      preferredLocation: typeof preferredLocation === 'string' ? preferredLocation.trim() : '',
      preferredWorkTypes: sanitizeArray(preferredWorkTypes),
      experience: typeof experience === 'string' ? experience.trim() : ''
    };

    if (updateFields.bio.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Bio cannot exceed 1000 characters.'
      });
    }

    if (updateFields.experience.length > 1500) {
      return res.status(400).json({
        success: false,
        message: 'Experience cannot exceed 1500 characters.'
      });
    }

    const profile = await VolunteerProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: updateFields },
      { new: true, upsert: true, runValidators: true }
    ).populate('userId', 'name email phone location profileImage role');

    res.status(200).json({
      success: true,
      message: 'Volunteer profile updated successfully.',
      data: {
        profile
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 2. VOLUNTEER OPPORTUNITIES
// ============================================================================

/**
 * @desc    Browse & search volunteer opportunities (Public or authenticated)
 * @route   GET /api/volunteer-opportunities
 * @access  Public / Private
 */
export const getVolunteerOpportunities = async (req, res, next) => {
  try {
    const {
      search,
      category,
      location,
      date,
      status = 'OPEN',
      includeAll = 'false'
    } = req.query;

    const query = {};

    // Standard browse view shows OPEN opportunities whose application deadline hasn't passed
    if (includeAll !== 'true') {
      query.status = status || 'OPEN';
    } else if (status) {
      query.status = status;
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (location && location.trim()) {
      query.location = { $regex: location.trim(), $options: 'i' };
    }

    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { title: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
        { location: { $regex: term, $options: 'i' } }
      ];
    }

    if (date) {
      const targetDate = new Date(date);
      if (!isNaN(targetDate.getTime())) {
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);
        query.taskDate = { $gte: startOfDay, $lte: endOfDay };
      }
    }

    const opportunities = await VolunteerOpportunity.find(query)
      .populate('homeId', 'name address city state phone email verificationStatus profileImage')
      .populate('homeUser', 'name email phone')
      .sort({ taskDate: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: opportunities.length,
      data: {
        opportunities
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get opportunity details by ID
 * @route   GET /api/volunteer-opportunities/:id
 * @access  Public / Private
 */
export const getVolunteerOpportunityById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid opportunity ID format.'
      });
    }

    const opportunity = await VolunteerOpportunity.findById(id)
      .populate('homeId', 'name address city state phone email verificationStatus profileImage')
      .populate('homeUser', 'name email phone');

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer opportunity not found.'
      });
    }

    // Check if the current user has already applied
    let userApplication = null;
    if (req.user && req.user.role === 'volunteer') {
      userApplication = await VolunteerApplication.findOne({
        opportunityId: opportunity._id,
        volunteerId: req.user._id
      });
    }

    res.status(200).json({
      success: true,
      data: {
        opportunity,
        userApplication
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new volunteer opportunity (Old-Age Home)
 * @route   POST /api/volunteer-opportunities
 * @access  Private (Home role)
 */
export const createVolunteerOpportunity = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      requiredSkills,
      volunteerCapacity,
      location,
      taskDate,
      startTime,
      endTime,
      applicationDeadline,
      instructions
    } = req.body;

    // 1. Validation
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Opportunity title is required.'
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Opportunity description is required.'
      });
    }

    if (!category || !VOLUNTEER_OPPORTUNITY_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Please select a valid category from: ${VOLUNTEER_OPPORTUNITY_CATEGORIES.join(', ')}.`
      });
    }

    const capacityNum = Number(volunteerCapacity);
    if (!volunteerCapacity || isNaN(capacityNum) || capacityNum < 1) {
      return res.status(400).json({
        success: false,
        message: 'Volunteer capacity must be at least 1.'
      });
    }

    if (!location || !location.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Location address or venue is required.'
      });
    }

    if (!taskDate) {
      return res.status(400).json({
        success: false,
        message: 'Task date is required.'
      });
    }

    const taskDateObj = new Date(taskDate);
    if (isNaN(taskDateObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid task date.'
      });
    }

    if (!applicationDeadline) {
      return res.status(400).json({
        success: false,
        message: 'Application deadline is required.'
      });
    }

    const deadlineObj = new Date(applicationDeadline);
    if (isNaN(deadlineObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid application deadline.'
      });
    }

    // Deadline should not be after the task date
    if (deadlineObj > taskDateObj) {
      return res.status(400).json({
        success: false,
        message: 'Application deadline cannot be after the task date.'
      });
    }

    const homeOrg = await getOrCreateHomeOrg(req.user);

    let parsedSkills = [];
    if (Array.isArray(requiredSkills)) {
      parsedSkills = requiredSkills.map((s) => String(s).trim()).filter(Boolean);
    } else if (typeof requiredSkills === 'string' && requiredSkills.trim()) {
      parsedSkills = requiredSkills.split(',').map((s) => s.trim()).filter(Boolean);
    }

    const opportunity = await VolunteerOpportunity.create({
      homeId: homeOrg._id,
      homeUser: req.user._id,
      title: title.trim(),
      description: description.trim(),
      category,
      requiredSkills: parsedSkills,
      volunteerCapacity: capacityNum,
      volunteersAccepted: 0,
      location: location.trim(),
      taskDate: taskDateObj,
      startTime: startTime ? startTime.trim() : '',
      endTime: endTime ? endTime.trim() : '',
      applicationDeadline: deadlineObj,
      instructions: instructions ? instructions.trim() : '',
      status: 'OPEN'
    });

    res.status(201).json({
      success: true,
      message: 'Volunteer opportunity published successfully.',
      data: {
        opportunity
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a volunteer opportunity (Old-Age Home)
 * @route   PUT /api/volunteer-opportunities/:id
 * @access  Private (Home role)
 */
export const updateVolunteerOpportunity = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid opportunity ID format.' });
    }

    const opportunity = await VolunteerOpportunity.findById(id);
    if (!opportunity) {
      return res.status(404).json({ success: false, message: 'Opportunity not found.' });
    }

    // Ownership check: req.user must be the home owner
    if (opportunity.homeUser.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only modify opportunities belonging to your organization.'
      });
    }

    const {
      title,
      description,
      category,
      requiredSkills,
      volunteerCapacity,
      location,
      taskDate,
      startTime,
      endTime,
      applicationDeadline,
      instructions,
      status
    } = req.body;

    if (title) opportunity.title = title.trim();
    if (description) opportunity.description = description.trim();
    if (category) {
      if (!VOLUNTEER_OPPORTUNITY_CATEGORIES.includes(category)) {
        return res.status(400).json({
          success: false,
          message: `Category must be one of: ${VOLUNTEER_OPPORTUNITY_CATEGORIES.join(', ')}.`
        });
      }
      opportunity.category = category;
    }

    if (volunteerCapacity !== undefined) {
      const cap = Number(volunteerCapacity);
      if (isNaN(cap) || cap < 1) {
        return res.status(400).json({
          success: false,
          message: 'Volunteer capacity must be at least 1.'
        });
      }
      if (cap < opportunity.volunteersAccepted) {
        return res.status(400).json({
          success: false,
          message: `Capacity cannot be set lower than already accepted volunteers (${opportunity.volunteersAccepted}).`
        });
      }
      opportunity.volunteerCapacity = cap;
    }

    if (location) opportunity.location = location.trim();
    if (taskDate) opportunity.taskDate = new Date(taskDate);
    if (startTime !== undefined) opportunity.startTime = startTime.trim();
    if (endTime !== undefined) opportunity.endTime = endTime.trim();
    if (applicationDeadline) opportunity.applicationDeadline = new Date(applicationDeadline);
    if (instructions !== undefined) opportunity.instructions = instructions.trim();

    if (requiredSkills !== undefined) {
      if (Array.isArray(requiredSkills)) {
        opportunity.requiredSkills = requiredSkills.map((s) => String(s).trim()).filter(Boolean);
      } else if (typeof requiredSkills === 'string') {
        opportunity.requiredSkills = requiredSkills.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }

    if (status && ['OPEN', 'CLOSED', 'CANCELLED'].includes(status)) {
      opportunity.status = status;
    }

    await opportunity.save();

    res.status(200).json({
      success: true,
      message: 'Opportunity updated successfully.',
      data: {
        opportunity
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update status of an opportunity (CLOSE or CANCEL)
 * @route   PATCH /api/volunteer-opportunities/:id/status
 * @access  Private (Home role)
 */
export const updateOpportunityStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['OPEN', 'CLOSED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be OPEN, CLOSED, or CANCELLED.'
      });
    }

    const opportunity = await VolunteerOpportunity.findById(id);
    if (!opportunity) {
      return res.status(404).json({ success: false, message: 'Opportunity not found.' });
    }

    if (opportunity.homeUser.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only manage your own opportunities.'
      });
    }

    opportunity.status = status;
    await opportunity.save();

    res.status(200).json({
      success: true,
      message: `Opportunity marked as ${status}.`,
      data: {
        opportunity
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all opportunities created by the logged-in home
 * @route   GET /api/homes/volunteer-opportunities
 * @access  Private (Home role)
 */
export const getHomeOpportunities = async (req, res, next) => {
  try {
    const opportunities = await VolunteerOpportunity.find({ homeUser: req.user._id })
      .populate('homeId', 'name address city state phone email verificationStatus')
      .sort({ createdAt: -1 });

    // Include application count overview for each opportunity
    const oppIds = opportunities.map((o) => o._id);
    const applicationCounts = await VolunteerApplication.aggregate([
      { $match: { opportunityId: { $in: oppIds } } },
      {
        $group: {
          _id: { opportunityId: '$opportunityId', status: '$status' },
          count: { $sum: 1 }
        }
      }
    ]);

    const opportunitiesWithStats = opportunities.map((opp) => {
      const oppObj = opp.toObject();
      const oppCounts = applicationCounts.filter(
        (c) => c._id.opportunityId.toString() === opp._id.toString()
      );
      oppObj.totalApplications = oppCounts.reduce((acc, curr) => acc + curr.count, 0);
      oppObj.pendingApplications =
        oppCounts.find((c) => c._id.status === 'PENDING')?.count || 0;
      oppObj.acceptedCount =
        oppCounts.find((c) => c._id.status === 'ACCEPTED')?.count || 0;
      oppObj.completedCount =
        oppCounts.find((c) => c._id.status === 'COMPLETED')?.count || 0;
      return oppObj;
    });

    res.status(200).json({
      success: true,
      count: opportunitiesWithStats.length,
      data: {
        opportunities: opportunitiesWithStats
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 3. VOLUNTEER APPLICATIONS
// ============================================================================

/**
 * @desc    Apply for an open volunteer opportunity
 * @route   POST /api/volunteer-opportunities/:id/apply
 * @access  Private (Volunteer role)
 */
export const applyForOpportunity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { motivation, relevantSkills } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid opportunity ID format.'
      });
    }

    const opportunity = await VolunteerOpportunity.findById(id);
    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer opportunity not found.'
      });
    }

    // 1. Prevent applications to closed or cancelled opportunities
    if (opportunity.status !== 'OPEN') {
      return res.status(400).json({
        success: false,
        message: `This opportunity is ${opportunity.status.toLowerCase()} and no longer accepting applications.`
      });
    }

    // 2. Prevent applications after the deadline
    const now = new Date();
    if (now > new Date(opportunity.applicationDeadline)) {
      return res.status(400).json({
        success: false,
        message: 'The application deadline for this opportunity has passed.'
      });
    }

    // 3. Prevent application if accepted capacity is already fully reached
    if (opportunity.volunteersAccepted >= opportunity.volunteerCapacity) {
      return res.status(400).json({
        success: false,
        message: 'This opportunity has already reached its maximum volunteer capacity.'
      });
    }

    // 4. Prevent duplicate applications by the same volunteer for the same opportunity
    const existingApp = await VolunteerApplication.findOne({
      opportunityId: opportunity._id,
      volunteerId: req.user._id
    });

    if (existingApp) {
      return res.status(400).json({
        success: false,
        message: `You have already applied for this opportunity (Status: ${existingApp.status}). Duplicate applications are not allowed.`
      });
    }

    let skillsList = [];
    if (Array.isArray(relevantSkills)) {
      skillsList = relevantSkills.map((s) => String(s).trim()).filter(Boolean);
    } else if (typeof relevantSkills === 'string' && relevantSkills.trim()) {
      skillsList = relevantSkills.split(',').map((s) => s.trim()).filter(Boolean);
    }

    const application = await VolunteerApplication.create({
      opportunityId: opportunity._id,
      volunteerId: req.user._id,
      motivation: motivation ? motivation.trim() : '',
      relevantSkills: skillsList,
      status: 'PENDING',
      statusHistory: [
        {
          status: 'PENDING',
          changedBy: req.user._id,
          changedAt: new Date(),
          notes: 'Application submitted by volunteer.'
        }
      ]
    });

    // Notify volunteer and home owner
    await createNotification({
      recipientId: req.user._id,
      type: 'VOLUNTEER_APPLICATION',
      title: 'Volunteer Application Submitted',
      message: `You applied for '${opportunity.title}'. The organization will review your application.`,
      relatedEntityType: 'VolunteerApplication',
      relatedEntityId: application._id,
      link: `/tracking/volunteer-applications/${application._id}`
    });

    if (opportunity.homeUser) {
      await createNotification({
        recipientId: opportunity.homeUser,
        type: 'VOLUNTEER_APPLICATION',
        title: 'New Volunteer Application',
        message: `${req.user.name || 'A volunteer'} applied for '${opportunity.title}'.`,
        relatedEntityType: 'VolunteerApplication',
        relatedEntityId: application._id,
        link: `/home/volunteers`
      });
    }

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully.',
      data: {
        application
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted an application for this opportunity.'
      });
    }
    next(error);
  }
};

/**
 * @desc    Get all applications submitted by the logged-in volunteer
 * @route   GET /api/volunteer-applications/my
 * @access  Private (Volunteer role)
 */
export const getMyVolunteerApplications = async (req, res, next) => {
  try {
    const applications = await VolunteerApplication.find({ volunteerId: req.user._id })
      .populate({
        path: 'opportunityId',
        populate: [
          { path: 'homeId', select: 'name address city state phone email verificationStatus' },
          { path: 'homeUser', select: 'name email phone' }
        ]
      })
      .sort({ createdAt: -1 });

    // Calculate dynamic stats
    const stats = {
      totalApplications: applications.length,
      pending: applications.filter((a) => a.status === 'PENDING').length,
      accepted: applications.filter((a) => a.status === 'ACCEPTED').length,
      completed: applications.filter((a) => a.status === 'COMPLETED').length,
      rejected: applications.filter((a) => a.status === 'REJECTED').length,
      withdrawn: applications.filter((a) => a.status === 'WITHDRAWN').length
    };

    // Calculate available open opportunities count for the volunteer dashboard
    const now = new Date();
    const availableOpportunitiesCount = await VolunteerOpportunity.countDocuments({
      status: 'OPEN',
      applicationDeadline: { $gte: now }
    });

    res.status(200).json({
      success: true,
      count: applications.length,
      data: {
        applications,
        stats: {
          ...stats,
          availableOpportunities: availableOpportunitiesCount
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Withdraw an eligible application (Volunteer can withdraw their own PENDING application)
 * @route   PATCH /api/volunteer-applications/:id/withdraw
 * @access  Private (Volunteer role)
 */
export const withdrawVolunteerApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid application ID format.' });
    }

    const application = await VolunteerApplication.findById(id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    // Ownership check: must be volunteer's own application
    if (application.volunteerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only withdraw your own applications.'
      });
    }

    // Only PENDING applications are eligible for withdrawal
    if (application.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Cannot withdraw application with status '${application.status}'. Only PENDING applications can be withdrawn.`
      });
    }

    application.status = 'WITHDRAWN';
    application.statusHistory.push({
      status: 'WITHDRAWN',
      changedBy: req.user._id,
      changedAt: new Date(),
      notes: req.body?.notes || 'Withdrawn by volunteer.'
    });

    await application.save();

    // Notify home owner about withdrawal
    if (application.opportunityId) {
      const opp = await VolunteerOpportunity.findById(application.opportunityId);
      if (opp && opp.homeUser) {
        await createNotification({
          recipientId: opp.homeUser,
          type: 'VOLUNTEER_APPLICATION',
          title: 'Volunteer Application Withdrawn',
          message: `${req.user.name || 'A volunteer'} has withdrawn their application for '${opp.title}'.`,
          relatedEntityType: 'VolunteerApplication',
          relatedEntityId: application._id,
          link: `/home/volunteers`
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Application withdrawn successfully.',
      data: {
        application
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get applications for a specific opportunity (Old-Age Home owner only)
 * @route   GET /api/volunteer-opportunities/:id/applications
 * @access  Private (Home role)
 */
export const getOpportunityApplications = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid opportunity ID format.' });
    }

    const opportunity = await VolunteerOpportunity.findById(id).populate(
      'homeId',
      'name address city phone email'
    );
    if (!opportunity) {
      return res.status(404).json({ success: false, message: 'Opportunity not found.' });
    }

    // Ownership check: homeUser must match req.user._id
    if (opportunity.homeUser.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view applications for your own opportunities.'
      });
    }

    const applications = await VolunteerApplication.find({ opportunityId: opportunity._id })
      .populate('volunteerId', 'name email phone location profileImage')
      .sort({ createdAt: -1 });

    // Fetch volunteer profile information for each volunteer
    const volunteerUserIds = applications.map((a) => a.volunteerId?._id).filter(Boolean);
    const profiles = await VolunteerProfile.find({ userId: { $in: volunteerUserIds } });

    const enrichedApplications = applications.map((app) => {
      const appObj = app.toObject();
      const profile = profiles.find(
        (p) => p.userId.toString() === app.volunteerId?._id?.toString()
      );
      appObj.volunteerProfile = profile || null;
      return appObj;
    });

    res.status(200).json({
      success: true,
      count: enrichedApplications.length,
      data: {
        opportunity,
        applications: enrichedApplications
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Accept a volunteer application (Old-Age Home)
 * @route   PATCH /api/volunteer-applications/:id/accept
 * @access  Private (Home role)
 */
export const acceptVolunteerApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid application ID format.' });
    }

    const application = await VolunteerApplication.findById(id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const opportunity = await VolunteerOpportunity.findById(application.opportunityId);
    if (!opportunity) {
      return res.status(404).json({ success: false, message: 'Associated opportunity not found.' });
    }

    // Ownership check: Home must own the opportunity
    if (opportunity.homeUser.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot manage applications for other homes.'
      });
    }

    if (application.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Only PENDING applications can be accepted. Current status is '${application.status}'.`
      });
    }

    // Enforce capacity check atomically:
    // Atomic update to guarantee capacity is not exceeded under concurrent requests
    const updatedOpportunity = await VolunteerOpportunity.findOneAndUpdate(
      {
        _id: opportunity._id,
        $expr: { $lt: ['$volunteersAccepted', '$volunteerCapacity'] }
      },
      {
        $inc: { volunteersAccepted: 1 }
      },
      { new: true }
    );

    if (!updatedOpportunity) {
      return res.status(400).json({
        success: false,
        message: `Cannot accept application. Capacity limit of ${opportunity.volunteerCapacity} volunteers has already been reached.`
      });
    }

    application.status = 'ACCEPTED';
    application.statusHistory.push({
      status: 'ACCEPTED',
      changedBy: req.user._id,
      changedAt: new Date(),
      notes: req.body?.notes || 'Application accepted by home administration.'
    });

    await application.save();

    // Notify volunteer
    if (application.volunteerId) {
      await createNotification({
        recipientId: application.volunteerId,
        type: 'VOLUNTEER_APPLICATION',
        title: 'Volunteer Application Accepted',
        message: `Your application for '${opportunity.title}' has been accepted!`,
        relatedEntityType: 'VolunteerApplication',
        relatedEntityId: application._id,
        link: `/tracking/volunteer-applications/${application._id}`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Application accepted successfully.',
      data: {
        application,
        opportunity: updatedOpportunity
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reject a volunteer application (Old-Age Home)
 * @route   PATCH /api/volunteer-applications/:id/reject
 * @access  Private (Home role)
 */
export const rejectVolunteerApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid application ID format.' });
    }

    const application = await VolunteerApplication.findById(id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const opportunity = await VolunteerOpportunity.findById(application.opportunityId);
    if (!opportunity) {
      return res.status(404).json({ success: false, message: 'Associated opportunity not found.' });
    }

    // Ownership check: Home must own the opportunity
    if (opportunity.homeUser.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot manage applications for other homes.'
      });
    }

    if (application.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Only PENDING applications can be rejected. Current status is '${application.status}'.`
      });
    }

    application.status = 'REJECTED';
    application.statusHistory.push({
      status: 'REJECTED',
      changedBy: req.user._id,
      changedAt: new Date(),
      notes: req.body?.notes || req.body?.rejectionReason || 'Application rejected by home.'
    });

    await application.save();

    // Notify volunteer
    if (application.volunteerId) {
      await createNotification({
        recipientId: application.volunteerId,
        type: 'VOLUNTEER_APPLICATION',
        title: 'Volunteer Application Update',
        message: `Your application for '${opportunity.title}' was not selected at this time.`,
        relatedEntityType: 'VolunteerApplication',
        relatedEntityId: application._id,
        link: `/tracking/volunteer-applications/${application._id}`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Application rejected.',
      data: {
        application
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark an accepted volunteer's participation as completed after the task is finished
 * @route   PATCH /api/volunteer-applications/:id/complete
 * @access  Private (Home role)
 */
export const completeVolunteerApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid application ID format.' });
    }

    const application = await VolunteerApplication.findById(id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const opportunity = await VolunteerOpportunity.findById(application.opportunityId);
    if (!opportunity) {
      return res.status(404).json({ success: false, message: 'Associated opportunity not found.' });
    }

    // Ownership check: Home must own the opportunity
    if (opportunity.homeUser.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot mark completion for other homes.'
      });
    }

    if (application.status !== 'ACCEPTED') {
      return res.status(400).json({
        success: false,
        message: `Only ACCEPTED applications can be marked as COMPLETED. Current status is '${application.status}'.`
      });
    }

    application.status = 'COMPLETED';
    application.completedAt = new Date();
    application.statusHistory.push({
      status: 'COMPLETED',
      changedBy: req.user._id,
      changedAt: new Date(),
      notes: req.body?.notes || 'Volunteer participation successfully completed.'
    });

    await application.save();

    // Notify volunteer
    if (application.volunteerId) {
      await createNotification({
        recipientId: application.volunteerId,
        type: 'VOLUNTEER_APPLICATION',
        title: 'Volunteer Task Completed',
        message: `Congratulations! Your volunteer service for '${opportunity.title}' has been marked as COMPLETED. Thank you for your dedication!`,
        relatedEntityType: 'VolunteerApplication',
        relatedEntityId: application._id,
        link: `/tracking/volunteer-applications/${application._id}`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Volunteer task participation marked as COMPLETED.',
      data: {
        application
      }
    });
  } catch (error) {
    next(error);
  }
};
