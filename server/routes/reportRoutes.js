import express from 'express';
import { createReport, getMyReports } from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Authenticated users can submit a report against any entity and view their own submitted reports
router.post('/', protect, createReport);
router.get('/my', protect, getMyReports);

export default router;

