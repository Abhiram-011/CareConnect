import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  verifyOTP,
  resendOTP,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Rate limiter for authentication routes to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.'
  }
});

// Public authentication & OTP routes
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/verify-otp', authLimiter, verifyOTP);
router.post('/resend-otp', authLimiter, resendOTP);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

// Authenticated user routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// Role-protected test routes for verifying backend role authorization
router.get('/donor-check', protect, authorizeRoles('donor'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Access granted: Authorized for donor role only.',
    data: { role: req.user.role }
  });
});

router.get('/admin-check', protect, authorizeRoles('admin'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Access granted: Authorized for admin role only.',
    data: { role: req.user.role }
  });
});

export default router;
