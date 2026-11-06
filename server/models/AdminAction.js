import mongoose from 'mongoose';

const adminActionSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Admin user ID is required.']
    },
    actionType: {
      type: String,
      required: [true, 'Action type is required.'],
      trim: true
    },
    targetType: {
      type: String,
      required: [true, 'Target entity type is required.'],
      trim: true
    },
    targetId: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Target ID is required.']
    },
    reason: {
      type: String,
      trim: true,
      default: ''
    },
    previousValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false
  }
);

adminActionSchema.index({ adminId: 1, createdAt: -1 });
adminActionSchema.index({ targetType: 1, targetId: 1 });
adminActionSchema.index({ createdAt: -1 });

const AdminAction = mongoose.model('AdminAction', adminActionSchema);

export default AdminAction;

