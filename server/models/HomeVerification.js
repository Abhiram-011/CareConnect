import mongoose from 'mongoose';

const homeVerificationSchema = new mongoose.Schema(
  {
    homeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Home / Organization ID is required.']
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'NEEDS_INFORMATION'],
      default: 'PENDING',
      required: true
    },
    submittedDocuments: [
      {
        documentType: { type: String, default: 'registration_certificate' },
        originalName: { type: String, default: '' },
        fileName: { type: String, default: '' },
        mimeType: { type: String, default: '' },
        size: { type: Number, default: 0 },
        filePath: { type: String, default: '' },
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
    reviewNotes: {
      type: String,
      trim: true,
      default: ''
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: ''
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

homeVerificationSchema.index({ homeId: 1, createdAt: -1 });
homeVerificationSchema.index({ verificationStatus: 1 });

const HomeVerification = mongoose.model('HomeVerification', homeVerificationSchema);

export default HomeVerification;

