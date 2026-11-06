import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import DonationCategory from './models/DonationCategory.js';

dotenv.config();

const DEFAULT_CATEGORIES = [
  { name: 'Food and groceries', description: 'Fresh produce, non-perishables, pantry staples, and grains for daily meals.' },
  { name: 'Clothes', description: 'Clean comfortable clothing, warm blankets, shawls, and footwear.' },
  { name: 'Medicines and medical supplies', description: 'First-aid items, prescribed elderly healthcare supplements, mobility aids.' },
  { name: 'Furniture', description: 'Comfortable cots, wheelchairs, orthopaedic chairs, and dining tables.' },
  { name: 'Books and educational materials', description: 'Reading books, large-print literature, puzzles, and spiritual publications.' },
  { name: 'Personal-care products', description: 'Hygiene essentials, adult diapers, gentle soaps, lotions, and sanitizers.' },
  { name: 'Financial support', description: 'Monetary donations directly supporting home operations and elderly emergency medical funds.' },
  { name: 'Other', description: 'Recreational materials, electronics, appliances, and general care items.' }
];

export async function seedAdminAndCategories() {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@careconnect.org').toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPass123!';
  const adminName = process.env.ADMIN_NAME || 'Platform Administrator';
  const adminPhone = process.env.ADMIN_PHONE || '+91 98765 43210';

  console.log(`[Seed Admin] Verifying admin user account (${adminEmail})...`);

  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = new User({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      phone: adminPhone,
      role: 'admin',
      isEmailVerified: true,
      status: 'ACTIVE'
    });
    await admin.save();
    console.log(`[Seed Admin] Created initial admin account: ${adminEmail}`);
  } else {
    // Ensure admin has role 'admin' and status 'ACTIVE'
    let updated = false;
    if (admin.role !== 'admin') {
      admin.role = 'admin';
      updated = true;
    }
    if (admin.status !== 'ACTIVE') {
      admin.status = 'ACTIVE';
      updated = true;
    }
    if (!admin.isEmailVerified) {
      admin.isEmailVerified = true;
      updated = true;
    }
    if (updated) {
      await admin.save();
      console.log(`[Seed Admin] Ensured admin privileges for: ${adminEmail}`);
    } else {
      console.log(`[Seed Admin] Existing admin account verified: ${adminEmail}`);
    }
  }

  // Seed default donation categories
  console.log('[Seed Categories] Checking default donation categories...');
  for (const cat of DEFAULT_CATEGORIES) {
    const existing = await DonationCategory.findOne({ name: cat.name });
    if (!existing) {
      await DonationCategory.create(cat);
      console.log(`[Seed Categories] Created category: ${cat.name}`);
    }
  }

  console.log('[Seed] Admin and categories initialized successfully.');
  return admin;
}

// CLI runner if invoked directly
if (process.argv[1] && process.argv[1].endsWith('seed-admin.js')) {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/careconnect';
  mongoose
    .connect(mongoUri)
    .then(async () => {
      await seedAdminAndCategories();
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed Error]:', err);
      process.exit(1);
    });
}

