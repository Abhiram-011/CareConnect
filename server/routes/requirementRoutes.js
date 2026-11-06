import express from 'express';
import {
  createRequirement,
  getMyRequirements,
  getRequirementById,
  updateRequirement,
  deleteRequirement,
  getPublicRequirements
} from '../controllers/requirementController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public routes (Donors and visitors browsing needs)
router.get('/public', getPublicRequirements);

// Old-Age Home management routes
router.get(
  '/my-requirements',
  protect,
  authorizeRoles('home'),
  getMyRequirements
);

router.get('/:id', getRequirementById);

router.post(
  '/',
  protect,
  authorizeRoles('home', 'admin'),
  createRequirement
);

router.put(
  '/:id',
  protect,
  authorizeRoles('home', 'admin'),
  updateRequirement
);

router.delete(
  '/:id',
  protect,
  authorizeRoles('home', 'admin'),
  deleteRequirement
);

export default router;
