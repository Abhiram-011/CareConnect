import express from 'express';
import {
  searchHomes,
  getPublicHomeDetails,
  searchDonations,
  searchVolunteerOpportunities
} from '../controllers/searchController.js';

const router = express.Router();

// Public search endpoints
router.get('/homes', searchHomes);
router.get('/homes/:id', getPublicHomeDetails);
router.get('/donations', searchDonations);
router.get('/volunteer-opportunities', searchVolunteerOpportunities);

export default router;

