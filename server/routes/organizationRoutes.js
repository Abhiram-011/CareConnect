import express from 'express';
import {
  submitVerification,
  getMyOrganization,
  getPublicOrganizations,
  getPublicOrganizationById,
  getAdminVerifications,
  getAdminVerificationStats,
  getAdminVerificationById,
  approveVerification,
  rejectVerification,
  getSecureDocument
} from '../controllers/organizationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { uploadVerificationDocs } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// ----------------------------------------------------
// Organization (Old-Age Home) Routes
// ----------------------------------------------------
router.post(
  '/verification',
  protect,
  authorizeRoles('home'),
  uploadVerificationDocs.any(),
  submitVerification
);

router.get(
  '/my-organization',
  protect,
  authorizeRoles('home'),
  getMyOrganization
);

// ----------------------------------------------------
// Public Organization Profile & Verification Routes
// ----------------------------------------------------
router.get('/public', getPublicOrganizations);
router.get('/public/:id', getPublicOrganizationById);

// ----------------------------------------------------
// Admin Verification & Trust System Routes
// ----------------------------------------------------
router.get(
  '/admin/list',
  protect,
  authorizeRoles('admin'),
  getAdminVerifications
);

router.get(
  '/admin/stats',
  protect,
  authorizeRoles('admin'),
  getAdminVerificationStats
);

router.get(
  '/admin/review/:id',
  protect,
  authorizeRoles('admin'),
  getAdminVerificationById
);

router.patch(
  '/admin/approve/:id',
  protect,
  authorizeRoles('admin'),
  approveVerification
);

router.patch(
  '/admin/reject/:id',
  protect,
  authorizeRoles('admin'),
  rejectVerification
);

// Secure verification document viewer (Admin & Organization Owner only)
router.get(
  '/admin/document/:filename',
  protect,
  getSecureDocument
);

export default router;
