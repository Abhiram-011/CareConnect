import express from 'express';
import {
  getVolunteerProfile,
  updateVolunteerProfile,
  getVolunteerOpportunities,
  getVolunteerOpportunityById,
  createVolunteerOpportunity,
  updateVolunteerOpportunity,
  updateOpportunityStatus,
  getHomeOpportunities,
  applyForOpportunity,
  getMyVolunteerApplications,
  withdrawVolunteerApplication,
  getOpportunityApplications,
  acceptVolunteerApplication,
  rejectVolunteerApplication,
  completeVolunteerApplication
} from '../controllers/volunteerController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// ============================================================================
// Volunteer Profile Endpoints
// ============================================================================
router.get(
  '/volunteers/profile',
  protect,
  authorizeRoles('volunteer', 'admin'),
  getVolunteerProfile
);

router.put(
  '/volunteers/profile',
  protect,
  authorizeRoles('volunteer', 'admin'),
  updateVolunteerProfile
);

// ============================================================================
// Home Opportunities Listing & Opportunity Applications
// ============================================================================
router.get(
  '/homes/volunteer-opportunities',
  protect,
  authorizeRoles('home', 'admin'),
  getHomeOpportunities
);

router.get(
  '/volunteer-opportunities/:id/applications',
  protect,
  authorizeRoles('home', 'admin'),
  getOpportunityApplications
);

// ============================================================================
// Public / Authenticated Opportunities Endpoints
// ============================================================================
router.get('/volunteer-opportunities', getVolunteerOpportunities);
router.get('/volunteer-opportunities/:id', getVolunteerOpportunityById);

router.post(
  '/volunteer-opportunities',
  protect,
  authorizeRoles('home', 'admin'),
  createVolunteerOpportunity
);

router.put(
  '/volunteer-opportunities/:id',
  protect,
  authorizeRoles('home', 'admin'),
  updateVolunteerOpportunity
);

router.patch(
  '/volunteer-opportunities/:id/status',
  protect,
  authorizeRoles('home', 'admin'),
  updateOpportunityStatus
);

// ============================================================================
// Volunteer Applications Endpoints
// ============================================================================
router.post(
  '/volunteer-opportunities/:id/apply',
  protect,
  authorizeRoles('volunteer'),
  applyForOpportunity
);

router.get(
  '/volunteer-applications/my',
  protect,
  authorizeRoles('volunteer', 'admin'),
  getMyVolunteerApplications
);

router.patch(
  '/volunteer-applications/:id/withdraw',
  protect,
  authorizeRoles('volunteer', 'admin'),
  withdrawVolunteerApplication
);

// Home application review endpoints
router.patch(
  '/volunteer-applications/:id/accept',
  protect,
  authorizeRoles('home', 'admin'),
  acceptVolunteerApplication
);

router.patch(
  '/volunteer-applications/:id/reject',
  protect,
  authorizeRoles('home', 'admin'),
  rejectVolunteerApplication
);

router.patch(
  '/volunteer-applications/:id/complete',
  protect,
  authorizeRoles('home', 'admin'),
  completeVolunteerApplication
);

export default router;
