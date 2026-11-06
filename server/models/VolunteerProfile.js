import mongoose from 'mongoose';

const volunteerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required for volunteer profile.'],
      unique: true
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [1000, 'Bio cannot exceed 1000 characters.'],
      default: ''
    },
    skills: {
      type: [String],
      default: []
    },
    interests: {
      type: [String],
      default: []
    },
    availability: {
      type: [String],
      default: ['Flexible']
    },
    preferredLocation: {
      type: String,
      trim: true,
      default: ''
    },
    preferredWorkTypes: {
      type: [String],
      default: []
    },
    experience: {
      type: String,
      trim: true,
      maxlength: [1500, 'Experience details cannot exceed 1500 characters.'],
      default: ''
    }
  },
  {
    timestamps: true
  }
);

volunteerProfileSchema.index({ preferredLocation: 1 });

const VolunteerProfile = mongoose.model('VolunteerProfile', volunteerProfileSchema);

export default VolunteerProfile;
