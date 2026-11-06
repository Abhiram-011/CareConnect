// Comprehensive Automated Test Suite for Module 2: Old-Age Home & Requirements Management
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Organization from './models/Organization.js';
import Requirement from './models/Requirement.js';

dotenv.config();

const BASE_URL = 'http://localhost:5000/api';

async function runModule2Tests() {
  console.log('====================================================');
  console.log('STARTING MODULE 2 COMPREHENSIVE TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;
  let homeToken = '';
  let adminToken = '';
  let requirementId = '';

  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/careconnect';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  // Ensure server is running
  try {
    const health = await fetch(`${BASE_URL}/health`);
    if (!health.ok) throw new Error('Server not responding');
  } catch (err) {
    console.log('[Setup] Server not running. Starting server...');
    await import('./server.js');
    await new Promise((r) => setTimeout(r, 2000));
  }

  // 1. Login as Admin
  console.log('TEST 1: Admin Login');
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
    if (res.status === 200 && data.token) {
      adminToken = data.token;
      console.log(' [PASS] Admin logged in successfully.');
      passed++;
    } else {
      console.log(' [FAIL] Admin login failed:', data.message);
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in Admin login:', err.message);
    failed++;
  }

  // 2. Login as Old-Age Home (sneha.nilaya)
  console.log('\nTEST 2: Old-Age Home Login');
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sneha.nilaya@careconnect.org',
        password: 'HomePass123!'
      })
    });
    const data = await res.json();
    if (res.status === 200 && data.token) {
      homeToken = data.token;
      console.log(' [PASS] Home user logged in successfully.');
      passed++;
    } else {
      console.log(' [FAIL] Home user login failed:', data.message);
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in Home user login:', err.message);
    failed++;
  }

  // 3. Create a Requirement (Home role)
  console.log('\nTEST 3: Create New Requirement (Home role)');
  try {
    const res = await fetch(`${BASE_URL}/requirements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${homeToken}`
      },
      body: JSON.stringify({
        title: 'Fresh Milk & Daily Dairy Supply',
        description: '20 Litres of fresh pasteurized milk daily for breakfast porridge.',
        category: 'Groceries & Food',
        unit: 'litres',
        quantityRequired: 100,
        urgency: 'High',
        neededByDate: new Date(Date.now() + 5 * 86400000)
      })
    });
    const data = await res.json();
    if (res.status === 201 && data.data?.requirement?._id) {
      requirementId = data.data.requirement._id;
      console.log(' [PASS] Requirement created with status: ' + data.data.requirement.status);
      passed++;
    } else {
      console.log(' [FAIL] Create requirement failed:', data.message);
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in Create requirement:', err.message);
    failed++;
  }

  // 4. Update Requirement (Partial Fulfillment & Progress Tracking)
  console.log('\nTEST 4: Update Requirement (Fulfill 40 out of 100 units)');
  try {
    const res = await fetch(`${BASE_URL}/requirements/${requirementId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${homeToken}`
      },
      body: JSON.stringify({
        quantityFulfilled: 40
      })
    });
    const data = await res.json();
    if (
      res.status === 200 &&
      data.data?.requirement?.status === 'Partially Fulfilled' &&
      data.data?.requirement?.quantityFulfilled === 40
    ) {
      console.log(' [PASS] Requirement auto-updated to Partially Fulfilled (40% progress).');
      passed++;
    } else {
      console.log(' [FAIL] Update requirement failed:', data);
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in Update requirement:', err.message);
    failed++;
  }

  // 5. Fetch Home Requirements with Aggregated Metrics
  console.log('\nTEST 5: Fetch Home Requirements & Summary Stats');
  try {
    const res = await fetch(`${BASE_URL}/requirements/my-requirements`, {
      headers: {
        Authorization: `Bearer ${homeToken}`
      }
    });
    const data = await res.json();
    if (res.status === 200 && data.data?.requirements && data.data?.stats) {
      console.log(` [PASS] Retrieved ${data.data.requirements.length} requirements. Open: ${data.data.stats.open}, Partially Fulfilled: ${data.data.stats.partiallyFulfilled}`);
      passed++;
    } else {
      console.log(' [FAIL] Fetch home requirements failed:', data.message);
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in Fetch home requirements:', err.message);
    failed++;
  }

  // 6. Public Search & Filter Endpoint for Donors
  console.log('\nTEST 6: Public Search & Filter Requirements (Donors View)');
  try {
    const res = await fetch(`${BASE_URL}/requirements/public?category=Groceries%20%26%20Food`);
    const data = await res.json();
    if (res.status === 200 && Array.isArray(data.data?.requirements)) {
      console.log(` [PASS] Public requirements endpoint returned ${data.data.requirements.length} items for Groceries category.`);
      passed++;
    } else {
      console.log(' [FAIL] Public requirements fetch failed:', data.message);
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in Public requirements fetch:', err.message);
    failed++;
  }

  // 7. Delete Requirement (Home role)
  console.log('\nTEST 7: Delete Requirement');
  try {
    const res = await fetch(`${BASE_URL}/requirements/${requirementId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${homeToken}`
      }
    });
    const data = await res.json();
    if (res.status === 200 && data.success) {
      console.log(' [PASS] Requirement successfully deleted.');
      passed++;
    } else {
      console.log(' [FAIL] Delete requirement failed:', data.message);
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in Delete requirement:', err.message);
    failed++;
  }

  // 8. Admin Verification Stats
  console.log('\nTEST 8: Admin Verification Stats');
  try {
    const res = await fetch(`${BASE_URL}/organizations/admin/stats`, {
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });
    const data = await res.json();
    if (res.status === 200 && data.data?.total !== undefined) {
      console.log(` [PASS] Admin stats retrieved successfully. Total: ${data.data.total}, Verified: ${data.data.verified}, Pending: ${data.data.pending}`);
      passed++;
    } else {
      console.log(' [FAIL] Admin stats failed:', data.message);
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in Admin stats:', err.message);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`MODULE 2 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  try {
    await mongoose.disconnect();
  } catch (e) {}

  process.exit(failed > 0 ? 1 : 0);
}

runModule2Tests();
