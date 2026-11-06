import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import organizationRoutes from './routes/organizationRoutes.js';
import requirementRoutes from './routes/requirementRoutes.js';
import donationRoutes from './routes/donationRoutes.js';
import volunteerRoutes from './routes/volunteerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import trackingRoutes from './routes/trackingRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import { getActiveCategories } from './controllers/adminController.js';
import { seedAdminAndCategories } from './seed-admin.js';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Connect to MongoDB & Seed default Admin + Categories if needed
connectDB()
  .then(() => seedAdminAndCategories())
  .catch((err) => console.error('[Server Init Notice]:', err.message));

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(null, true); // Dev environment: allow access
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Body parser middleware with payload size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Basic sanity / health route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CareConnect API is running smoothly.',
    timestamp: new Date().toISOString()
  });
});

// Mount Authentication & User routes (Module 1)
app.use('/api/auth', authRoutes);

// Mount Organization Verification & Trust routes (Module 2)
app.use('/api/organizations', organizationRoutes);

// Mount Requirements Management routes (Module 2)
app.use('/api/requirements', requirementRoutes);

// Mount Donation Management routes (Module 3)
app.use('/api/donations', donationRoutes);

// Mount Volunteer Management routes (Module 4)
app.use('/api', volunteerRoutes);

// Mount Admin & Verification routes (Module 5)
app.use('/api/admin', adminRoutes);

// Mount User Reporting & Moderation routes (Module 5)
app.use('/api/reports', reportRoutes);

// Mount Search & Discovery routes (Module 6)
app.use('/api/search', searchRoutes);

// Mount Donation & Volunteer Tracking routes (Module 6)
app.use('/api/tracking', trackingRoutes);

// Mount Notification System routes (Module 6)
app.use('/api/notifications', notificationRoutes);

// Mount Activity History routes (Module 6)
app.use('/api/activity', activityRoutes);

// Active donation categories for donors
app.get('/api/categories', getActiveCategories);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[CareConnect Server Error]:', err.message);

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File upload exceeds 5MB size limit. Please upload a smaller document.'
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(400).json({
      success: false,
      message: `An account or organization with this ${field} already exists.`
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      message: messages[0] || 'Validation error occurred.'
    });
  }

  // Generic internal server error - never expose stack trace
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error occurred. Please try again later.'
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`[CareConnect Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

export default app;
