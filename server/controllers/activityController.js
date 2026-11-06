import mongoose from 'mongoose';
import Donation from '../models/Donation.js';
import VolunteerApplication from '../models/VolunteerApplication.js';
import Organization from '../models/Organization.js';
import Requirement from '../models/Requirement.js';
import UserReport from '../models/UserReport.js';

/**
 * @desc    Get aggregated activity history for current user
 * @route   GET /api/activity/history
 * @access  Private
 */
export const getActivityHistory = async (req, res, next) => {
  try {
    const activities = [];
    const userId = req.user._id;
    const { type: typeFilter } = req.query;

    // 1. Donor Activities: Donations and their status histories
    if (req.user.role === 'donor') {
      const donations = await Donation.find({ donorId: userId })
        .populate('homeId', 'name city state')
        .sort({ createdAt: -1 })
        .limit(30);

      for (const d of donations) {
        activities.push({
          id: `donation-create-${d._id}`,
          type: 'DONATION',
          title: `Created Donation: ${d.itemName}`,
          description: `Offered ${d.quantity} ${d.unit} to ${d.homeId?.name || 'an elderly home'}.`,
          status: d.status,
          date: d.createdAt,
          timestamp: d.createdAt,
          link: `/donations/${d._id}`
        });

        // Include status history entries only when not filtering strictly for 'DONATION' type
        if (d.statusHistory && d.statusHistory.length > 0) {
          for (const sh of d.statusHistory) {
            activities.push({
              id: `donation-status-${d._id}-${sh.newStatus}-${sh.timestamp}`,
              type: 'DONATION_STATUS',
              title: `Donation Status: ${sh.newStatus}`,
              description: `Donation for '${d.itemName}' transitioned to ${sh.newStatus}. ${sh.reason ? `Reason: ${sh.reason}` : ''}`,
              status: sh.newStatus,
              date: sh.timestamp,
              timestamp: sh.timestamp,
              link: `/donations/${d._id}`
            });
          }
        }
      }
    }

    // 2. Volunteer Activities: Applications and status changes
    if (req.user.role === 'volunteer') {
      const applications = await VolunteerApplication.find({ volunteerId: userId })
        .populate({
          path: 'opportunityId',
          select: 'title category eventDate homeId',
          populate: { path: 'homeId', select: 'name city' }
        })
        .sort({ createdAt: -1 })
        .limit(30);

      for (const app of applications) {
        activities.push({
          id: `volunteer-app-${app._id}`,
          type: 'VOLUNTEER',
          title: `Applied for Opportunity: ${app.opportunityId?.title || 'Elderly Activity'}`,
          description: `Submitted volunteer application for ${app.opportunityId?.homeId?.name || 'Old-Age Home'}.`,
          status: app.status,
          date: app.createdAt,
          timestamp: app.createdAt,
          link: `/tracking/volunteer-applications/${app._id}`
        });

        if (app.statusHistory && app.statusHistory.length > 0) {
          for (const sh of app.statusHistory) {
            activities.push({
              id: `volunteer-status-${app._id}-${sh.status}-${sh.changedAt}`,
              type: 'VOLUNTEER_STATUS',
              title: `Application Status: ${sh.status}`,
              description: `Volunteer opportunity application updated to ${sh.status}.`,
              status: sh.status,
              date: sh.changedAt,
              timestamp: sh.changedAt,
              link: `/tracking/volunteer-applications/${app._id}`
            });
          }
        }
      }
    }

    // 3. Old-Age Home Activities
    if (req.user.role === 'home') {
      const org = await Organization.findOne({ user: userId });
      if (org) {
        // Verification history
        if (org.verificationHistory && org.verificationHistory.length > 0) {
          for (const vh of org.verificationHistory) {
            activities.push({
              id: `home-verify-${org._id}-${vh.status}-${vh.reviewedAt}`,
              type: 'VERIFICATION',
              title: `Verification Status: ${vh.status}`,
              description: vh.notes || (vh.rejectionReason ? `Reason: ${vh.rejectionReason}` : 'Organization verification reviewed.'),
              status: vh.status,
              date: vh.reviewedAt,
              timestamp: vh.reviewedAt,
              link: '/home/dashboard'
            });
          }
        }

        // Requirements posted
        const reqs = await Requirement.find({ organization: org._id }).limit(20);
        for (const r of reqs) {
          activities.push({
            id: `requirement-${r._id}`,
            type: 'REQUIREMENT',
            title: `Posted Supply Requirement: ${r.title}`,
            description: `Needed: ${r.quantityRequired} ${r.unit} (${r.category})`,
            status: r.status,
            date: r.createdAt,
            timestamp: r.createdAt,
            link: '/home/dashboard'
          });
        }
      }
    }

    // 4. Reports filed by current user
    const reports = await UserReport.find({ reporterId: userId }).sort({ createdAt: -1 }).limit(10);
    for (const r of reports) {
      activities.push({
        id: `report-${r._id}`,
        type: 'REPORT',
        title: `Filed Moderation Report: ${r.category}`,
        description: `Report filed for ${r.reportedEntityType}. Current Status: ${r.status}`,
        status: r.status,
        date: r.createdAt,
        timestamp: r.createdAt,
        link: '/profile'
      });
    }

    // Sort all aggregated activities descending by timestamp
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply type filter if provided — treat DONATION filter as matching only 'DONATION' type
    const filtered = typeFilter
      ? activities.filter((a) => a.type === typeFilter.toUpperCase())
      : activities;

    return res.status(200).json({
      success: true,
      data: {
        activities: filtered.slice(0, 50)
      }
    });
  } catch (error) {
    next(error);
  }
};

