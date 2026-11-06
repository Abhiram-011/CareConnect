import express from 'express';
import {
  getDonationsTracking,
  getDonationTrackingById,
  getVolunteerApplicationsTracking,
  getVolunteerApplicationTrackingById
} from '../controllers/trackingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// Donation tracking
router.get('/donations', getDonationsTracking);
router.get('/donations/:id', getDonationTrackingById);

// Volunteer application tracking
router.get('/volunteer-applications', getVolunteerApplicationsTracking);
router.get('/volunteer-applications/:id', getVolunteerApplicationTrackingById);

export default router;

