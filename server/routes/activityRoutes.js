import express from 'express';
import { getActivityHistory } from '../controllers/activityController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/history', getActivityHistory);

export default router;

