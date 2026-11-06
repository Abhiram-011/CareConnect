import mongoose from 'mongoose';

const userReportSchema = new mongoose.Schema(
  {
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter user ID is required.']
    },
    reportedEntityId: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Reported entity ID is required.']
    },
    reportedEntityType: {
      type: String,
      enum: {
        values: ['user', 'home', 'donation', 'volunteer', 'opportunity'],
        message: '{VALUE} is not a supported report entity type.'
      },
      required: [true, 'Reported entity type is required.']
    },
    category: {
      type: String,
      required: [true, 'Report category is required.'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Report description is required.'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters.']
    },
    status: {
      type: String,
      enum: ['PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'],
      default: 'PENDING'
    },
    adminNotes: {
      type: String,
      trim: true,
      default: ''
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

userReportSchema.index({ status: 1, createdAt: -1 });
userReportSchema.index({ reportedEntityType: 1, reportedEntityId: 1 });
userReportSchema.index({ reporterId: 1 });

const UserReport = mongoose.model('UserReport', userReportSchema);

export default UserReport;

