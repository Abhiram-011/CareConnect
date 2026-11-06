import mongoose from 'mongoose';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import Donation from '../models/Donation.js';
import VolunteerOpportunity from '../models/VolunteerOpportunity.js';
import VolunteerApplication from '../models/VolunteerApplication.js';
import VolunteerProfile from '../models/VolunteerProfile.js';
import HomeVerification from '../models/HomeVerification.js';
import AdminAction from '../models/AdminAction.js';
import UserReport from '../models/UserReport.js';
import DonationCategory from '../models/DonationCategory.js';
import { createNotification } from '../utils/notificationService.js';

/**
 * Log administrative action in audit table
 */
export const logAdminAction = async ({
  adminId,
  actionType,
  targetType,
  targetId,
  reason = '',
  previousValue = null,
  newValue = null
}) => {
  try {
    return await AdminAction.create({
      adminId,
      actionType,
      targetType,
      targetId,
      reason,
      previousValue,
      newValue,
      createdAt: new Date()
    });
  } catch (err) {
    console.error('[Admin Action Log Error]:', err.message);
    return null;
  }
};

/**
 * @desc    Get complete real platform statistics for Admin Dashboard
 * @route   GET /api/admin/dashboard
 * @access  Private (Admin only)
 */
export const getAdminDashboardStats = async (req, res, next) => {
  try {
    // 1. Core Platform Statistics from actual database collections
    const [
      totalUsers,
      totalDonors,
      totalVolunteers,
      totalHomes,
      pendingHomes,
      underReviewHomes,
      approvedHomes,
      rejectedHomes,
      needsInfoHomes,
      totalDonations,
      pendingDonations,
      completedDonations,
      cancelledDonations,
      totalOpportunities,
      totalApplications,
      acceptedApplications,
      completedApplications,
      totalReports,
      pendingReports
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'donor' }),
      User.countDocuments({ role: 'volunteer' }),
      Organization.countDocuments(),
      Organization.countDocuments({ verificationStatus: 'PENDING' }),
      Organization.countDocuments({ verificationStatus: 'UNDER_REVIEW' }),
      Organization.countDocuments({ verificationStatus: 'VERIFIED' }),
      Organization.countDocuments({ verificationStatus: 'REJECTED' }),
      Organization.countDocuments({ verificationStatus: 'NEEDS_INFORMATION' }),
      Donation.countDocuments(),
      Donation.countDocuments({ status: 'PENDING' }),
      Donation.countDocuments({ status: 'COMPLETED' }),
      Donation.countDocuments({ status: 'CANCELLED' }),
      VolunteerOpportunity.countDocuments(),
      VolunteerApplication.countDocuments(),
      VolunteerApplication.countDocuments({ status: 'ACCEPTED' }),
      VolunteerApplication.countDocuments({ status: 'COMPLETED' }),
      UserReport.countDocuments(),
      UserReport.countDocuments({ status: { $in: ['PENDING', 'UNDER_REVIEW'] } })
    ]);

    // 2. Recent User Registrations (Top 5)
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role status location createdAt phone');

    // 3. Recent Donations (Top 5)
    const recentDonations = await Donation.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('donorId', 'name email phone')
      .populate('homeId', 'name city state');

    // 4. Pending Home Verification Requests (Top 5)
    const pendingVerifications = await Organization.find({
      verificationStatus: { $in: ['PENDING', 'UNDER_REVIEW', 'NEEDS_INFORMATION'] }
    })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('user', 'name email phone');

    // 5. Recent Reports (Top 5)
    const recentReports = await UserReport.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('reporterId', 'name email role');

    // 6. Recent Admin Actions (Audit Trail top 5)
    const recentActions = await AdminAction.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('adminId', 'name email');

    return res.status(200).json({
      success: true,
      message: 'Admin dashboard statistics retrieved successfully.',
      data: {
        stats: {
          totalUsers,
          totalDonors,
          totalVolunteers,
          totalHomes,
          pendingHomes: pendingHomes + underReviewHomes,
          approvedHomes,
          rejectedHomes,
          needsInfoHomes,
          totalDonationRequests: totalDonations,
          pendingDonations,
          completedDonations,
          cancelledDonations,
          totalVolunteerOpportunities: totalOpportunities,
          totalVolunteerApplications: totalApplications,
          acceptedApplications,
          completedApplications,
          totalReports,
          pendingReports
        },
        recentUsers,
        recentDonations,
        pendingVerifications,
        recentReports,
        recentActions
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get users list with search and filters
 * @route   GET /api/admin/users
 * @access  Private (Admin only)
 */
export const getAdminUsers = async (req, res, next) => {
  try {
    const { search = '', role = '', status = '', page = 1, limit = 15 } = req.query;

    const query = {};

    if (role && role !== 'all') {
      query.role = role.toLowerCase();
    }

    if (status && status !== 'all') {
      query.status = status.toUpperCase();
    }

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { name: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { phone: { $regex: s, $options: 'i' } },
        { location: { $regex: s, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 15));
    const skip = (pageNum - 1) * limitNum;

    const [total, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .select('-password -otpCode -otpExpiresAt')
    ]);

    return res.status(200).json({
      success: true,
      data: {
        users,
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
 * @desc    Get single user details
 * @route   GET /api/admin/users/:id
 * @access  Private (Admin only)
 */
export const getAdminUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format.' });
    }

    const user = await User.findById(id).select('-password -otpCode -otpExpiresAt');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Contextual role-specific data
    let extraData = {};
    if (user.role === 'home') {
      extraData.organization = await Organization.findOne({ user: user._id });
    } else if (user.role === 'volunteer') {
      extraData.volunteerProfile = await VolunteerProfile.findOne({ volunteerId: user._id });
      extraData.applicationsCount = await VolunteerApplication.countDocuments({ volunteerId: user._id });
    } else if (user.role === 'donor') {
      extraData.donationsCount = await Donation.countDocuments({ donorId: user._id });
    }

    // Reports filed by or against this user
    const reportsAgainst = await UserReport.find({
      reportedEntityType: 'user',
      reportedEntityId: user._id
    });

    return res.status(200).json({
      success: true,
      data: {
        user,
        ...extraData,
        reportsAgainst
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Suspend a user account
 * @route   PATCH /api/admin/users/:id/suspend
 * @access  Private (Admin only)
 */
export const suspendUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A suspension reason is mandatory for auditing.'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID.' });
    }

    // Prevent administrator from suspending themselves
    if (req.user._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: 'Security policy violation: Administrators cannot suspend their own active account.'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const previousStatus = user.status;
    user.status = 'SUSPENDED';
    user.suspensionReason = reason.trim();
    user.suspendedAt = new Date();
    user.suspendedBy = req.user._id;

    await user.save();

    await logAdminAction({
      adminId: req.user._id,
      actionType: 'SUSPEND_USER',
      targetType: 'User',
      targetId: user._id,
      reason: reason.trim(),
      previousValue: previousStatus,
      newValue: 'SUSPENDED'
    });

    return res.status(200).json({
      success: true,
      message: `User account '${user.name}' has been suspended.`,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reactivate a suspended user account
 * @route   PATCH /api/admin/users/:id/reactivate
 * @access  Private (Admin only)
 */
export const reactivateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason = 'Account reactivated by administrator after review.' } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID.' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const previousStatus = user.status;
    user.status = 'ACTIVE';
    user.suspensionReason = '';
    user.suspendedAt = null;
    user.suspendedBy = null;

    await user.save();

    await logAdminAction({
      adminId: req.user._id,
      actionType: 'REACTIVATE_USER',
      targetType: 'User',
      targetId: user._id,
      reason: reason.trim(),
      previousValue: previousStatus,
      newValue: 'ACTIVE'
    });

    return res.status(200).json({
      success: true,
      message: `User account '${user.name}' has been reactivated.`,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all old-age homes with filters
 * @route   GET /api/admin/homes
 * @access  Private (Admin only)
 */
export const getAdminHomes = async (req, res, next) => {
  try {
    const { search = '', status = '', page = 1, limit = 15 } = req.query;

    const query = {};

    if (status && status !== 'All' && status !== 'all') {
      query.verificationStatus = status.toUpperCase();
    }

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { name: { $regex: s, $options: 'i' } },
        { city: { $regex: s, $options: 'i' } },
        { state: { $regex: s, $options: 'i' } },
        { registrationNumber: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { phone: { $regex: s, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 15));
    const skip = (pageNum - 1) * limitNum;

    const [total, homes] = await Promise.all([
      Organization.countDocuments(query),
      Organization.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('user', 'name email phone status')
    ]);

    return res.status(200).json({
      success: true,
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
 * @desc    Get pending home verification requests
 * @route   GET /api/admin/homes/pending
 * @access  Private (Admin only)
 */
export const getAdminPendingHomes = async (req, res, next) => {
  try {
    const homes = await Organization.find({
      verificationStatus: { $in: ['PENDING', 'UNDER_REVIEW', 'NEEDS_INFORMATION'] }
    })
      .sort({ updatedAt: -1 })
      .populate('user', 'name email phone status');

    return res.status(200).json({
      success: true,
      data: { homes, count: homes.length }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single old-age home details for verification
 * @route   GET /api/admin/homes/:id
 * @access  Private (Admin only)
 */
export const getAdminHomeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid organization ID.' });
    }

    const home = await Organization.findById(id).populate('user', 'name email phone status createdAt');
    if (!home) {
      return res.status(404).json({ success: false, message: 'Old-age home not found.' });
    }

    // Verification records from dedicated model
    const verifications = await HomeVerification.find({ homeId: home._id })
      .sort({ createdAt: -1 })
      .populate('reviewedBy', 'name email');

    // Associated reports
    const reports = await UserReport.find({
      reportedEntityType: 'home',
      reportedEntityId: home._id
    });

    return res.status(200).json({
      success: true,
      data: {
        home,
        verifications,
        reports
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve an old-age home
 * @route   PATCH /api/admin/homes/:id/verify
 * @access  Private (Admin only)
 */
export const verifyHome = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes = '', checklist = {} } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid organization ID.' });
    }

    const home = await Organization.findById(id);
    if (!home) {
      return res.status(404).json({ success: false, message: 'Old-age home not found.' });
    }

    const previousStatus = home.verificationStatus;
    home.verificationStatus = 'VERIFIED';
    home.verifiedAt = new Date();
    home.verifiedBy = req.user._id;
    home.verificationNotes = notes.trim();
    home.rejectionReason = '';

    if (checklist && typeof checklist === 'object') {
      home.checklist = { ...home.checklist, ...checklist };
    }

    home.verificationHistory.push({
      status: 'VERIFIED',
      reviewedBy: req.user._id,
      reviewedByName: req.user.name,
      reviewedAt: new Date(),
      notes: notes.trim(),
      checklist: home.checklist
    });

    await home.save();

    // Create HomeVerification audit record
    await HomeVerification.create({
      homeId: home._id,
      verificationStatus: 'VERIFIED',
      submittedDocuments: home.documents || [],
      reviewNotes: notes.trim(),
      reviewedBy: req.user._id,
      reviewedAt: new Date()
    });

    await logAdminAction({
      adminId: req.user._id,
      actionType: 'APPROVE_HOME',
      targetType: 'Organization',
      targetId: home._id,
      reason: notes.trim() || 'All legal documents verified.',
      previousValue: previousStatus,
      newValue: 'VERIFIED'
    });

    // Notify organization owner
    if (home.user) {
      await createNotification({
        recipientId: home.user,
        type: 'VERIFICATION',
        title: 'Organization Verification Approved',
        message: `Congratulations! Your organization '${home.name}' has been verified. You can now post requirements and volunteer opportunities.`,
        relatedEntityType: 'Organization',
        relatedEntityId: home._id,
        link: '/home/dashboard'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Organization '${home.name}' has been successfully verified!`,
      data: { home }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reject an old-age home with a reason
 * @route   PATCH /api/admin/homes/:id/reject
 * @access  Private (Admin only)
 */
export const rejectHome = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, notes = '' } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A rejection reason is mandatory to guide the organization.'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid organization ID.' });
    }

    const home = await Organization.findById(id);
    if (!home) {
      return res.status(404).json({ success: false, message: 'Old-age home not found.' });
    }

    const previousStatus = home.verificationStatus;
    home.verificationStatus = 'REJECTED';
    home.rejectionReason = reason.trim();
    home.verificationNotes = notes.trim();

    home.verificationHistory.push({
      status: 'REJECTED',
      reviewedBy: req.user._id,
      reviewedByName: req.user.name,
      reviewedAt: new Date(),
      notes: notes.trim(),
      rejectionReason: reason.trim(),
      checklist: home.checklist
    });

    await home.save();

    await HomeVerification.create({
      homeId: home._id,
      verificationStatus: 'REJECTED',
      submittedDocuments: home.documents || [],
      reviewNotes: notes.trim(),
      rejectionReason: reason.trim(),
      reviewedBy: req.user._id,
      reviewedAt: new Date()
    });

    await logAdminAction({
      adminId: req.user._id,
      actionType: 'REJECT_HOME',
      targetType: 'Organization',
      targetId: home._id,
      reason: reason.trim(),
      previousValue: previousStatus,
      newValue: 'REJECTED'
    });

    // Notify organization owner
    if (home.user) {
      await createNotification({
        recipientId: home.user,
        type: 'VERIFICATION',
        title: 'Organization Verification Update',
        message: `Your organization '${home.name}' verification was rejected. Reason: ${reason.trim()}`,
        relatedEntityType: 'Organization',
        relatedEntityId: home._id,
        link: '/home/verification'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Organization '${home.name}' verification was rejected.`,
      data: { home }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Request additional information from an old-age home
 * @route   PATCH /api/admin/homes/:id/request-information
 * @access  Private (Admin only)
 */
export const requestInformationFromHome = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes, requiredInfo } = req.body;
    const reasonText = (notes || requiredInfo || '').trim();

    if (!reasonText) {
      return res.status(400).json({
        success: false,
        message: 'Please specify the additional information or documents required from the organization.'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid organization ID.' });
    }

    const home = await Organization.findById(id);
    if (!home) {
      return res.status(404).json({ success: false, message: 'Old-age home not found.' });
    }

    const previousStatus = home.verificationStatus;
    home.verificationStatus = 'NEEDS_INFORMATION';
    home.verificationNotes = reasonText;

    home.verificationHistory.push({
      status: 'NEEDS_INFORMATION',
      reviewedBy: req.user._id,
      reviewedByName: req.user.name,
      reviewedAt: new Date(),
      notes: reasonText,
      checklist: home.checklist
    });

    await home.save();

    await HomeVerification.create({
      homeId: home._id,
      verificationStatus: 'NEEDS_INFORMATION',
      submittedDocuments: home.documents || [],
      reviewNotes: reasonText,
      reviewedBy: req.user._id,
      reviewedAt: new Date()
    });

    await logAdminAction({
      adminId: req.user._id,
      actionType: 'REQUEST_INFO_HOME',
      targetType: 'Organization',
      targetId: home._id,
      reason: reasonText,
      previousValue: previousStatus,
      newValue: 'NEEDS_INFORMATION'
    });

    // Notify organization owner
    if (home.user) {
      await createNotification({
        recipientId: home.user,
        type: 'VERIFICATION',
        title: 'Additional Verification Information Requested',
        message: `Action Required: Please provide additional details for '${home.name}'. Details: ${reasonText}`,
        relatedEntityType: 'Organization',
        relatedEntityId: home._id,
        link: '/home/verification'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Information request dispatched to '${home.name}'. Status updated to NEEDS_INFORMATION.`,
      data: { home }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Monitor all donations with search and filters (Read-only monitoring)
 * @route   GET /api/admin/donations
 * @access  Private (Admin only)
 */
export const getAdminDonations = async (req, res, next) => {
  try {
    const { search = '', status = '', category = '', page = 1, limit = 15 } = req.query;

    const query = {};

    if (status && status !== 'All' && status !== 'all') {
      query.status = status.toUpperCase();
    }

    if (category && category !== 'All' && category !== 'all') {
      query.category = category;
    }

    if (search && search.trim()) {
      const s = search.trim();
      const isObjectId = mongoose.Types.ObjectId.isValid(s);
      if (isObjectId) {
        query.$or = [{ _id: s }, { itemName: { $regex: s, $options: 'i' } }];
      } else {
        query.itemName = { $regex: s, $options: 'i' };
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 15));
    const skip = (pageNum - 1) * limitNum;

    const [total, donations] = await Promise.all([
      Donation.countDocuments(query),
      Donation.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('donorId', 'name email phone status')
        .populate('homeId', 'name city state phone verificationStatus')
        .populate('homeUser', 'name email')
    ]);

    // Check for any reports against these donations
    const donationIds = donations.map((d) => d._id);
    const reports = await UserReport.find({
      reportedEntityType: 'donation',
      reportedEntityId: { $in: donationIds }
    });
    const reportedMap = new Set(reports.map((r) => r.reportedEntityId.toString()));

    const donationsWithMeta = donations.map((d) => {
      const obj = d.toObject();
      obj.isReported = reportedMap.has(d._id.toString());
      return obj;
    });

    return res.status(200).json({
      success: true,
      data: {
        donations: donationsWithMeta,
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
 * @desc    Monitor registered volunteers and their profiles
 * @route   GET /api/admin/volunteers
 * @access  Private (Admin only)
 */
export const getAdminVolunteers = async (req, res, next) => {
  try {
    const { search = '', page = 1, limit = 15 } = req.query;

    const userQuery = { role: 'volunteer' };

    if (search && search.trim()) {
      const s = search.trim();
      userQuery.$or = [
        { name: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { phone: { $regex: s, $options: 'i' } },
        { location: { $regex: s, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 15));
    const skip = (pageNum - 1) * limitNum;

    const [total, volunteers] = await Promise.all([
      User.countDocuments(userQuery),
      User.find(userQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .select('-password -otpCode -otpExpiresAt')
    ]);

    // Fetch matching profiles and application counts
    const volunteerIds = volunteers.map((v) => v._id);
    const [profiles, appCounts] = await Promise.all([
      VolunteerProfile.find({ volunteerId: { $in: volunteerIds } }),
      VolunteerApplication.aggregate([
        { $match: { volunteerId: { $in: volunteerIds } } },
        { $group: { _id: '$volunteerId', count: { $sum: 1 } } }
      ])
    ]);

    const profileMap = new Map(profiles.map((p) => [p.volunteerId.toString(), p]));
    const countMap = new Map(appCounts.map((a) => [a._id.toString(), a.count]));

    const enriched = volunteers.map((v) => {
      const obj = v.toObject();
      obj.profile = profileMap.get(v._id.toString()) || null;
      obj.applicationsCount = countMap.get(v._id.toString()) || 0;
      return obj;
    });

    return res.status(200).json({
      success: true,
      data: {
        volunteers: enriched,
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
 * @desc    Monitor volunteer opportunities
 * @route   GET /api/admin/volunteer-opportunities
 * @access  Private (Admin only)
 */
export const getAdminVolunteerOpportunities = async (req, res, next) => {
  try {
    const { search = '', status = '', page = 1, limit = 15 } = req.query;

    const query = {};
    if (status && status !== 'All' && status !== 'all') {
      query.status = status;
    }

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { title: { $regex: s, $options: 'i' } },
        { category: { $regex: s, $options: 'i' } },
        { location: { $regex: s, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 15));
    const skip = (pageNum - 1) * limitNum;

    const [total, opportunities] = await Promise.all([
      VolunteerOpportunity.countDocuments(query),
      VolunteerOpportunity.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('homeId', 'name city state phone verificationStatus')
        .populate('homeUser', 'name email')
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

/**
 * @desc    Monitor volunteer applications
 * @route   GET /api/admin/volunteer-applications
 * @access  Private (Admin only)
 */
export const getAdminVolunteerApplications = async (req, res, next) => {
  try {
    const { search = '', status = '', page = 1, limit = 15 } = req.query;

    const query = {};
    if (status && status !== 'All' && status !== 'all') {
      query.status = status.toUpperCase();
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 15));
    const skip = (pageNum - 1) * limitNum;

    const [total, applications] = await Promise.all([
      VolunteerApplication.countDocuments(query),
      VolunteerApplication.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('volunteerId', 'name email phone status')
        .populate({
          path: 'opportunityId',
          select: 'title category eventDate location status homeId',
          populate: { path: 'homeId', select: 'name city state' }
        })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        applications,
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
 * @desc    Get donation categories with donation usage count
 * @route   GET /api/admin/categories
 * @access  Private (Admin only)
 */
export const getAdminCategories = async (req, res, next) => {
  try {
    const categories = await DonationCategory.find().sort({ name: 1 });

    // Aggregate counts of donations per category
    const counts = await Donation.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const countMap = new Map(counts.map((c) => [c._id, c.count]));

    const result = categories.map((cat) => {
      const obj = cat.toObject();
      obj.donationCount = countMap.get(cat.name) || 0;
      return obj;
    });

    return res.status(200).json({
      success: true,
      data: { categories: result }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new donation category
 * @route   POST /api/admin/categories
 * @access  Private (Admin only)
 */
export const createCategory = async (req, res, next) => {
  try {
    const { name, description = '', isActive = true } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a category name.'
      });
    }

    const cleanName = name.trim();

    // Prevent duplicate category names (case-insensitive)
    const existing = await DonationCategory.findOne({
      name: { $regex: `^${cleanName}$`, $options: 'i' }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A category named '${cleanName}' already exists.`
      });
    }

    const category = await DonationCategory.create({
      name: cleanName,
      description: description.trim(),
      isActive: Boolean(isActive)
    });

    await logAdminAction({
      adminId: req.user._id,
      actionType: 'CREATE_CATEGORY',
      targetType: 'DonationCategory',
      targetId: category._id,
      reason: `Category '${category.name}' created.`,
      newValue: category.toObject()
    });

    return res.status(201).json({
      success: true,
      message: `Category '${category.name}' created successfully.`,
      data: { category }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update existing donation category
 * @route   PUT /api/admin/categories/:id
 * @access  Private (Admin only)
 */
export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid category ID.' });
    }

    const category = await DonationCategory.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    const prevObj = category.toObject();

    if (name && name.trim()) {
      const cleanName = name.trim();
      if (cleanName.toLowerCase() !== category.name.toLowerCase()) {
        const duplicate = await DonationCategory.findOne({
          _id: { $ne: category._id },
          name: { $regex: `^${cleanName}$`, $options: 'i' }
        });
        if (duplicate) {
          return res.status(400).json({
            success: false,
            message: `Another category named '${cleanName}' already exists.`
          });
        }
      }
      category.name = cleanName;
    }

    if (description !== undefined) {
      category.description = description.trim();
    }

    await category.save();

    await logAdminAction({
      adminId: req.user._id,
      actionType: 'UPDATE_CATEGORY',
      targetType: 'DonationCategory',
      targetId: category._id,
      previousValue: prevObj,
      newValue: category.toObject()
    });

    return res.status(200).json({
      success: true,
      message: 'Category updated successfully.',
      data: { category }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle category active / inactive status
 * @route   PATCH /api/admin/categories/:id/status
 * @access  Private (Admin only)
 */
export const toggleCategoryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid category ID.' });
    }

    const category = await DonationCategory.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    const previousValue = category.isActive;
    category.isActive = isActive !== undefined ? Boolean(isActive) : !category.isActive;
    await category.save();

    await logAdminAction({
      adminId: req.user._id,
      actionType: 'TOGGLE_CATEGORY_STATUS',
      targetType: 'DonationCategory',
      targetId: category._id,
      reason: `Category '${category.name}' set to ${category.isActive ? 'ACTIVE' : 'INACTIVE'}`,
      previousValue,
      newValue: category.isActive
    });

    return res.status(200).json({
      success: true,
      message: `Category '${category.name}' is now ${category.isActive ? 'active' : 'inactive'}.`,
      data: { category }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete category or prevent if referenced
 * @route   DELETE /api/admin/categories/:id
 * @access  Private (Admin only)
 */
export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid category ID.' });
    }

    const category = await DonationCategory.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    // Safety rule: Do NOT delete categories that are already referenced by donation records
    const donationCount = await Donation.countDocuments({ category: category.name });
    if (donationCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete '${category.name}' because ${donationCount} donation record(s) reference it. Please deactivate the category instead.`
      });
    }

    await DonationCategory.findByIdAndDelete(id);

    await logAdminAction({
      adminId: req.user._id,
      actionType: 'DELETE_CATEGORY',
      targetType: 'DonationCategory',
      targetId: id,
      reason: `Category '${category.name}' deleted.`,
      previousValue: category.toObject()
    });

    return res.status(200).json({
      success: true,
      message: `Category '${category.name}' removed successfully.`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get active donation categories for donors (Public or Authenticated)
 * @route   GET /api/categories
 * @access  Public
 */
export const getActiveCategories = async (req, res, next) => {
  try {
    const categories = await DonationCategory.find({ isActive: true }).sort({ name: 1 });
    return res.status(200).json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get administrative audit trail actions
 * @route   GET /api/admin/actions
 * @access  Private (Admin only)
 */
export const getAdminAuditActions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, targetType = '' } = req.query;

    const query = {};
    if (targetType) {
      query.targetType = targetType;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [total, actions] = await Promise.all([
      AdminAction.countDocuments(query),
      AdminAction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('adminId', 'name email role')
    ]);

    return res.status(200).json({
      success: true,
      data: {
        actions,
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
