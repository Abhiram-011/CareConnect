import mongoose from 'mongoose';

export const VOLUNTEER_OPPORTUNITY_CATEGORIES = [
  'Food and essential-supply distribution',
  'Educational or recreational activities',
  'Event assistance',
  'Companionship and social activities',
  'General support',
  'Other'
];

const volunteerOpportunitySchema = new mongoose.Schema(
  {
    homeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Old-age home organization reference is required.']
    },
    homeUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Home user owner reference is required.']
    },
    title: {
      type: String,
      required: [true, 'Opportunity title is required.'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters.']
    },
    description: {
      type: String,
      required: [true, 'Opportunity description is required.'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Opportunity category is required.'],
      enum: {
        values: VOLUNTEER_OPPORTUNITY_CATEGORIES,
        message: '{VALUE} is not a supported volunteer category.'
      }
    },
    requiredSkills: {
      type: [String],
      default: []
    },
    volunteerCapacity: {
      type: Number,
      required: [true, 'Volunteer capacity is required.'],
      min: [1, 'Volunteer capacity must be at least 1.']
    },
    volunteersAccepted: {
      type: Number,
      default: 0,
      min: 0
    },
    location: {
      type: String,
      required: [true, 'Location or venue address is required.'],
      trim: true
    },
    taskDate: {
      type: Date,
      required: [true, 'Task or event date is required.']
    },
    startTime: {
      type: String,
      trim: true,
      default: ''
    },
    endTime: {
      type: String,
      trim: true,
      default: ''
    },
    applicationDeadline: {
      type: Date,
      required: [true, 'Application deadline is required.']
    },
    instructions: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: {
        values: ['OPEN', 'CLOSED', 'CANCELLED'],
        message: '{VALUE} is not a valid opportunity status.'
      },
      default: 'OPEN'
    }
  },
  {
    timestamps: true
  }
);

// Indexes for fast searching and filtering
volunteerOpportunitySchema.index({ status: 1, applicationDeadline: 1, taskDate: 1 });
volunteerOpportunitySchema.index({ homeId: 1, status: 1 });
volunteerOpportunitySchema.index({ category: 1, status: 1 });
volunteerOpportunitySchema.index({ location: 'text', title: 'text', description: 'text' });

const VolunteerOpportunity = mongoose.model('VolunteerOpportunity', volunteerOpportunitySchema);

export default VolunteerOpportunity;
