import mongoose from 'mongoose';

const statusHistorySchema = new mongoose.Schema(
  {
    previousStatus: {
      type: String,
      default: null
    },
    newStatus: {
      type: String,
      required: true,
      enum: [
        'PENDING',
        'ACCEPTED',
        'REJECTED',
        'SCHEDULED',
        'DELIVERED',
        'COMPLETED',
        'CANCELLED'
      ]
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    actorRole: {
      type: String,
      enum: ['donor', 'home', 'admin', 'system'],
      default: 'donor'
    },
    reason: {
      type: String,
      trim: true,
      default: ''
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const donationSchema = new mongoose.Schema(
  {
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Donor ID is required.']
    },
    homeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Old-age home organization ID is required.']
    },
    homeUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    category: {
      type: String,
      required: [true, 'Donation category is required.'],
      trim: true
    },
    itemName: {
      type: String,
      required: [true, 'Item or donation title is required.'],
      trim: true,
      maxlength: [200, 'Item title cannot exceed 200 characters.']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required.'],
      min: [1, 'Quantity must be at least 1.']
    },
    unit: {
      type: String,
      required: [true, 'Unit is required (e.g., units, kg, boxes, packets).'],
      trim: true,
      default: 'units'
    },
    message: {
      type: String,
      trim: true,
      default: ''
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    preferredDeliveryDate: {
      type: Date,
      required: [true, 'Preferred delivery date is required.']
    },
    scheduledDate: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: [
          'PENDING',
          'ACCEPTED',
          'REJECTED',
          'SCHEDULED',
          'DELIVERED',
          'COMPLETED',
          'CANCELLED'
        ],
        message: '{VALUE} is not a valid donation status.'
      },
      default: 'PENDING'
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: ''
    },
    deliveredAt: {
      type: Date,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    },
    statusHistory: [statusHistorySchema]
  },
  {
    timestamps: true
  }
);

// Indexes for fast lookups and reporting
donationSchema.index({ donorId: 1, createdAt: -1 });
donationSchema.index({ homeId: 1, status: 1 });
donationSchema.index({ homeUser: 1, status: 1 });
donationSchema.index({ status: 1 });

const Donation = mongoose.model('Donation', donationSchema);

export default Donation;
