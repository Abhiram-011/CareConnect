import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  documentType: {
    type: String,
    required: true,
    enum: [
      'registration_certificate',
      'organization_id',
      'address_proof',
      'facility_photos',
      'other'
    ]
  },
  originalName: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const verificationHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
    enum: ['UNVERIFIED', 'PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'NEEDS_INFORMATION']
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedByName: {
    type: String,
    default: 'Administrator'
  },
  reviewedAt: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    default: ''
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  checklist: {
    organizationDetailsChecked: { type: Boolean, default: false },
    registrationInfoChecked: { type: Boolean, default: false },
    registrationDocChecked: { type: Boolean, default: false },
    addressChecked: { type: Boolean, default: false },
    contactChecked: { type: Boolean, default: false },
    otherDocsChecked: { type: Boolean, default: false }
  }
});

const organizationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: [true, 'Please enter organization name.'],
      trim: true,
      maxlength: [150, 'Organization name cannot exceed 150 characters.']
    },
    address: {
      type: String,
      required: [true, 'Please enter complete address.'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'Please enter city.'],
      trim: true
    },
    district: {
      type: String,
      trim: true,
      default: ''
    },
    state: {
      type: String,
      required: [true, 'Please enter state.'],
      trim: true
    },
    pincode: {
      type: String,
      required: [true, 'Please enter PIN code.'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Please enter contact number.'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Please enter organization email.'],
      trim: true,
      lowercase: true
    },
    website: {
      type: String,
      trim: true,
      default: ''
    },
    responsiblePerson: {
      type: String,
      required: [true, 'Please enter name of responsible person / administrator.'],
      trim: true
    },
    organizationType: {
      type: String,
      required: [true, 'Please select organization type.'],
      enum: [
        'Trust',
        'Society',
        'Section 8 Non-Profit',
        'Private Organization',
        'Religious / Charitable Trust',
        'Other'
      ],
      default: 'Trust'
    },
    registrationNumber: {
      type: String,
      required: [true, 'Please enter registration number.'],
      trim: true
    },
    registrationType: {
      type: String,
      trim: true,
      default: 'Public Trust Act'
    },
    registrationAuthority: {
      type: String,
      trim: true,
      default: ''
    },
    registrationDate: {
      type: Date
    },
    description: {
      type: String,
      trim: true,
      default: 'Dedicated to providing care, warmth, and shelter for senior citizens.'
    },
    capacity: {
      type: Number,
      default: 40
    },
    residentsCount: {
      type: Number,
      default: 25
    },
    careTypes: {
      type: [String],
      default: ['Medical Care', 'Assisted Living']
    },
    profileImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=600&q=80'
    },
    verificationStatus: {
      type: String,
      enum: ['UNVERIFIED', 'PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'NEEDS_INFORMATION'],
      default: 'PENDING'
    },
    documents: [documentSchema],
    checklist: {
      organizationDetailsChecked: { type: Boolean, default: false },
      registrationInfoChecked: { type: Boolean, default: false },
      registrationDocChecked: { type: Boolean, default: false },
      addressChecked: { type: Boolean, default: false },
      contactChecked: { type: Boolean, default: false },
      otherDocsChecked: { type: Boolean, default: false }
    },
    submittedAt: {
      type: Date
    },
    verifiedAt: {
      type: Date
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    verificationNotes: {
      type: String,
      default: ''
    },
    duplicateFlags: [
      {
        type: String
      }
    ],
    verificationHistory: [verificationHistorySchema]
  },
  {
    timestamps: true
  }
);

// Method to get safe public profile without sensitive internal documents
organizationSchema.methods.toPublicJSON = function () {
  const org = this.toObject();
  delete org.documents; // Strip sensitive verification documents from public view
  delete org.duplicateFlags; // Keep fraud/duplicate warning flags internal to admin
  return org;
};

const Organization = mongoose.model('Organization', organizationSchema);

export default Organization;
