import mongoose from 'mongoose';
import UserReport from '../models/UserReport.js';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import Donation from '../models/Donation.js';
import VolunteerOpportunity from '../models/VolunteerOpportunity.js';
import { logAdminAction } from './adminController.js';
import { notifyAdmins } from '../utils/notificationService.js';

/**
 * @desc    Submit a new report against an entity (User, Home, Donation, Opportunity)
 * @route   POST /api/reports
 * @access  Private (Authenticated users)
 */
export const createReport = async (req, res, next) => {
  try {
    const { reportedEntityId, reportedEntityType, category, description } = req.body;

    if (!reportedEntityId) {
      return res.status(400).json({
        success: false,
        message: 'Reported entity ID is required.'
      });
    }

    const validTypes = ['user', 'home', 'donation', 'volunteer', 'opportunity'];
    if (!reportedEntityType || !validTypes.includes(reportedEntityType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid reported entity type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    if (!category || !category.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please select a report category.'
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a detailed description of the issue or suspicious activity.'
      });
    }

    // Verify entity existence
    let exists = false;
    if (mongoose.Types.ObjectId.isValid(reportedEntityId)) {
      if (reportedEntityType === 'user' || reportedEntityType === 'volunteer') {
        exists = await User.exists({ _id: reportedEntityId });
      } else if (reportedEntityType === 'home') {
        exists = (await Organization.exists({ _id: reportedEntityId })) || (await User.exists({ _id: reportedEntityId, role: 'home' }));
      } else if (reportedEntityType === 'donation') {
        exists = await Donation.exists({ _id: reportedEntityId });
      } else if (reportedEntityType === 'opportunity') {
        exists = await VolunteerOpportunity.exists({ _id: reportedEntityId });
      }
    } else {
      exists = true; // Fallback for custom identifier
    }

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: `The reported ${reportedEntityType} could not be located.`
      });
    }

    const report = await UserReport.create({
      reporterId: req.user._id,
      reportedEntityId,
      reportedEntityType,
      category: category.trim(),
      description: description.trim(),
      status: 'PENDING'
    });

    // Notify admins about the new report
    await notifyAdmins({
      type: 'SYSTEM',
      title: 'New User Report Submitted',
      message: `A new report regarding a ${reportedEntityType} (${category}) has been submitted for review.`,
      relatedEntityType: 'UserReport',
      relatedEntityId: report._id,
      link: '/admin/reports'
    });

    return res.status(201).json({
      success: true,
      message: 'Report submitted successfully. Platform administrators will review this issue.',
      data: {
        report: {
          _id: report._id,
          category: report.category,
          status: report.status,
          createdAt: report.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get reports submitted by current user (Without internal adminNotes)
 * @route   GET /api/reports/my
 * @access  Private (Authenticated users)
 */
export const getMyReports = async (req, res, next) => {
  try {
    const reports = await UserReport.find({ reporterId: req.user._id })
      .sort({ createdAt: -1 })
      .select('-adminNotes'); // Confidential: never expose internal admin notes to reporter

    return res.status(200).json({
      success: true,
      data: { reports }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all reports with filters (Admin only)
 * @route   GET /api/admin/reports
 * @access  Private (Admin only)
 */
export const getAdminReports = async (req, res, next) => {
  try {
    const { status = '', category = '', entityType = '', page = 1, limit = 15 } = req.query;

    const query = {};

    if (status && status !== 'All' && status !== 'all') {
      query.status = status.toUpperCase();
    }

    if (category && category !== 'All' && category !== 'all') {
      query.category = category;
    }

    if (entityType && entityType !== 'All' && entityType !== 'all') {
      query.reportedEntityType = entityType.toLowerCase();
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 15));
    const skip = (pageNum - 1) * limitNum;

    const [total, reports] = await Promise.all([
      UserReport.countDocuments(query),
      UserReport.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('reporterId', 'name email role phone')
        .populate('reviewedBy', 'name email')
    ]);

    return res.status(200).json({
      success: true,
      data: {
        reports,
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
 * @desc    Get single report by ID with target entity preview (Admin only)
 * @route   GET /api/admin/reports/:id
 * @access  Private (Admin only)
 */
export const getAdminReportById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid report ID.' });
    }

    const report = await UserReport.findById(id)
      .populate('reporterId', 'name email role phone')
      .populate('reviewedBy', 'name email');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    // Fetch entity preview
    let entityPreview = null;
    try {
      if (report.reportedEntityType === 'user' || report.reportedEntityType === 'volunteer') {
        entityPreview = await User.findById(report.reportedEntityId).select('-password -otpCode');
      } else if (report.reportedEntityType === 'home') {
        entityPreview = await Organization.findById(report.reportedEntityId).populate('user', 'name email phone');
      } else if (report.reportedEntityType === 'donation') {
        entityPreview = await Donation.findById(report.reportedEntityId)
          .populate('donorId', 'name email')
          .populate('homeId', 'name city state');
      } else if (report.reportedEntityType === 'opportunity') {
        entityPreview = await VolunteerOpportunity.findById(report.reportedEntityId).populate('organizationId', 'name city');
      }
    } catch (e) {
      console.warn('Entity preview lookup failed:', e.message);
    }

    return res.status(200).json({
      success: true,
      data: {
        report,
        entityPreview
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update report status and admin notes (Resolve, Dismiss, Under Review)
 * @route   PATCH /api/admin/reports/:id/status
 * @access  Private (Admin only)
 */
export const updateReportStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNotes = '' } = req.body;

    const validStatuses = ['PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'];
    if (!status || !validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid report ID.' });
    }

    const report = await UserReport.findById(id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    const previousStatus = report.status;
    const nextStatus = status.toUpperCase();

    report.status = nextStatus;
    if (adminNotes && adminNotes.trim()) {
      report.adminNotes = adminNotes.trim();
    }
    report.reviewedBy = req.user._id;

    if (nextStatus === 'RESOLVED' || nextStatus === 'DISMISSED') {
      report.resolvedAt = new Date();
    }

    await report.save();

    await logAdminAction({
      adminId: req.user._id,
      actionType: `REPORT_${nextStatus}`,
      targetType: 'UserReport',
      targetId: report._id,
      reason: adminNotes.trim() || `Status updated from ${previousStatus} to ${nextStatus}`,
      previousValue: previousStatus,
      newValue: nextStatus
    });

    return res.status(200).json({
      success: true,
      message: `Report status updated to ${nextStatus}.`,
      data: { report }
    });
  } catch (error) {
    next(error);
  }
};

