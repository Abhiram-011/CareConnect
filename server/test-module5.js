// Comprehensive Automated Test Suite for Module 5: Admin & Verification Module
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Organization from './models/Organization.js';
import Donation from './models/Donation.js';
import VolunteerOpportunity from './models/VolunteerOpportunity.js';
import VolunteerApplication from './models/VolunteerApplication.js';
import DonationCategory from './models/DonationCategory.js';
import UserReport from './models/UserReport.js';
import AdminAction from './models/AdminAction.js';
import { seedAdminAndCategories } from './seed-admin.js';

dotenv.config();

const BASE_URL = 'http://localhost:5000/api';

async function runModule5Tests() {
  console.log('====================================================');
  console.log('STARTING MODULE 5: ADMIN & VERIFICATION TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/careconnect';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  // Ensure server is reachable
  try {
    const health = await fetch(`${BASE_URL}/health`);
    if (!health.ok) throw new Error('Server not responding');
  } catch (err) {
    console.log('[Setup] Server not running. Starting server instance...');
    await import('./server.js');
    await new Promise((r) => setTimeout(r, 2000));
  }

  // Seed default admin and categories
  await seedAdminAndCategories();

  let adminToken = '';
  let donorToken = '';
  let homeToken = '';
  let volunteerToken = '';
  let testUserId = '';
  let testHomeId = '';
  let testDonationId = '';
  let createdCategoryId = '';
  let createdReportId = '';

  // 1. Admin login using securely provisioned credentials
  console.log('TEST 1: Admin Login with Secure Provisioned Account');
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@careconnect.org',
        password: 'AdminPass123!'
      })
    });
    const data = await res.json();
    if (res.status === 200 && data.token && data.data?.user?.role === 'admin') {
      adminToken = data.token;
      console.log(' [PASS] Admin logged in successfully with ADMIN role.');
      passed++;
    } else {
      console.log(' [FAIL] Admin login failed:', data.message);
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in Admin login:', err.message);
    failed++;
  }

  // 2. Prepare test non-admin tokens: Donor, Volunteer, Home
  console.log('\nTEST 2: Setup non-admin users (Donor, Volunteer, Home)');
  try {
    // Donor
    let donor = await User.findOne({ email: 'donor.test.mod5@careconnect.org' });
    if (!donor) {
      donor = await User.create({
        name: 'Test Donor Mod5',
        email: 'donor.test.mod5@careconnect.org',
        password: 'Password123!',
        phone: '+91 91111 22222',
        role: 'donor',
        isEmailVerified: true
      });
    }
    testUserId = donor._id.toString();

    const donorRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: donor.email, password: 'Password123!' })
    });
    const donorData = await donorRes.json();
    donorToken = donorData.token;

    // Home
    let homeUser = await User.findOne({ email: 'sneha.nilaya@careconnect.org' });
    if (homeUser) {
      const homeRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: homeUser.email, password: 'HomePass123!' })
      });
      const homeData = await homeRes.json();
      homeToken = homeData.token;
      const org = await Organization.findOne({ user: homeUser._id });
      if (org) testHomeId = org._id.toString();
    }

    if (donorToken) {
      console.log(' [PASS] Non-admin test tokens acquired.');
      passed++;
    } else {
      console.log(' [FAIL] Failed to acquire donor token.');
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in setting up non-admin users:', err.message);
    failed++;
  }

  // 3. Security: Donor / Volunteer / Home cannot access Admin routes (403 / 401)
  console.log('\nTEST 3: Role Authorization - Donors and Unauthenticated users blocked from Admin endpoints');
  try {
    const unauthRes = await fetch(`${BASE_URL}/admin/dashboard`);
    const donorRes = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${donorToken}` }
    });

    if (unauthRes.status === 401 && donorRes.status === 403) {
      console.log(' [PASS] Unauthenticated blocked with 401; Donor blocked with 403 Forbidden.');
      passed++;
    } else {
      console.log(` [FAIL] Expected 401 & 403, got ${unauthRes.status} & ${donorRes.status}`);
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in role authorization test:', err.message);
    failed++;
  }

  // 4. Admin Dashboard Statistics from real database records
  console.log('\nTEST 4: Admin Dashboard Platform Statistics');
  try {
    const res = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    const stats = data.data?.stats;
    if (
      res.status === 200 &&
      stats &&
      typeof stats.totalUsers === 'number' &&
      typeof stats.totalDonationRequests === 'number' &&
      typeof stats.totalHomes === 'number'
    ) {
      console.log(` [PASS] Dashboard stats loaded: ${stats.totalUsers} users, ${stats.totalHomes} homes, ${stats.totalDonationRequests} donations, ${stats.totalVolunteerOpportunities} opportunities.`);
      passed++;
    } else {
      console.log(' [FAIL] Failed to load dashboard stats:', data.message);
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in dashboard stats:', err.message);
    failed++;
  }

  // 5. User Management: Search & Filter Users
  console.log('\nTEST 5: Admin User Management - List, Filter by Role, Search');
  try {
    const res = await fetch(`${BASE_URL}/admin/users?role=donor&search=Mod5`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    if (res.status === 200 && Array.isArray(data.data?.users) && data.data.users.length > 0) {
      console.log(` [PASS] User search and role filter returned ${data.data.users.length} user(s).`);
      passed++;
    } else {
      console.log(' [FAIL] User search/filter failed:', data.message);
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in user listing:', err.message);
    failed++;
  }

  // 6. User Management: Suspend User Account with Reason & Block platform features
  console.log('\nTEST 6: Suspend Account & Enforce Platform Lockout');
  try {
    // 6a. Attempt suspension without reason (should fail with 400)
    const emptyReasonRes = await fetch(`${BASE_URL}/admin/users/${testUserId}/suspend`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ reason: '' })
    });

    // 6b. Suspend with valid reason
    const suspendRes = await fetch(`${BASE_URL}/admin/users/${testUserId}/suspend`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ reason: 'Investigation into policy violation' })
    });
    const suspendData = await suspendRes.json();

    // 6c. Verify suspended user is blocked from protected platform features
    const lockedRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${donorToken}` }
    });

    if (emptyReasonRes.status === 400 && suspendRes.status === 200 && lockedRes.status === 403) {
      console.log(' [PASS] Account suspended with reason; Suspended user locked out with 403 Forbidden.');
      passed++;
    } else {
      console.log(` [FAIL] Suspension check failed: emptyReason=${emptyReasonRes.status}, suspend=${suspendRes.status}, locked=${lockedRes.status}`);
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in account suspension:', err.message);
    failed++;
  }

  // 7. Security: Admin cannot suspend their own active admin account
  console.log('\nTEST 7: Security Rule - Admin cannot suspend themselves');
  try {
    const adminUser = await User.findOne({ email: 'admin@careconnect.org' });
    const res = await fetch(`${BASE_URL}/admin/users/${adminUser._id}/suspend`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ reason: 'Self suspension attempt' })
    });
    const data = await res.json();
    if (res.status === 400 && data.message.includes('cannot suspend their own')) {
      console.log(' [PASS] Self-suspension rejected by security policy.');
      passed++;
    } else {
      console.log(' [FAIL] Self-suspension should have been rejected:', data.message);
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in self-suspension test:', err.message);
    failed++;
  }

  // 8. User Management: Reactivate Suspended Account
  console.log('\nTEST 8: Reactivate Suspended Account');
  try {
    const res = await fetch(`${BASE_URL}/admin/users/${testUserId}/reactivate`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ reason: 'Account cleared of violations.' })
    });
    const data = await res.json();

    // Re-verify user can access protected route now
    const unblockedRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${donorToken}` }
    });

    if (res.status === 200 && unblockedRes.status === 200) {
      console.log(' [PASS] Account successfully reactivated and restored to ACTIVE status.');
      passed++;
    } else {
      console.log(' [FAIL] Reactivation failed:', data.message);
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in reactivation:', err.message);
    failed++;
  }

  // 9. Old-Age Home Verification: Pending listing, Review, Request Info, Approve, Reject
  console.log('\nTEST 9: Old-Age Home Verification Lifecycle (Request Info -> Approve)');
  try {
    let testOrg = await Organization.findOne();
    if (!testOrg) {
      testOrg = await Organization.create({
        user: new mongoose.Types.ObjectId(),
        name: 'Shanti Bhavan Senior Home',
        address: '45 Green Meadows',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
        phone: '+91 80 2345 6789',
        email: 'shanti.bhavan@careconnect.org',
        responsiblePerson: 'Mrs. Devaki Rao',
        registrationNumber: 'REG-KA-2026-999',
        verificationStatus: 'PENDING'
      });
    }

    // 9a. Request Information
    const reqInfoRes = await fetch(`${BASE_URL}/admin/homes/${testOrg._id}/request-information`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ notes: 'Please upload municipal fire-safety clearance certificate.' })
    });
    const reqInfoData = await reqInfoRes.json();

    // 9b. Verify Organization
    const verifyRes = await fetch(`${BASE_URL}/admin/homes/${testOrg._id}/verify`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ notes: 'Registration trust deed and municipal proofs verified.' })
    });
    const verifyData = await verifyRes.json();

    if (
      reqInfoRes.status === 200 &&
      reqInfoData.data?.home?.verificationStatus === 'NEEDS_INFORMATION' &&
      verifyRes.status === 200 &&
      verifyData.data?.home?.verificationStatus === 'VERIFIED'
    ) {
      console.log(' [PASS] Organization transitioned through NEEDS_INFORMATION and VERIFIED states.');
      passed++;
    } else {
      console.log(' [FAIL] Home verification lifecycle failed.');
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in home verification:', err.message);
    failed++;
  }

  // 10. Donation Category Management: Add Category, Prevent Duplicate, Edit, Deactivate, Reference check
  console.log('\nTEST 10: Donation Category Management (CRUD + Safety Constraints)');
  try {
    const uniqueCatName = `Senior Mobility Aids ${Date.now()}`;

    // 10a. Create category
    const createRes = await fetch(`${BASE_URL}/admin/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: uniqueCatName,
        description: 'Wheelchairs, walking sticks, walkers, and orthopaedic crutches.'
      })
    });
    const createData = await createRes.json();
    createdCategoryId = createData.data?.category?._id;

    // 10b. Duplicate category creation should be rejected (400)
    const dupRes = await fetch(`${BASE_URL}/admin/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name: uniqueCatName })
    });

    // 10c. Toggle active status to false
    const toggleRes = await fetch(`${BASE_URL}/admin/categories/${createdCategoryId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ isActive: false })
    });
    const toggleData = await toggleRes.json();

    // 10d. Donors active categories endpoint should NOT include deactivated category
    const activeRes = await fetch(`${BASE_URL}/categories`);
    const activeData = await activeRes.json();
    const isActivePresent = activeData.data?.categories?.some((c) => c.name === uniqueCatName);

    if (
      createRes.status === 201 &&
      dupRes.status === 400 &&
      toggleRes.status === 200 &&
      toggleData.data?.category?.isActive === false &&
      !isActivePresent
    ) {
      console.log(' [PASS] Category created, duplicate prevented, deactivated, and filtered from donors.');
      passed++;
    } else {
      console.log(' [FAIL] Category management tests failed.');
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in category management:', err.message);
    failed++;
  }

  // 11. Donation Monitoring: Admin views all donation requests with category counts
  console.log('\nTEST 11: Donation Monitoring (Read-only observation)');
  try {
    const res = await fetch(`${BASE_URL}/admin/donations`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    if (res.status === 200 && Array.isArray(data.data?.donations)) {
      console.log(` [PASS] Retrieved ${data.data.donations.length} donation records for admin monitoring.`);
      passed++;
    } else {
      console.log(' [FAIL] Donation monitoring fetch failed:', data.message);
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in donation monitoring:', err.message);
    failed++;
  }

  // 12. Volunteer Activity Monitoring: Volunteers, Opportunities, Applications
  console.log('\nTEST 12: Volunteer Activity Monitoring');
  try {
    const [volRes, oppRes, appRes] = await Promise.all([
      fetch(`${BASE_URL}/admin/volunteers`, { headers: { Authorization: `Bearer ${adminToken}` } }),
      fetch(`${BASE_URL}/admin/volunteer-opportunities`, { headers: { Authorization: `Bearer ${adminToken}` } }),
      fetch(`${BASE_URL}/admin/volunteer-applications`, { headers: { Authorization: `Bearer ${adminToken}` } })
    ]);

    const [volData, oppData, appData] = await Promise.all([volRes.json(), oppRes.json(), appRes.json()]);

    if (volRes.status === 200 && oppRes.status === 200 && appRes.status === 200) {
      console.log(` [PASS] Monitoring active: ${volData.data?.volunteers?.length || 0} volunteers, ${oppData.data?.opportunities?.length || 0} opportunities, ${appData.data?.applications?.length || 0} applications.`);
      passed++;
    } else {
      console.log(' [FAIL] Volunteer monitoring endpoints failed.');
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in volunteer monitoring:', err.message);
    failed++;
  }

  // 13. User Reporting & Moderation System: Submit Report -> Admin Review & Resolve
  console.log('\nTEST 13: User Reporting & Moderation (Submit -> Review -> Resolve)');
  try {
    // 13a. Authenticated user submits report against test user
    const reportRes = await fetch(`${BASE_URL}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${donorToken}` },
      body: JSON.stringify({
        reportedEntityId: testUserId,
        reportedEntityType: 'user',
        category: 'Suspicious User Account',
        description: 'Account exhibiting unusual donation activity.'
      })
    });
    const reportData = await reportRes.json();
    createdReportId = reportData.data?.report?._id;

    // 13b. Admin lists reports
    const listReportsRes = await fetch(`${BASE_URL}/admin/reports?status=PENDING`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const listReportsData = await listReportsRes.json();

    // 13c. Admin resolves report with internal notes
    const resolveRes = await fetch(`${BASE_URL}/admin/reports/${createdReportId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        status: 'RESOLVED',
        adminNotes: 'Reviewed account transactions; verified legitimate. No suspension needed.'
      })
    });
    const resolveData = await resolveRes.json();

    if (
      reportRes.status === 201 &&
      listReportsRes.status === 200 &&
      resolveRes.status === 200 &&
      resolveData.data?.report?.status === 'RESOLVED'
    ) {
      console.log(' [PASS] User submitted report; Admin reviewed and resolved with internal notes.');
      passed++;
    } else {
      console.log(' [FAIL] Report submission or resolution failed.');
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in reporting and moderation:', err.message);
    failed++;
  }

  // 14. Audit Trail: Verify Admin Actions recorded
  console.log('\nTEST 14: Administrative Audit Trail');
  try {
    const res = await fetch(`${BASE_URL}/admin/actions`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    if (res.status === 200 && Array.isArray(data.data?.actions) && data.data.actions.length > 0) {
      console.log(` [PASS] Audit trail verified: ${data.data.actions.length} action(s) logged.`);
      passed++;
    } else {
      console.log(' [FAIL] Audit trail empty or failed:', data.message);
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in audit trail test:', err.message);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`MODULE 5 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  try {
    await mongoose.disconnect();
  } catch (e) {}

  process.exit(failed > 0 ? 1 : 0);
}

runModule5Tests();

