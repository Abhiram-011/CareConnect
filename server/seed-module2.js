import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Organization from './models/Organization.js';
import Requirement from './models/Requirement.js';

dotenv.config();

const seedModule2 = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/careconnect';
    await mongoose.connect(mongoUri);
    console.log('[Seeder] Connected to database.');

    // 1. Ensure all Admin Accounts exist
    // ✅ Add or remove admins from this list freely
    const adminAccounts = [
      {
        name: 'CareConnect Administrator',
        email: 'admin@careconnect.org',
        password: 'AdminPass123!',
        phone: '+91 90000 00001',
        location: 'HQ Central, Bengaluru'
      },
      {
        name: 'Ravi Kumar',
        email: 'ravi.admin@careconnect.org',
        password: 'RaviAdmin@2024',
        phone: '+91 90000 00002',
        location: 'Mumbai, Maharashtra'
      },
      {
        name: 'Priya Sharma',
        email: 'priya.admin@careconnect.org',
        password: 'PriyaAdmin@2024',
        phone: '+91 90000 00003',
        location: 'Delhi, New Delhi'
      }
    ];

    let admin; // reference to first admin (used when linking verified orgs)
    for (const adminData of adminAccounts) {
      let adminUser = await User.findOne({ email: adminData.email });
      if (!adminUser) {
        adminUser = await User.create({
          ...adminData,
          role: 'admin'
        });
        console.log(`[Seeder] Created Admin: ${adminData.email} / ${adminData.password}`);
      } else {
        console.log(`[Seeder] Admin already exists: ${adminData.email}`);
      }
      if (!admin) admin = adminUser; // use first admin as default reference
    }

    // 2. Ensure Sample Old-Age Home User 1 exists (PENDING)
    let homeUser1 = await User.findOne({ email: 'sneha.nilaya@careconnect.org' });
    if (!homeUser1) {
      homeUser1 = await User.create({
        name: 'Sneha Nilaya Senior Care',
        email: 'sneha.nilaya@careconnect.org',
        password: 'HomePass123!',
        phone: '+91 98888 11111',
        role: 'home',
        location: 'Bangalore, Karnataka'
      });
      console.log('[Seeder] Created Home User 1: sneha.nilaya@careconnect.org / HomePass123!');
    }

    // Check Organization 1 (Pending Verification)
    let org1 = await Organization.findOne({ user: homeUser1._id });
    if (!org1) {
      org1 = await Organization.create({
        user: homeUser1._id,
        name: 'Sneha Nilaya Senior Living & Care Trust',
        address: 'Plot 42, 3rd Cross, Indiranagar',
        city: 'Bangalore',
        district: 'Bangalore Urban',
        state: 'Karnataka',
        pincode: '560038',
        phone: '+91 98888 11111',
        email: 'sneha.nilaya@careconnect.org',
        website: 'https://snehanilaya.org',
        responsiblePerson: 'Dr. Meera Nambiar (Trustee)',
        organizationType: 'Trust',
        registrationNumber: 'TRUST/BLR/2018/8892',
        registrationType: 'Indian Trusts Act, 1882',
        registrationAuthority: 'Sub-Registrar Indiranagar',
        registrationDate: new Date('2018-04-12'),
        description: 'Dedicated geriatric nursing care, routine health screenings, and nutritious meal support for 48 elderly residents.',
        capacity: 50,
        residentsCount: 48,
        careTypes: ['Medical Care', 'Assisted Living'],
        profileImage: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=600&q=80',
        verificationStatus: 'PENDING',
        submittedAt: new Date(),
        documents: [
          {
            documentType: 'registration_certificate',
            originalName: 'Trust_Registration_Certificate_2018.pdf',
            fileName: 'sample_trust_cert.pdf',
            mimeType: 'application/pdf',
            size: 245000,
            filePath: '/api/admin/verifications/document/sample_trust_cert.pdf',
            uploadedAt: new Date()
          },
          {
            documentType: 'address_proof',
            originalName: 'Electricity_Lease_Agreement_Bangalore.pdf',
            fileName: 'sample_address_proof.pdf',
            mimeType: 'application/pdf',
            size: 180000,
            filePath: '/api/admin/verifications/document/sample_address_proof.pdf',
            uploadedAt: new Date()
          }
        ],
        checklist: {
          organizationDetailsChecked: false,
          registrationInfoChecked: false,
          registrationDocChecked: false,
          addressChecked: false,
          contactChecked: false,
          otherDocsChecked: false
        },
        verificationHistory: [
          {
            status: 'PENDING',
            reviewedByName: 'Dr. Meera Nambiar',
            reviewedAt: new Date(),
            notes: 'Initial registration and documentation submitted for review.'
          }
        ]
      });
      console.log('[Seeder] Created Organization 1 (PENDING status)');
    }

    // 3. Ensure Sample Old-Age Home User 2 exists (VERIFIED)
    let homeUser2 = await User.findOne({ email: 'vatsalya.elders@careconnect.org' });
    if (!homeUser2) {
      homeUser2 = await User.create({
        name: 'Vatsalya Elders Haven',
        email: 'vatsalya.elders@careconnect.org',
        password: 'HomePass123!',
        phone: '+91 97777 22222',
        role: 'home',
        location: 'Pune, Maharashtra'
      });
    }

    let org2 = await Organization.findOne({ user: homeUser2._id });
    if (!org2) {
      org2 = await Organization.create({
        user: homeUser2._id,
        name: 'Vatsalya Elders Haven Society',
        address: 'Sector 14, Pradhikaran, Nigdi',
        city: 'Pune',
        district: 'Pune',
        state: 'Maharashtra',
        pincode: '411044',
        phone: '+91 97777 22222',
        email: 'vatsalya.elders@careconnect.org',
        website: 'https://vatsalyaelders.org',
        responsiblePerson: 'Mr. Arvind Joshi (President)',
        organizationType: 'Society',
        registrationNumber: 'SOC/PUN/2015/4412',
        registrationType: 'Societies Registration Act, 1860',
        registrationAuthority: 'Charity Commissioner Pune',
        registrationDate: new Date('2015-08-20'),
        description: 'A compassionate home providing 24/7 assisted living, physiotherapy, and library spaces for senior residents.',
        capacity: 40,
        residentsCount: 32,
        careTypes: ['Assisted Living', 'Dementia Care'],
        profileImage: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
        verificationStatus: 'VERIFIED',
        submittedAt: new Date(Date.now() - 7 * 86400000),
        verifiedAt: new Date(Date.now() - 2 * 86400000),
        verifiedBy: admin._id,
        verificationNotes: 'All submitted organization details, registered society certificates, and physical premises verified.',
        checklist: {
          organizationDetailsChecked: true,
          registrationInfoChecked: true,
          registrationDocChecked: true,
          addressChecked: true,
          contactChecked: true,
          otherDocsChecked: true
        },
        documents: [
          {
            documentType: 'registration_certificate',
            originalName: 'Society_Charity_Certificate.pdf',
            fileName: 'society_cert.pdf',
            mimeType: 'application/pdf',
            size: 320000,
            filePath: '/api/admin/verifications/document/society_cert.pdf',
            uploadedAt: new Date()
          }
        ],
        verificationHistory: [
          {
            status: 'VERIFIED',
            reviewedBy: admin._id,
            reviewedByName: 'CareConnect Administrator',
            reviewedAt: new Date(Date.now() - 2 * 86400000),
            notes: 'Verification approved. Society registration and facility address verified.',
            checklist: {
              organizationDetailsChecked: true,
              registrationInfoChecked: true,
              registrationDocChecked: true,
              addressChecked: true,
              contactChecked: true,
              otherDocsChecked: true
            }
          }
        ]
      });
      console.log('[Seeder] Created Organization 2 (VERIFIED status)');
    }

    // 4. Seed Requirements for Organization 1
    if (org1) {
      const existingReqs1 = await Requirement.find({ organization: org1._id });
      if (existingReqs1.length === 0) {
        await Requirement.create([
          {
            organization: org1._id,
            title: 'Monthly Adult Diapers & Hygiene Kits',
            description: 'Pack of 50 Large & XL size adult care diapers and antiseptic wet wipes.',
            category: 'Hygiene & Sanitation',
            unit: 'boxes',
            quantityRequired: 25,
            quantityFulfilled: 10,
            urgency: 'High',
            status: 'Partially Fulfilled',
            neededByDate: new Date(Date.now() + 10 * 86400000),
            notes: 'High demand for bedridden senior citizens.'
          },
          {
            organization: org1._id,
            title: 'Monthly Ration: Basmati Rice & Toor Dal',
            description: 'Daily kitchen grocery essentials for 48 elderly residents.',
            category: 'Groceries & Food',
            unit: 'kg',
            quantityRequired: 150,
            quantityFulfilled: 0,
            urgency: 'High',
            status: 'Open',
            neededByDate: new Date(Date.now() + 7 * 86400000),
            notes: 'Needed for daily breakfast and lunch preparation.'
          },
          {
            organization: org1._id,
            title: 'Digital Blood Pressure Monitors & Glucometers',
            description: 'Omron BP Monitors and Accu-Chek test strips for daily monitoring.',
            category: 'Medical & Healthcare',
            unit: 'units',
            quantityRequired: 6,
            quantityFulfilled: 6,
            urgency: 'Medium',
            status: 'Fulfilled',
            neededByDate: new Date(Date.now() - 3 * 86400000)
          }
        ]);
        console.log('[Seeder] Created sample requirements for Organization 1');
      }
    }

    // 5. Seed Requirements for Organization 2
    if (org2) {
      const existingReqs2 = await Requirement.find({ organization: org2._id });
      if (existingReqs2.length === 0) {
        await Requirement.create([
          {
            organization: org2._id,
            title: 'Lightweight Folding Wheelchairs',
            description: 'Wheelchairs with footrests for newly admitted mobility-impaired residents.',
            category: 'Mobility & Assistive Devices',
            unit: 'units',
            quantityRequired: 4,
            quantityFulfilled: 1,
            urgency: 'High',
            status: 'Partially Fulfilled',
            neededByDate: new Date(Date.now() + 14 * 86400000)
          },
          {
            organization: org2._id,
            title: 'Winter Warm Blankets & Bedsheets',
            description: 'Cotton double-layer warm blankets and washable mattress protectors.',
            category: 'Bedding & Clothing',
            unit: 'sets',
            quantityRequired: 30,
            quantityFulfilled: 0,
            urgency: 'Medium',
            status: 'Open',
            neededByDate: new Date(Date.now() + 20 * 86400000)
          }
        ]);
        console.log('[Seeder] Created sample requirements for Organization 2');
      }
    }

    console.log('[Seeder] Module 2 seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('[Seeder Error]:', error);
    process.exit(1);
  }
};

seedModule2();
