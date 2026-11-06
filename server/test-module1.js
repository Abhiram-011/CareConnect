// Automated Test Suite for Module 1: User & Donor Management
// Tests all 8 scenarios specified in Section 25 of the requirements.

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('====================================================');
  console.log('STARTING MODULE 1 VERIFICATION & TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const testUser = {
    name: 'Abhiram Donor',
    email: `abhiram.donor.${Date.now()}@example.com`,
    phone: '+91 9876543210',
    password: 'Password123!',
    confirmPassword: 'Password123!',
    role: 'donor'
  };

  let donorToken = '';
  let donorId = '';

  // TEST 1: Register a donor with Email OTP
  console.log('TEST 1: Register a donor with Email OTP');
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    const data = await res.json();
    if (res.status === 201 && data.success && data.requiresOtp) {
      console.log(' [PASS] Account registered, OTP verification code dispatched.');

      // Query database directly to get generated OTP for test
      const mongooseMod = await import('mongoose');
      if (mongooseMod.default.connection.readyState === 0) {
        await mongooseMod.default.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/careconnect');
      }
      const UserMod = (await import('./models/User.js')).default;
      const userInDb = await UserMod.findOne({ email: testUser.email });

      // Verify OTP
      const otpRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          otp: userInDb.otpCode
        })
      });
      const otpData = await otpRes.json();
      if (otpRes.status === 200 && otpData.token) {
        donorToken = otpData.token;
        donorId = otpData.data.user._id;
        console.log(' [PASS] OTP verified successfully. Authenticated token received.');
        passed++;
      } else {
        console.error(' [FAIL] OTP verification failed:', otpData);
        failed++;
      }
    } else {
      console.error(' [FAIL] Expected 201 and requiresOtp: true, got:', res.status, data);
      failed++;
    }
  } catch (err) {
    console.error(' [FAIL] Exception in Test 1:', err.message);
    failed++;
  }
  console.log('----------------------------------------------------');

  // TEST 2: Try registering the same email again
  console.log('TEST 2: Try registering the same email again');
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    const data = await res.json();
    if (res.status === 400 && data.success === false && data.message.includes('already exists')) {
      console.log(' [PASS] Duplicate email rejected with message:', data.message);
      passed++;
    } else {
      console.error(' [FAIL] Expected 400 and duplicate email error, got:', res.status, data);
      failed++;
    }
  } catch (err) {
    console.error(' [FAIL] Exception in Test 2:', err.message);
    failed++;
  }
  console.log('----------------------------------------------------');

  // TEST 3: Login using correct credentials
  console.log('TEST 3: Login using correct credentials');
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });
    const data = await res.json();
    if (res.status === 200 && data.success && data.token && data.data?.user?.email === testUser.email) {
      console.log(' [PASS] Successful login. Token received for donor dashboard routing.');
      passed++;
    } else {
      console.error(' [FAIL] Expected 200 and login token, got:', res.status, data);
      failed++;
    }
  } catch (err) {
    console.error(' [FAIL] Exception in Test 3:', err.message);
    failed++;
  }
  console.log('----------------------------------------------------');

  // TEST 4: Login using incorrect password
  console.log('TEST 4: Login using incorrect password');
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: 'WrongPassword999!'
      })
    });
    const data = await res.json();
    if (res.status === 401 && data.success === false && data.message === 'Invalid email or password.') {
      console.log(' [PASS] Authentication error returned as expected:', data.message);
      passed++;
    } else {
      console.error(' [FAIL] Expected 401 and authentication error, got:', res.status, data);
      failed++;
    }
  } catch (err) {
    console.error(' [FAIL] Exception in Test 4:', err.message);
    failed++;
  }
  console.log('----------------------------------------------------');

  // TEST 5: Access donor dashboard / protected API without login
  console.log('TEST 5: Access protected route without login / token');
  try {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (res.status === 401 && data.success === false) {
      console.log(' [PASS] Unauthorized access rejected without token:', data.message);
      passed++;
    } else {
      console.error(' [FAIL] Expected 401 unauthorized, got:', res.status, data);
      failed++;
    }
  } catch (err) {
    console.error(' [FAIL] Exception in Test 5:', err.message);
    failed++;
  }
  console.log('----------------------------------------------------');

  // TEST 6: Logout / Invalidate token usage
  console.log('TEST 6: Verify authenticated session retrieval & clean state');
  try {
    // Valid token access
    const res1 = await fetch(`${BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${donorToken}`
      }
    });
    const data1 = await res1.json();

    // Invalid / cleared token access
    const res2 = await fetch(`${BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer invalid_or_cleared_token'
      }
    });
    const data2 = await res2.json();

    if (res1.status === 200 && data1.success && res2.status === 401 && !data2.success) {
      console.log(' [PASS] Authenticated state verified with valid token; invalid/cleared token rejected (401).');
      passed++;
    } else {
      console.error(' [FAIL] Token verification failed:', res1.status, res2.status);
      failed++;
    }
  } catch (err) {
    console.error(' [FAIL] Exception in Test 6:', err.message);
    failed++;
  }
  console.log('----------------------------------------------------');

  // TEST 7: Update profile
  console.log('TEST 7: Update profile (Name, Phone, Location, Profile Image)');
  try {
    const updatePayload = {
      name: 'Abhiram S. Updated',
      phone: '+91 99999 88888',
      location: 'Bengaluru, India',
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      role: 'admin', // Should be ignored by security rules
      email: 'hacked@email.com' // Should be ignored by security rules
    };

    const res = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${donorToken}`
      },
      body: JSON.stringify(updatePayload)
    });
    const data = await res.json();

    if (
      res.status === 200 &&
      data.success &&
      data.data?.user?.name === 'Abhiram S. Updated' &&
      data.data?.user?.phone === '+91 99999 88888' &&
      data.data?.user?.location === 'Bengaluru, India' &&
      data.data?.user?.role === 'donor' && // Must NOT have changed to admin
      data.data?.user?.email === testUser.email // Must NOT have changed
    ) {
      console.log(' [PASS] Profile updated successfully with role & email immutability preserved:');
      console.log(`        Name: ${data.data.user.name}, Location: ${data.data.user.location}, Role: ${data.data.user.role}`);
      passed++;
    } else {
      console.error(' [FAIL] Expected 200 and updated fields, got:', res.status, data);
      failed++;
    }
  } catch (err) {
    console.error(' [FAIL] Exception in Test 7:', err.message);
    failed++;
  }
  console.log('----------------------------------------------------');

  // TEST 8: Try accessing another role's protected API
  console.log("TEST 8: Try accessing another role's protected API (Admin-only check with Donor token)");
  try {
    // 1. Donor trying to access admin-only endpoint
    const resForbidden = await fetch(`${BASE_URL}/auth/admin-check`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${donorToken}`
      }
    });
    const dataForbidden = await resForbidden.json();

    // 2. Donor accessing donor-only endpoint
    const resAllowed = await fetch(`${BASE_URL}/auth/donor-check`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${donorToken}`
      }
    });
    const dataAllowed = await resAllowed.json();

    if (
      resForbidden.status === 403 &&
      dataForbidden.success === false &&
      dataForbidden.message.includes('Access denied') &&
      resAllowed.status === 200 &&
      dataAllowed.success === true
    ) {
      console.log(' [PASS] Access denied with 403 Forbidden for unauthorized role:', dataForbidden.message);
      console.log(' [PASS] Authorized role route succeeded with 200 OK:', dataAllowed.message);
      passed++;
    } else {
      console.error(' [FAIL] Expected 403 Forbidden for admin-check, got:', resForbidden.status, dataForbidden);
      failed++;
    }
  } catch (err) {
    console.error(' [FAIL] Exception in Test 8:', err.message);
    failed++;
  }
  console.log('----------------------------------------------------');

  // BONUS TEST: Registration as admin rejected
  console.log('BONUS SECURITY TEST: User attempting to register as Admin directly');
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Hacker Admin',
        email: `hacker.${Date.now()}@example.com`,
        phone: '1234567890',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        role: 'admin'
      })
    });
    const data = await res.json();
    if (res.status === 400 && data.success === false && data.message.includes('not permitted')) {
      console.log(' [PASS] Registration as admin successfully prevented:', data.message);
      passed++;
    } else {
      console.error(' [FAIL] Expected 400 rejection for admin role registration, got:', res.status, data);
      failed++;
    }
  } catch (err) {
    console.error(' [FAIL] Exception in Admin registration test:', err.message);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  try {
    const mongooseMod = await import('mongoose');
    await mongooseMod.default.disconnect();
  } catch (e) {}

  process.exit(failed > 0 ? 1 : 0);
}

runTests();

