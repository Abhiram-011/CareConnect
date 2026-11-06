import mongoose from 'mongoose';

const requirementSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Please enter a requirement title.'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters.']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    category: {
      type: String,
      required: [true, 'Please select a category.'],
      enum: {
        values: [
          'Groceries & Food',
          'Medical & Healthcare',
          'Hygiene & Sanitation',
          'Bedding & Clothing',
          'Mobility & Assistive Devices',
          'Facility & Maintenance',
          'Recreational & Educational',
          'Other'
        ],
        message: '{VALUE} is not a supported category.'
      },
      default: 'Groceries & Food'
    },
    unit: {
      type: String,
      required: [true, 'Please specify unit of measurement (e.g. kg, boxes, packets, units).'],
      trim: true,
      default: 'units'
    },
    quantityRequired: {
      type: Number,
      required: [true, 'Please enter quantity required.'],
      min: [1, 'Required quantity must be at least 1.']
    },
    quantityFulfilled: {
      type: Number,
      default: 0,
      min: [0, 'Fulfilled quantity cannot be negative.']
    },
    urgency: {
      type: String,
      enum: {
        values: ['High', 'Medium', 'Low'],
        message: '{VALUE} is not a valid urgency level.'
      },
      default: 'Medium'
    },
    status: {
      type: String,
      enum: {
        values: ['Open', 'Partially Fulfilled', 'Fulfilled', 'Closed'],
        message: '{VALUE} is not a valid requirement status.'
      },
      default: 'Open'
    },
    neededByDate: {
      type: Date
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual: Remaining quantity
requirementSchema.virtual('remainingQuantity').get(function () {
  const remaining = (this.quantityRequired || 0) - (this.quantityFulfilled || 0);
  return remaining > 0 ? remaining : 0;
});

// Virtual: Progress percentage
requirementSchema.virtual('progressPercentage').get(function () {
  if (!this.quantityRequired || this.quantityRequired === 0) return 0;
  const pct = Math.round(((this.quantityFulfilled || 0) / this.quantityRequired) * 100);
  return pct > 100 ? 100 : pct;
});

// Auto update status based on fulfillment before save
requirementSchema.pre('save', function (next) {
  if (this.status !== 'Closed') {
    if (this.quantityFulfilled >= this.quantityRequired && this.quantityRequired > 0) {
      this.status = 'Fulfilled';
    } else if (this.quantityFulfilled > 0) {
      this.status = 'Partially Fulfilled';
    } else {
      this.status = 'Open';
    }
  }
  next();
});

const Requirement = mongoose.model('Requirement', requirementSchema);

export default Requirement;
