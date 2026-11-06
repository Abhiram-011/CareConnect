import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient user ID is required.'],
      index: true
    },
    type: {
      type: String,
      enum: {
        values: ['DONATION', 'VOLUNTEER', 'VOLUNTEER_APPLICATION', 'VERIFICATION', 'REPORT', 'SYSTEM'],
        message: '{VALUE} is not a valid notification type.'
      },
      default: 'SYSTEM'
    },
    title: {
      type: String,
      required: [true, 'Notification title is required.'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters.']
    },
    message: {
      type: String,
      required: [true, 'Notification message is required.'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters.']
    },
    relatedEntityType: {
      type: String,
      default: 'other'
    },
    relatedEntityId: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    link: {
      type: String,
      trim: true,
      default: ''
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    readAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for optimal user queries
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, type: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
