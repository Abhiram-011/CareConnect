import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Organization from './models/Organization.js';

dotenv.config();

const clearSeedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/careconnect');
    console.log('[Clear] Connected to database.');

    const emails = [
      'admin@careconnect.org',
      'sneha.nilaya@careconnect.org',
      'vatsalya.elders@careconnect.org'
    ];

    // Delete organizations tied to these users first
    const users = await User.find({ email: { $in: emails } });
    const userIds = users.map(u => u._id);
    const orgResult = await Organization.deleteMany({ user: { $in: userIds } });
    console.log(`[Clear] Deleted ${orgResult.deletedCount} organizations.`);

    // Delete the users
    const userResult = await User.deleteMany({ email: { $in: emails } });
    console.log(`[Clear] Deleted ${userResult.deletedCount} seed users.`);

    console.log('[Clear] Done. Now re-run: node seed-module2.js');
    process.exit(0);
  } catch (error) {
    console.error('[Clear Error]:', error);
    process.exit(1);
  }
};

clearSeedUsers();
