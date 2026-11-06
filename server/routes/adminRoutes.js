import express from 'express';
import {
  getAdminDashboardStats,
  getAdminUsers,
  getAdminUserById,
  suspendUser,
  reactivateUser,
  getAdminHomes,
  getAdminPendingHomes,
  getAdminHomeById,
  verifyHome,
  rejectHome,
  requestInformationFromHome,
  getAdminDonations,
  getAdminVolunteers,
  getAdminVolunteerOpportunities,
  getAdminVolunteerApplications,
  getAdminCategories,
  createCategory,
  updateCategory,
  toggleCategoryStatus,
  deleteCategory,
  getActiveCategories,
  getAdminAuditActions
} from '../controllers/adminController.js';
import {
  getAdminReports,
  getAdminReportById,
  updateReportStatus
} from '../controllers/reportController.js';
import { getSecureDocument } from '../controllers/organizationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public / Authenticated route for donors to get active donation categories
router.get('/categories/active', getActiveCategories);

// Secure document viewer (Admin & Organization Owner)
router.get('/document/:filename', protect, getSecureDocument);

// ============================================================================
// ALL ROUTES BELOW REQUIRE AUTHENTICATION AND STRICT ADMIN AUTHORIZATION
// ============================================================================
router.use(protect);
router.use(authorizeRoles('admin'));

// 1. Admin Dashboard Overview
router.get('/dashboard', getAdminDashboardStats);

// 2. User Management
router.get('/users', getAdminUsers);
router.get('/users/:id', getAdminUserById);
router.patch('/users/:id/suspend', suspendUser);
router.patch('/users/:id/reactivate', reactivateUser);

// 3. Old-Age Home Verification
router.get('/homes/pending', getAdminPendingHomes);
router.get('/homes', getAdminHomes);
router.get('/homes/:id', getAdminHomeById);
router.patch('/homes/:id/verify', verifyHome);
router.patch('/homes/:id/reject', rejectHome);
router.patch('/homes/:id/request-information', requestInformationFromHome);

// 4. Donation Monitoring (Read-only observation)
router.get('/donations', getAdminDonations);

// 5. Volunteer Activity Monitoring (Read-only observation)
router.get('/volunteers', getAdminVolunteers);
router.get('/volunteer-opportunities', getAdminVolunteerOpportunities);
router.get('/volunteer-applications', getAdminVolunteerApplications);

// 6. Category Management
router.get('/categories', getAdminCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.patch('/categories/:id/status', toggleCategoryStatus);
router.delete('/categories/:id', deleteCategory);

// 7. Reported Accounts & Moderation
router.get('/reports', getAdminReports);
router.get('/reports/:id', getAdminReportById);
router.patch('/reports/:id/status', updateReportStatus);

// 8. Administrative Audit Actions
router.get('/actions', getAdminAuditActions);

export default router;

