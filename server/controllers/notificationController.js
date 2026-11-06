import mongoose from 'mongoose';
import Notification from '../models/Notification.js';

/**
 * @desc    Get notifications for current logged in user with filters
 * @route   GET /api/notifications
 * @access  Private
 */
export const getNotifications = async (req, res, next) => {
  try {
    const { type = '', isRead = '', page = 1, limit = 20 } = req.query;

    const query = { recipientId: req.user._id };

    if (type && type !== 'All' && type !== 'all') {
      query.type = type.toUpperCase();
    }

    if (isRead !== '' && isRead !== undefined) {
      if (isRead === 'true') query.isRead = true;
      if (isRead === 'false') query.isRead = false;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [total, unreadCount, notifications] = await Promise.all([
      Notification.countDocuments(query),
      Notification.countDocuments({ recipientId: req.user._id, isRead: false }),
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
    ]);

    return res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
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
 * @desc    Get live unread notifications count for badge display
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
export const getUnreadNotificationCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      recipientId: req.user._id,
      isRead: false
    });

    return res.status(200).json({
      success: true,
      data: { unreadCount: count }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark a single notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
export const markNotificationAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid notification ID.' });
    }

    const notification = await Notification.findOne({
      _id: id,
      recipientId: req.user._id // Ownership protection
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
    }

    const remainingUnread = await Notification.countDocuments({
      recipientId: req.user._id,
      isRead: false
    });

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      data: { notification, unreadCount: remainingUnread }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark all unread notifications as read for current user
 * @route   PATCH /api/notifications/read-all
 * @access  Private
 */
export const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { recipientId: req.user._id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    return res.status(200).json({
      success: true,
      message: `Marked ${result.modifiedCount || 0} notifications as read.`,
      data: { unreadCount: 0 }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete or dismiss a notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid notification ID.' });
    }

    const deleted = await Notification.findOneAndDelete({
      _id: id,
      recipientId: req.user._id // Ownership protection
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification dismissed successfully.'
    });
  } catch (error) {
    next(error);
  }
};

