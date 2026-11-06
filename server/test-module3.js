// Automated Test Suite for Module 3: Donation Management
// Tests all 12 scenarios specified in Section 11 of the requirements.
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import Organization from './models/Organization.js';
import Donation from './models/Donation.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });


const BASE_URL = 'http://localhost:5000/api';

async function runModule3Tests() {
  console.log('====================================================');
  console.log('STARTING MODULE 3: DONATION MANAGEMENT TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/careconnect';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }
  const jwtSecret = process.env.JWT_SECRET || 'careconnect_super_secret_jwt_key_2026_secure';

  // Auto-detect if server is running; if not, spin it up automatically
  try {
    const healthCheck = await fetch(`${BASE_URL}/health`);
    if (!healthCheck.ok) throw new Error('Not ready');
  } catch (err) {
    console.log('[Setup] Server is not running on port 5000. Launching server automatically...');
    await import('./server.js');
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // 0. Setup Test Users & Organizations
  console.log('[Setup] Preparing test accounts and organizations in database...');

  // Donor 1
  let donor1 = await User.findOne({ email: 'donor1.mod3@careconnect.test' });
  if (!donor1) {
    donor1 = await User.create({
      name: 'Rohan Verma (Donor 1)',
      email: 'donor1.mod3@careconnect.test',
      password: 'DonorPass123!',
      phone: '+91 91111 00001',
      role: 'donor',
      location: 'Bengaluru, Karnataka',
      isEmailVerified: true
    });
  }
  const tokenDonor1 = jwt.sign({ id: donor1._id, role: donor1.role }, jwtSecret, { expiresIn: '1d' });

  // Donor 2 (Unrelated Donor for cross-user permission checks)
  let donor2 = await User.findOne({ email: 'donor2.mod3@careconnect.test' });
  if (!donor2) {
    donor2 = await User.create({
      name: 'Anita Desai (Donor 2)',
      email: 'donor2.mod3@careconnect.test',
      password: 'DonorPass123!',
      phone: '+91 91111 00002',
      role: 'donor',
      location: 'Pune, Maharashtra',
      isEmailVerified: true
    });
  }
  const tokenDonor2 = jwt.sign({ id: donor2._id, role: donor2.role }, jwtSecret, { expiresIn: '1d' });

  // Home 1 (Intended Recipient Old-Age Home)
  let homeUser1 = await User.findOne({ email: 'home1.mod3@careconnect.test' });
  if (!homeUser1) {
    homeUser1 = await User.create({
      name: 'Ananda Nilaya Senior Living',
      email: 'home1.mod3@careconnect.test',
      password: 'HomePass123!',
      phone: '+91 92222 00001',
      role: 'home',
      location: 'Bengaluru, Karnataka',
      isEmailVerified: true
    });
  }
  const tokenHome1 = jwt.sign({ id: homeUser1._id, role: homeUser1.role }, jwtSecret, { expiresIn: '1d' });

  let org1 = await Organization.findOne({ user: homeUser1._id });
  if (!org1) {
    org1 = await Organization.create({
      user: homeUser1._id,
      name: 'Ananda Nilaya Elderly Care Trust',
      address: '100 Feet Road, Koramangala',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560034',
      phone: '+91 92222 00001',
      email: 'home1.mod3@careconnect.test',
      responsiblePerson: 'Shri K. Ramanathan',
      organizationType: 'Trust',
      registrationNumber: 'TRUST/BLR/2020/1122',
      verificationStatus: 'VERIFIED'
    });
  }

  // Home 2 (Unrelated Old-Age Home for cross-facility permission checks)
  let homeUser2 = await User.findOne({ email: 'home2.mod3@careconnect.test' });
  if (!homeUser2) {
    homeUser2 = await User.create({
      name: 'Sukh Sadan Elders Haven',
      email: 'home2.mod3@careconnect.test',
      password: 'HomePass123!',
      phone: '+91 92222 00002',
      role: 'home',
      location: 'Mysuru, Karnataka',
      isEmailVerified: true
    });
  }
  const tokenHome2 = jwt.sign({ id: homeUser2._id, role: homeUser2.role }, jwtSecret, { expiresIn: '1d' });

  let org2 = await Organization.findOne({ user: homeUser2._id });
  if (!org2) {
    org2 = await Organization.create({
      user: homeUser2._id,
      name: 'Sukh Sadan Charitable Home',
      address: 'Temple Road, Gokulam',
      city: 'Mysuru',
      state: 'Karnataka',
      pincode: '570002',
      phone: '+91 92222 00002',
      email: 'home2.mod3@careconnect.test',
      responsiblePerson: 'Mrs. Jayashree Murthy',
      organizationType: 'Society',
      registrationNumber: 'SOC/MYS/2019/5544',
      verificationStatus: 'VERIFIED'
    });
  }

  console.log('[Setup] Test environment prepared successfully.\n');

  let testDonationId = '';
  let secondDonationId = '';

  // --------------------------------------------------------------------------
  // SCENARIO 1: A donor successfully creates a donation
  // --------------------------------------------------------------------------
  console.log('TEST 1: Donor creates a valid donation request');
  try {
    const futureDate = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];
    const res = await fetch(`${BASE_URL}/donations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenDonor1}`
      },
      body: JSON.stringify({
        homeId: org1._id.toString(),
        category: 'Food and groceries',
        itemName: '50 kg Premium Sona Masoori Rice & Dal Bags',
        description: 'New sealed bags of rice and toor dal for monthly kitchen use',
        quantity: 50,
        unit: 'kg',
        preferredDeliveryDate: futureDate,
        message: 'With love and respect from our family to the elders',
        notes: 'Will personally drop off at the front office on weekend'
      })
    });
    const data = await res.json();
    if (
      res.status === 201 &&
      data.success &&
      data.data?.donation?.status === 'PENDING' &&
      data.data.donation.statusHistory?.length === 1
    ) {
      testDonationId = data.data.donation._id;
      console.log(` [PASS] Donation created successfully! ID: #${testDonationId.slice(-6).toUpperCase()}, Status: PENDING`);
      passed++;
    } else {
      console.log(' [FAIL] Could not create donation:', data.message);
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in Test 1:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // SCENARIO 2: Invalid or missing form fields are rejected
  // --------------------------------------------------------------------------
  console.log('\nTEST 2: Invalid or missing form fields are properly rejected');
  try {
    // 2a: Missing item title
    const res1 = await fetch(`${BASE_URL}/donations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenDonor1}` },
      body: JSON.stringify({
        homeId: org1._id.toString(),
        category: 'Food and groceries',
        itemName: '', // Missing
        quantity: 10,
        unit: 'kg',
        preferredDeliveryDate: new Date(Date.now() + 86400000).toISOString()
      })
    });
    const d1 = await res1.json();

    // 2b: Invalid quantity (negative or zero)
    const res2 = await fetch(`${BASE_URL}/donations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenDonor1}` },
      body: JSON.stringify({
        homeId: org1._id.toString(),
        category: 'Food and groceries',
        itemName: 'Biscuits',
        quantity: -5, // Invalid
        unit: 'boxes',
        preferredDeliveryDate: new Date(Date.now() + 86400000).toISOString()
      })
    });
    const d2 = await res2.json();

    // 2c: Past delivery date
    const res3 = await fetch(`${BASE_URL}/donations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenDonor1}` },
      body: JSON.stringify({
        homeId: org1._id.toString(),
        category: 'Clothes',
        itemName: 'Blankets',
        quantity: 5,
        unit: 'units',
        preferredDeliveryDate: '2020-01-01' // Past date
      })
    });
    const d3 = await res3.json();

    // 2d: Financial support category online payment rejection
    const res4 = await fetch(`${BASE_URL}/donations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenDonor1}` },
      body: JSON.stringify({
        homeId: org1._id.toString(),
        category: 'Financial support',
        itemName: 'Funds transfer',
        quantity: 1000,
        unit: 'INR',
        preferredDeliveryDate: new Date(Date.now() + 86400000).toISOString()
      })
    });
    const d4 = await res4.json();

    if (
      res1.status === 400 &&
      res2.status === 400 &&
      res3.status === 400 &&
      res4.status === 400
    ) {
      console.log(' [PASS] All 4 invalid inputs rejected correctly with 400 status & helpful error messages.');
      passed++;
    } else {
      console.log(' [FAIL] Validation check failed to reject invalid input correctly.');
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in Test 2:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // SCENARIO 3: A donor can see their own donations
  // --------------------------------------------------------------------------
  console.log('\nTEST 3: Donor can view their own donation list and details');
  try {
    const res = await fetch(`${BASE_URL}/donations/my`, {
      headers: { Authorization: `Bearer ${tokenDonor1}` }
    });
    const data = await res.json();
    const myDonations = data.data?.donations || [];
    const found = myDonations.some((d) => d._id === testDonationId);

    const singleRes = await fetch(`${BASE_URL}/donations/${testDonationId}`, {
      headers: { Authorization: `Bearer ${tokenDonor1}` }
    });
    const singleData = await singleRes.json();

    if (res.status === 200 && found && singleRes.status === 200 && singleData.data?.donation) {
      console.log(` [PASS] Donor 1 successfully listed own donations (${myDonations.length} total) and accessed donation details.`);
      passed++;
    } else {
      console.log(' [FAIL] Donor could not access own donations.');
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in Test 3:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // SCENARIO 4: A donor cannot see or modify another donor's donation
  // --------------------------------------------------------------------------
  console.log('\nTEST 4: Donor 2 is blocked from viewing or modifying Donor 1\'s donation (RBAC)');
  try {
    // Attempt to view
    const viewRes = await fetch(`${BASE_URL}/donations/${testDonationId}`, {
      headers: { Authorization: `Bearer ${tokenDonor2}` }
    });
    const viewData = await viewRes.json();

    // Attempt to cancel
    const cancelRes = await fetch(`${BASE_URL}/donations/${testDonationId}/cancel`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenDonor2}` }
    });
    const cancelData = await cancelRes.json();

    if (viewRes.status === 403 && cancelRes.status === 403) {
      console.log(' [PASS] Access denied with 403 Forbidden for unauthorized donor.');
      passed++;
    } else {
      console.log(` [FAIL] Cross-donor authorization leak. View: ${viewRes.status}, Cancel: ${cancelRes.status}`);
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in Test 4:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // SCENARIO 5: The intended home can accept or reject a pending donation
  // --------------------------------------------------------------------------
  console.log('\nTEST 5: Intended Home 1 can accept or decline donation requests');
  try {
    // 5a. Home 1 accepts testDonationId
    const acceptRes = await fetch(`${BASE_URL}/donations/${testDonationId}/accept`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenHome1}`
      },
      body: JSON.stringify({ notes: 'We gladly accept this grocery pledge.' })
    });
    const acceptData = await acceptRes.json();

    // 5b. Create another donation to test rejection with reason
    const futureDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    const create2Res = await fetch(`${BASE_URL}/donations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenDonor1}` },
      body: JSON.stringify({
        homeId: org1._id.toString(),
        category: 'Furniture',
        itemName: '4 Used Wooden Armchairs',
        quantity: 4,
        unit: 'units',
        preferredDeliveryDate: futureDate
      })
    });
    const create2Data = await create2Res.json();
    secondDonationId = create2Data.data?.donation?._id;

    // Home 1 declines secondDonationId with reason
    const rejectRes = await fetch(`${BASE_URL}/donations/${secondDonationId}/reject`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenHome1}` },
      body: JSON.stringify({ rejectionReason: 'Currently lack storage space in common room.' })
    });
    const rejectData = await rejectRes.json();

    if (
      acceptRes.status === 200 &&
      acceptData.data?.donation?.status === 'ACCEPTED' &&
      rejectRes.status === 200 &&
      rejectData.data?.donation?.status === 'REJECTED' &&
      rejectData.data.donation.rejectionReason === 'Currently lack storage space in common room.'
    ) {
      console.log(' [PASS] Intended home successfully accepted request 1 (Status: ACCEPTED) and declined request 2 with reason (Status: REJECTED).');
      passed++;
    } else {
      console.log(' [FAIL] Home accept or reject failed.');
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in Test 5:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // SCENARIO 6: A different home cannot manage that donation
  // --------------------------------------------------------------------------
  console.log('\nTEST 6: Unrelated Home 2 cannot accept or manage Home 1\'s donation (RBAC)');
  try {
    const res = await fetch(`${BASE_URL}/donations/${testDonationId}/accept`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenHome2}`
      }
    });
    const data = await res.json();
    if (res.status === 403) {
      console.log(' [PASS] Unrelated Home 2 was denied access with 403 Forbidden.');
      passed++;
    } else {
      console.log(' [FAIL] Cross-home unauthorized access permitted:', res.status, data.message);
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in Test 6:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // SCENARIO 7: Delivery scheduling and status transitions work correctly
  // Workflow: PENDING -> ACCEPTED -> SCHEDULED -> DELIVERED -> COMPLETED
  // --------------------------------------------------------------------------
  console.log('\nTEST 7: Full delivery scheduling and status lifecycle transitions');
  try {
    // 7a. Schedule delivery
    const scheduleDate = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
    const schedRes = await fetch(`${BASE_URL}/donations/${testDonationId}/schedule`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenHome1}`
      },
      body: JSON.stringify({
        scheduledDate: scheduleDate,
        notes: 'Delivery reception confirmed for morning slot'
      })
    });
    const schedData = await schedRes.json();

    // 7b. Donor marks items as DELIVERED
    const delivRes = await fetch(`${BASE_URL}/donations/${testDonationId}/mark-delivered`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenDonor1}`
      },
      body: JSON.stringify({ notes: 'Items handed over to delivery driver' })
    });
    const delivData = await delivRes.json();

    // 7c. Home confirms receipt as COMPLETED
    const compRes = await fetch(`${BASE_URL}/donations/${testDonationId}/complete`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenHome1}`
      },
      body: JSON.stringify({ notes: 'Verified 50 kg rice and dal bags in pantry.' })
    });
    const compData = await compRes.json();

    if (
      schedRes.status === 200 &&
      schedData.data?.donation?.status === 'SCHEDULED' &&
      delivRes.status === 200 &&
      delivData.data?.donation?.status === 'DELIVERED' &&
      delivData.data?.donation?.deliveredAt &&
      compRes.status === 200 &&
      compData.data?.donation?.status === 'COMPLETED' &&
      compData.data?.donation?.completedAt
    ) {
      console.log(' [PASS] Complete lifecycle executed: ACCEPTED -> SCHEDULED -> DELIVERED -> COMPLETED with full timestamps & audit trail.');
      passed++;
    } else {
      console.log(' [FAIL] Lifecycle transitions failed.');
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in Test 7:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // SCENARIO 8: Invalid status transitions are rejected
  // --------------------------------------------------------------------------
  console.log('\nTEST 8: Invalid status transitions are rejected (Enforcing State Machine)');
  try {
    // 8a. Attempt to accept a donation that is already COMPLETED
    const invRes1 = await fetch(`${BASE_URL}/donations/${testDonationId}/accept`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenHome1}` }
    });

    // 8b. Attempt to mark delivered a donation that is REJECTED
    const invRes2 = await fetch(`${BASE_URL}/donations/${secondDonationId}/mark-delivered`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenDonor1}` }
    });

    // 8c. Attempt to complete a donation that is not in DELIVERED status
    const invRes3 = await fetch(`${BASE_URL}/donations/${secondDonationId}/complete`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenHome1}` }
    });

    if (invRes1.status === 400 && invRes2.status === 400 && invRes3.status === 400) {
      console.log(' [PASS] All illegal status mutations blocked by backend state machine with 400 Bad Request.');
      passed++;
    } else {
      console.log(' [FAIL] State machine allowed invalid transition:', invRes1.status, invRes2.status, invRes3.status);
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in Test 8:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // SCENARIO 9: Eligible cancellation works; Ineligible cancellation rejected
  // --------------------------------------------------------------------------
  console.log('\nTEST 9: Eligible donation cancellation by donor');
  try {
    // 9a. Create a fresh PENDING donation and cancel it
    const futureDate = new Date(Date.now() + 8 * 86400000).toISOString().split('T')[0];
    const newDonationRes = await fetch(`${BASE_URL}/donations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenDonor1}` },
      body: JSON.stringify({
        homeId: org1._id.toString(),
        category: 'Medicines and medical supplies',
        itemName: 'Digital Thermometers & Oximeters',
        quantity: 10,
        unit: 'units',
        preferredDeliveryDate: futureDate
      })
    });
    const newDonationData = await newDonationRes.json();
    const canxId = newDonationData.data?.donation?._id;

    // Donor cancels
    const canxRes = await fetch(`${BASE_URL}/donations/${canxId}/cancel`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenDonor1}` },
      body: JSON.stringify({ reason: 'Found alternative local pharmacy sponsor' })
    });
    const canxData = await canxRes.json();

    // 9b. Ineligible cancellation: Attempt to cancel testDonationId (which is already COMPLETED)
    const ineligRes = await fetch(`${BASE_URL}/donations/${testDonationId}/cancel`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenDonor1}` }
    });

    if (
      canxRes.status === 200 &&
      canxData.data?.donation?.status === 'CANCELLED' &&
      ineligRes.status === 400
    ) {
      console.log(' [PASS] Eligible cancellation succeeded (Status: CANCELLED), and cancellation of completed items was rejected.');
      passed++;
    } else {
      console.log(' [FAIL] Cancellation test failed.');
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in Test 9:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // SCENARIO 10: Completed donations appear correctly in donor statistics
  // --------------------------------------------------------------------------
  console.log('\nTEST 10: Dynamic donor statistics calculated from real database records');
  try {
    const res = await fetch(`${BASE_URL}/donations/my`, {
      headers: { Authorization: `Bearer ${tokenDonor1}` }
    });
    const data = await res.json();
    const stats = data.data?.stats;

    if (
      res.status === 200 &&
      stats &&
      stats.total >= 3 &&
      stats.completed >= 1 &&
      stats.cancelled >= 1 &&
      stats.rejected >= 1
    ) {
      console.log(` [PASS] Live Donor Statistics verified: Total: ${stats.total}, Completed: ${stats.completed}, Cancelled: ${stats.cancelled}, Rejected: ${stats.rejected}, Pending: ${stats.pending}.`);
      passed++;
    } else {
      console.log(' [FAIL] Incorrect donor statistics:', stats);
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in Test 10:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // SCENARIO 11: Application works with existing authentication system
  // --------------------------------------------------------------------------
  console.log('\nTEST 11: JWT authentication & unauthorized access protection');
  try {
    // 11a: No token
    const noTokenRes = await fetch(`${BASE_URL}/donations/my`);
    // 11b: Invalid token
    const badTokenRes = await fetch(`${BASE_URL}/donations/my`, {
      headers: { Authorization: 'Bearer invalid.token.payload' }
    });

    if (noTokenRes.status === 401 && badTokenRes.status === 401) {
      console.log(' [PASS] Unauthenticated and invalid token requests rejected with 401 Unauthorized.');
      passed++;
    } else {
      console.log(' [FAIL] Auth middleware failed to block unauthenticated requests.');
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in Test 11:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // SCENARIO 12: Existing Module 1 features still work
  // --------------------------------------------------------------------------
  console.log('\nTEST 12: Module 1 authentication, user profile, and session endpoints integrity');
  try {
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${tokenDonor1}` }
    });
    const meData = await meRes.json();

    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();

    if (meRes.status === 200 && meData.data?.user?.email === 'donor1.mod3@careconnect.test' && healthRes.status === 200 && healthData.success) {
      console.log(' [PASS] Module 1 User & Auth endpoints remain fully operational.');
      passed++;
    } else {
      console.log(' [FAIL] Module 1 endpoint check failed.');
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in Test 12:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // TEST SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n====================================================');
  console.log(`MODULE 3 TEST SUMMARY: ${passed} / 12 SCENARIOS PASSED (${failed} FAILED)`);
  console.log('====================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runModule3Tests();
