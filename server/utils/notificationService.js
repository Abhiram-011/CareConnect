import Notification from '../models/Notification.js';
import User from '../models/User.js';

/**
 * Safely create an in-app notification without interrupting main application flow
 */
export const createNotification = async ({
  recipientId,
  type = 'SYSTEM',
  title,
  message,
  relatedEntityType = 'other',
  relatedEntityId = null,
  link = ''
}) => {
  try {
    if (!recipientId || !title || !message) {
      return null;
    }

    // Normalize relatedEntityId to string for consistent storage and querying
    const normalizedEntityId = relatedEntityId ? relatedEntityId.toString() : null;

    // Deduplication check: Avoid sending identical notification to same recipient within 2 minutes
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const existing = await Notification.findOne({
      recipientId,
      title,
      relatedEntityId: normalizedEntityId,
      createdAt: { $gte: twoMinutesAgo }
    });

    if (existing) {
      return existing;
    }

    const notification = await Notification.create({
      recipientId,
      type,
      title: title.trim(),
      message: message.trim(),
      relatedEntityType,
      relatedEntityId: normalizedEntityId,
      link: link.trim(),
      isRead: false
    });

    return notification;
  } catch (err) {
    console.error('[Notification Service Error]:', err.message);
    return null;
  }
};

/**
 * Send an in-app notification to all platform administrators
 */
export const notifyAdmins = async ({
  type = 'SYSTEM',
  title,
  message,
  relatedEntityType = 'other',
  relatedEntityId = null,
  link = '/admin/dashboard'
}) => {
  try {
    const admins = await User.find({ role: 'admin', status: 'ACTIVE' }).select('_id');
    const promises = admins.map((admin) =>
      createNotification({
        recipientId: admin._id,
        type,
        title,
        message,
        relatedEntityType,
        relatedEntityId,
        link
      })
    );
    await Promise.all(promises);
  } catch (err) {
    console.error('[Notify Admins Error]:', err.message);
  }
};

