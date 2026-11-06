import express from 'express';
import {
  createDonation,
  getMyDonations,
  getHomeDonations,
  getDonationById,
  acceptDonation,
  rejectDonation,
  scheduleDonation,
  markDelivered,
  completeDonation,
  cancelDonation,
  updateDonationDetails
} from '../controllers/donationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// ----------------------------------------------------
// Donor Specific Endpoints
// ----------------------------------------------------
router.post('/', protect, authorizeRoles('donor'), createDonation);
router.get('/my', protect, authorizeRoles('donor'), getMyDonations);

// ----------------------------------------------------
// Home Specific Endpoints
// ----------------------------------------------------
router.get(
  '/home/requests',
  protect,
  authorizeRoles('home', 'admin'),
  getHomeDonations
);

// ----------------------------------------------------
// Common Single Donation View (Controlled via internal ownership check)
// ----------------------------------------------------
router.get('/:id', protect, getDonationById);
router.put('/:id', protect, authorizeRoles('donor'), updateDonationDetails);

// ----------------------------------------------------
// State Transition Workflow Endpoints
// ----------------------------------------------------
router.patch('/:id/cancel', protect, authorizeRoles('donor', 'admin'), cancelDonation);
router.patch('/:id/accept', protect, authorizeRoles('home', 'admin'), acceptDonation);
router.patch('/:id/reject', protect, authorizeRoles('home', 'admin'), rejectDonation);
router.patch('/:id/schedule', protect, authorizeRoles('home', 'donor', 'admin'), scheduleDonation);
router.patch('/:id/mark-delivered', protect, authorizeRoles('donor', 'admin'), markDelivered);
router.patch('/:id/complete', protect, authorizeRoles('home', 'admin'), completeDonation);

export default router;
