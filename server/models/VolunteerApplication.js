import mongoose from 'mongoose';

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'COMPLETED']
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      default: ''
    }
  },
  { _id: false }
);

const volunteerApplicationSchema = new mongoose.Schema(
  {
    opportunityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VolunteerOpportunity',
      required: [true, 'Opportunity ID is required.']
    },
    volunteerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Volunteer user ID is required.']
    },
    motivation: {
      type: String,
      trim: true,
      maxlength: [1000, 'Motivation cannot exceed 1000 characters.'],
      default: ''
    },
    relevantSkills: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: {
        values: ['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'COMPLETED'],
        message: '{VALUE} is not a valid application status.'
      },
      default: 'PENDING'
    },
    statusHistory: [statusHistorySchema],
    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Enforce uniqueness for the (opportunityId, volunteerId) pair so duplicate applications cannot be created
volunteerApplicationSchema.index({ opportunityId: 1, volunteerId: 1 }, { unique: true });
volunteerApplicationSchema.index({ volunteerId: 1, status: 1 });
volunteerApplicationSchema.index({ opportunityId: 1, status: 1 });

const VolunteerApplication = mongoose.model('VolunteerApplication', volunteerApplicationSchema);

export default VolunteerApplication;
