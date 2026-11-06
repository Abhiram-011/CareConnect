import mongoose from 'mongoose';

const donationCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required.'],
      unique: true,
      trim: true,
      maxlength: [100, 'Category name cannot exceed 100 characters.']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

donationCategorySchema.index({ isActive: 1 });

const DonationCategory = mongoose.model('DonationCategory', donationCategorySchema);

export default DonationCategory;
