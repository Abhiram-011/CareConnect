// Automated Test Suite for Module 4: Volunteer Management
// Tests all 13 scenarios specified in Section 12 of the requirements.
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import Organization from './models/Organization.js';
import VolunteerProfile from './models/VolunteerProfile.js';
import VolunteerOpportunity from './models/VolunteerOpportunity.js';
import VolunteerApplication from './models/VolunteerApplication.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const BASE_URL = 'http://localhost:5000/api';

async function runModule4Tests() {
  console.log('====================================================');
  console.log('STARTING MODULE 4: VOLUNTEER MANAGEMENT TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/careconnect';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }
  const jwtSecret = process.env.JWT_SECRET || 'careconnect_super_secret_jwt_key_2026_secure';

  // Ensure server is running
  try {
    const health = await fetch(`${BASE_URL}/health`);
    if (!health.ok) throw new Error('Server not responding');
  } catch (err) {
    console.log('[Setup] Server not running. Starting server...');
    await import('./server.js');
    await new Promise((r) => setTimeout(r, 2000));
  }

  // Setup test accounts
  console.log('[Setup] Preparing test accounts and test data in database...');

  // Volunteer 1
  let vol1 = await User.findOne({ email: 'vol1.mod4@careconnect.test' });
  if (!vol1) {
    vol1 = await User.create({
      name: 'Maya Sharma (Volunteer 1)',
      email: 'vol1.mod4@careconnect.test',
      password: 'VolPassword123!',
      phone: '+91 93333 00001',
      role: 'volunteer',
      location: 'Bengaluru, Karnataka',
      isEmailVerified: true
    });
  }
  const tokenVol1 = jwt.sign({ id: vol1._id, role: vol1.role }, jwtSecret, { expiresIn: '1d' });

  // Volunteer 2 (Separate volunteer for duplicate/concurrency checks)
  let vol2 = await User.findOne({ email: 'vol2.mod4@careconnect.test' });
  if (!vol2) {
    vol2 = await User.create({
      name: 'Karan Mehra (Volunteer 2)',
      email: 'vol2.mod4@careconnect.test',
      password: 'VolPassword123!',
      phone: '+91 93333 00002',
      role: 'volunteer',
      location: 'Bengaluru, Karnataka',
      isEmailVerified: true
    });
  }
  const tokenVol2 = jwt.sign({ id: vol2._id, role: vol2.role }, jwtSecret, { expiresIn: '1d' });

  // Home 1
  let homeUser1 = await User.findOne({ email: 'home1.mod4@careconnect.test' });
  if (!homeUser1) {
    homeUser1 = await User.create({
      name: 'Vatsalya Elderly Home',
      email: 'home1.mod4@careconnect.test',
      password: 'HomePassword123!',
      phone: '+91 94444 00001',
      role: 'home',
      location: 'Indiranagar, Bengaluru',
      isEmailVerified: true
    });
  }
  const tokenHome1 = jwt.sign({ id: homeUser1._id, role: homeUser1.role }, jwtSecret, { expiresIn: '1d' });

  let org1 = await Organization.findOne({ user: homeUser1._id });
  if (!org1) {
    org1 = await Organization.create({
      user: homeUser1._id,
      name: 'Vatsalya Senior Care Trust',
      address: '12th Main, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      phone: '+91 94444 00001',
      email: 'home1.mod4@careconnect.test',
      responsiblePerson: 'Dr. R. K. Vatsa',
      organizationType: 'Trust',
      registrationNumber: 'TRUST/BLR/2021/7890',
      verificationStatus: 'VERIFIED'
    });
  }

  // Home 2 (Unrelated home)
  let homeUser2 = await User.findOne({ email: 'home2.mod4@careconnect.test' });
  if (!homeUser2) {
    homeUser2 = await User.create({
      name: 'Shanti Bhavan Home',
      email: 'home2.mod4@careconnect.test',
      password: 'HomePassword123!',
      phone: '+91 94444 00002',
      role: 'home',
      location: 'Whitefield, Bengaluru',
      isEmailVerified: true
    });
  }
  const tokenHome2 = jwt.sign({ id: homeUser2._id, role: homeUser2.role }, jwtSecret, { expiresIn: '1d' });

  console.log('[Setup] Accounts ready.\n');

  let testOpportunityId = '';
  let fullOpportunityId = '';
  let closedOpportunityId = '';
  let testAppId = '';

  // --------------------------------------------------------------------------
  // SCENARIO 1: A volunteer can update their own profile
  // --------------------------------------------------------------------------
  console.log('TEST 1: Volunteer can view and update their own volunteer profile');
  try {
    const updateRes = await fetch(`${BASE_URL}/volunteers/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenVol1}`
      },
      body: JSON.stringify({
        bio: 'Passionate about elder care, storytelling, and music therapy.',
        skills: ['Elder Care', 'Storytelling', 'First Aid', 'Music'],
        interests: ['Companionship and social activities', 'Event assistance'],
        availability: ['Weekends', 'Evening'],
        preferredLocation: 'Bengaluru East',
        preferredWorkTypes: ['Companionship and social activities'],
        experience: '3 years of weekly volunteering at community seniors center.'
      })
    });
    const updateData = await updateRes.json();

    const getRes = await fetch(`${BASE_URL}/volunteers/profile`, {
      headers: { Authorization: `Bearer ${tokenVol1}` }
    });
    const getData = await getRes.json();

    if (
      updateRes.status === 200 &&
      updateData.success &&
      getRes.status === 200 &&
      getData.data?.profile?.bio === 'Passionate about elder care, storytelling, and music therapy.' &&
      getData.data.profile.skills.includes('Elder Care')
    ) {
      console.log(' [PASS] Volunteer profile updated and fetched successfully with populated user data.');
      passed++;
    } else {
      console.log(' [FAIL] Could not update or fetch profile:', updateData);
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in Test 1:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // SCENARIO 2: A home can create and manage its own opportunities
  // --------------------------------------------------------------------------
  console.log('\nTEST 2: Home can create and manage its own volunteer opportunities');
  try {
    const futureDate = new Date(Date.now() + 10 * 86400000).toISOString();
    const deadline = new Date(Date.now() + 8 * 86400000).toISOString();

    const createRes = await fetch(`${BASE_URL}/volunteer-opportunities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenHome1}`
      },
      body: JSON.stringify({
        title: 'Weekend Storytelling & Singing Session with Elders',
        description: 'Spend 2 hours sharing nostalgic stories and singing classic songs with residents.',
        category: 'Companionship and social activities',
        requiredSkills: ['Music', 'Fluent in local language', 'Patience'],
        volunteerCapacity: 2,
        location: 'Vatsalya Hall, Indiranagar, Bengaluru',
        taskDate: futureDate,
        startTime: '10:00 AM',
        endTime: '12:00 PM',
        applicationDeadline: deadline,
        instructions: 'Please arrive 15 minutes early for orientation.'
      })
    });
    const createData = await createRes.json();

    if (createRes.status === 201 && createData.data?.opportunity?._id) {
      testOpportunityId = createData.data.opportunity._id;
      console.log(` [PASS] Opportunity created with capacity 2. ID: ${testOpportunityId}`);

      // Now Home 1 updates the opportunity description
      const editRes = await fetch(`${BASE_URL}/volunteer-opportunities/${testOpportunityId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenHome1}`
        },
        body: JSON.stringify({
          instructions: 'Please bring your photo ID and arrive 15 minutes before the session.'
        })
      });
      const editData = await editRes.json();

      if (editRes.status === 200 && editData.data?.opportunity?.instructions.includes('photo ID')) {
        console.log(' [PASS] Home successfully updated opportunity instructions.');
        passed++;
      } else {
        console.log(' [FAIL] Home could not edit opportunity:', editData);
        failed++;
      }
    } else {
      console.log(' [FAIL] Could not create opportunity:', createData);
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in Test 2:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // SCENARIO 3: Volunteers can browse and search open opportunities
  // --------------------------------------------------------------------------
  console.log('\nTEST 3: Volunteers can browse, search, and filter opportunities');
  try {
    const listRes = await fetch(`${BASE_URL}/volunteer-opportunities?category=Companionship%20and%20social%20activities`);
    const listData = await listRes.json();

    const searchRes = await fetch(`${BASE_URL}/volunteer-opportunities?search=Storytelling`);
    const searchData = await searchRes.json();

    const detailRes = await fetch(`${BASE_URL}/volunteer-opportunities/${testOpportunityId}`, {
      headers: { Authorization: `Bearer ${tokenVol1}` }
    });
    const detailData = await detailRes.json();

    if (
      listRes.status === 200 &&
      listData.data?.opportunities?.length > 0 &&
      searchRes.status === 200 &&
      searchData.data?.opportunities?.some((o) => o._id === testOpportunityId) &&
      detailRes.status === 200 &&
      detailData.data?.opportunity?._id === testOpportunityId
    ) {
      console.log(` [PASS] Browse, search ('Storytelling'), and opportunity details fetched successfully.`);
      passed++;
    } else {
      console.log(' [FAIL] Browse or search failed:', listData, searchData);
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in Test 3:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // SCENARIO 4: A volunteer can apply successfully
  // --------------------------------------------------------------------------
  console.log('\nTEST 4: Volunteer 1 applies successfully for an open opportunity');
  try {
    const applyRes = await fetch(`${BASE_URL}/volunteer-opportunities/${testOpportunityId}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenVol1}`
      },
      body: JSON.stringify({
        motivation: 'I love engaging with the elderly and would be delighted to host this storytelling session.',
        relevantSkills: ['Music', 'Storytelling']
      })
    });
    const applyData = await applyRes.json();

    if (applyRes.status === 201 && applyData.data?.application?.status === 'PENDING') {
      testAppId = applyData.data.application._id;
      console.log(` [PASS] Application created successfully! ID: ${testAppId}, Status: PENDING`);
      passed++;
    } else {
      console.log(' [FAIL] Application failed:', applyData);
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in Test 4:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // SCENARIO 5: Duplicate applications are rejected
  // --------------------------------------------------------------------------
  console.log('\nTEST 5: Duplicate application by Volunteer 1 is rejected (Enforcing uniqueness)');
  try {
    const dupRes = await fetch(`${BASE_URL}/volunteer-opportunities/${testOpportunityId}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenVol1}`
      },
      body: JSON.stringify({
        motivation: 'Applying a second time accidentally.'
      })
    });
    const dupData = await dupRes.json();

    if (dupRes.status === 400 && dupData.message.includes('already')) {
      console.log(' [PASS] Duplicate application correctly rejected with message:', dupData.message);
      passed++;
    } else {
      console.log(' [FAIL] Duplicate application was not rejected:', dupRes.status, dupData);
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in Test 5:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // SCENARIO 6: Closed opportunities and expired deadlines reject applications
  // --------------------------------------------------------------------------
  console.log('\nTEST 6: Closed opportunities and expired deadlines reject applications');
  try {
    // 6a. Create a closed opportunity
    const closedOpp = await VolunteerOpportunity.create({
      homeId: org1._id,
      homeUser: homeUser1._id,
      title: 'Art Workshop (Cancelled/Closed)',
      description: 'Painting with residents.',
      category: 'Educational or recreational activities',
      volunteerCapacity: 3,
      location: 'Bengaluru',
      taskDate: new Date(Date.now() + 5 * 86400000),
      applicationDeadline: new Date(Date.now() + 3 * 86400000),
      status: 'CLOSED'
    });
    closedOpportunityId = closedOpp._id.toString();

    // 6b. Create an opportunity with expired deadline
    const expiredOpp = await VolunteerOpportunity.create({
      homeId: org1._id,
      homeUser: homeUser1._id,
      title: 'Past Event',
      description: 'Yesterday event.',
      category: 'General support',
      volunteerCapacity: 2,
      location: 'Bengaluru',
      taskDate: new Date(Date.now() - 1 * 86400000),
      applicationDeadline: new Date(Date.now() - 2 * 86400000),
      status: 'OPEN'
    });

    const resClosed = await fetch(`${BASE_URL}/volunteer-opportunities/${closedOpportunityId}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenVol2}` },
      body: JSON.stringify({ motivation: 'Test closed' })
    });
    const dataClosed = await resClosed.json();

    const resExpired = await fetch(`${BASE_URL}/volunteer-opportunities/${expiredOpp._id}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenVol2}` },
      body: JSON.stringify({ motivation: 'Test expired' })
    });
    const dataExpired = await resExpired.json();

    if (
      resClosed.status === 400 &&
      dataClosed.message.toLowerCase().includes('closed') &&
      resExpired.status === 400 &&
      dataExpired.message.toLowerCase().includes('deadline')
    ) {
      console.log(' [PASS] Applications to closed opportunity and expired deadline both rejected with 400.');
      passed++;
    } else {
      console.log(' [FAIL] Application validation failed:', resClosed.status, resExpired.status);
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in Test 6:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // SCENARIO 7: Unauthorized users cannot manage opportunities or applications
  // --------------------------------------------------------------------------
  console.log('\nTEST 7: Unauthorized role checks (Volunteers cannot create opportunities, unauth cannot apply)');
  try {
    // 7a. Volunteer tries to create an opportunity (only home can)
    const volCreateRes = await fetch(`${BASE_URL}/volunteer-opportunities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenVol1}`
      },
      body: JSON.stringify({
        title: 'Hacked Opportunity',
        description: 'Should fail',
        category: 'General support',
        volunteerCapacity: 5,
        location: 'Bengaluru',
        taskDate: new Date(Date.now() + 86400000),
        applicationDeadline: new Date(Date.now() + 86400000)
      })
    });

    // 7b. Unauthenticated user tries to apply
    const unauthApply = await fetch(`${BASE_URL}/volunteer-opportunities/${testOpportunityId}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivation: 'No token' })
    });

    if (volCreateRes.status === 403 && unauthApply.status === 401) {
      console.log(' [PASS] Volunteer blocked from creating opportunities (403), unauthenticated user blocked (401).');
      passed++;
    } else {
      console.log(' [FAIL] RBAC check failed. Create status:', volCreateRes.status, 'Unauth apply status:', unauthApply.status);
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in Test 7:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // SCENARIO 8: Homes cannot access another home's applications
  // --------------------------------------------------------------------------
  console.log('\nTEST 8: Home 2 cannot access applications or manage opportunities of Home 1 (Isolation)');
  try {
    // Home 2 tries to view applications of Home 1's opportunity
    const viewAppsRes = await fetch(`${BASE_URL}/volunteer-opportunities/${testOpportunityId}/applications`, {
      headers: { Authorization: `Bearer ${tokenHome2}` }
    });
    const viewAppsData = await viewAppsRes.json();

    // Home 2 tries to accept Volunteer 1's application
    const acceptRes = await fetch(`${BASE_URL}/volunteer-applications/${testAppId}/accept`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenHome2}` }
    });
    const acceptData = await acceptRes.json();

    if (viewAppsRes.status === 403 && acceptRes.status === 403) {
      console.log(' [PASS] Unrelated Home 2 was denied access with 403 Forbidden for both viewing and accepting applications.');
      passed++;
    } else {
      console.log(' [FAIL] Cross-home isolation failed:', viewAppsRes.status, acceptRes.status);
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in Test 8:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // SCENARIO 9: Capacity limits are enforced when accepting volunteers
  // --------------------------------------------------------------------------
  console.log('\nTEST 9: Capacity limits strictly enforced when accepting volunteers');
  try {
    // Create an opportunity with capacity = 1
    const singleCapOpp = await VolunteerOpportunity.create({
      homeId: org1._id,
      homeUser: homeUser1._id,
      title: 'Solo Library Organizer',
      description: 'Organize library books for seniors.',
      category: 'Educational or recreational activities',
      volunteerCapacity: 1,
      volunteersAccepted: 0,
      location: 'Bengaluru',
      taskDate: new Date(Date.now() + 5 * 86400000),
      applicationDeadline: new Date(Date.now() + 4 * 86400000),
      status: 'OPEN'
    });
    fullOpportunityId = singleCapOpp._id.toString();

    // Volunteer 1 applies
    const app1 = await VolunteerApplication.create({
      opportunityId: singleCapOpp._id,
      volunteerId: vol1._id,
      motivation: 'I love organizing books.',
      status: 'PENDING'
    });

    // Volunteer 2 applies
    const app2 = await VolunteerApplication.create({
      opportunityId: singleCapOpp._id,
      volunteerId: vol2._id,
      motivation: 'I also want to organize books.',
      status: 'PENDING'
    });

    // Home 1 accepts app1 (Capacity reaches 1/1)
    const accept1Res = await fetch(`${BASE_URL}/volunteer-applications/${app1._id}/accept`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenHome1}` }
    });
    const accept1Data = await accept1Res.json();

    // Home 1 attempts to accept app2 (Should fail because capacity is full)
    const accept2Res = await fetch(`${BASE_URL}/volunteer-applications/${app2._id}/accept`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenHome1}` }
    });
    const accept2Data = await accept2Res.json();

    if (
      accept1Res.status === 200 &&
      accept1Data.data?.application?.status === 'ACCEPTED' &&
      accept2Res.status === 400 &&
      accept2Data.message?.toLowerCase().includes('capacity')
    ) {
      console.log(' [PASS] First applicant accepted; second applicant rejected with capacity limit error (400).');
      passed++;
    } else {
      console.log(' [FAIL] Capacity limit not enforced properly:', accept1Res.status, accept2Res.status, accept2Data);
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in Test 9:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // SCENARIO 10: Volunteers can view and withdraw eligible applications
  // --------------------------------------------------------------------------
  console.log('\nTEST 10: Volunteer can view own applications and withdraw eligible PENDING applications');
  try {
    // Create an opportunity and application for vol2
    const oppForWithdraw = await VolunteerOpportunity.create({
      homeId: org1._id,
      homeUser: homeUser1._id,
      title: 'Garden Care Assistance',
      description: 'Help tending flower beds.',
      category: 'General support',
      volunteerCapacity: 2,
      location: 'Bengaluru',
      taskDate: new Date(Date.now() + 6 * 86400000),
      applicationDeadline: new Date(Date.now() + 5 * 86400000),
      status: 'OPEN'
    });

    const appToWithdraw = await VolunteerApplication.create({
      opportunityId: oppForWithdraw._id,
      volunteerId: vol2._id,
      motivation: 'Gardening enthusiast',
      status: 'PENDING'
    });

    // Volunteer 2 withdraws application
    const withdrawRes = await fetch(`${BASE_URL}/volunteer-applications/${appToWithdraw._id}/withdraw`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenVol2}`
      },
      body: JSON.stringify({ notes: 'Conflict in schedule' })
    });
    const withdrawData = await withdrawRes.json();

    // Volunteer 1 attempts to withdraw Volunteer 2's application (Should be 403)
    const illegalWithdraw = await fetch(`${BASE_URL}/volunteer-applications/${appToWithdraw._id}/withdraw`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenVol1}` }
    });

    if (
      withdrawRes.status === 200 &&
      withdrawData.data?.application?.status === 'WITHDRAWN' &&
      illegalWithdraw.status === 403
    ) {
      console.log(' [PASS] Eligible withdrawal succeeded (Status: WITHDRAWN); Cross-volunteer withdrawal denied (403).');
      passed++;
    } else {
      console.log(' [FAIL] Application withdrawal failed:', withdrawRes.status, illegalWithdraw.status);
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in Test 10:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // SCENARIO 11: Homes can accept, reject, and complete applications
  // --------------------------------------------------------------------------
  console.log('\nTEST 11: Home accepts testAppId, marks COMPLETED after task completion');
  try {
    // 11a. Home accepts testAppId
    const acceptRes = await fetch(`${BASE_URL}/volunteer-applications/${testAppId}/accept`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenHome1}` }
    });
    const acceptData = await acceptRes.json();

    // 11b. Home marks testAppId as COMPLETED
    const compRes = await fetch(`${BASE_URL}/volunteer-applications/${testAppId}/complete`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenHome1}`
      },
      body: JSON.stringify({ notes: 'Volunteered for 2 hours with immense warmth.' })
    });
    const compData = await compRes.json();

    if (
      acceptRes.status === 200 &&
      acceptData.data?.application?.status === 'ACCEPTED' &&
      compRes.status === 200 &&
      compData.data?.application?.status === 'COMPLETED' &&
      compData.data?.application?.completedAt
    ) {
      console.log(' [PASS] Full Home lifecycle: ACCEPTED -> COMPLETED with completion timestamp.');
      passed++;
    } else {
      console.log(' [FAIL] Lifecycle transitions failed:', acceptRes.status, compRes.status);
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in Test 11:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // SCENARIO 12: Dashboard statistics reflect actual database records
  // --------------------------------------------------------------------------
  console.log('\nTEST 12: Volunteer and Home dashboard statistics reflect live database records');
  try {
    // Volunteer stats
    const volStatsRes = await fetch(`${BASE_URL}/volunteer-applications/my`, {
      headers: { Authorization: `Bearer ${tokenVol1}` }
    });
    const volStatsData = await volStatsRes.json();
    const stats = volStatsData.data?.stats;

    // Home opportunities stats
    const homeOppRes = await fetch(`${BASE_URL}/homes/volunteer-opportunities`, {
      headers: { Authorization: `Bearer ${tokenHome1}` }
    });
    const homeOppData = await homeOppRes.json();

    if (
      volStatsRes.status === 200 &&
      stats &&
      stats.totalApplications >= 1 &&
      stats.completed >= 1 &&
      homeOppRes.status === 200 &&
      homeOppData.data?.opportunities?.length > 0
    ) {
      console.log(` [PASS] Live Volunteer Stats verified: Total: ${stats.totalApplications}, Completed: ${stats.completed}, Available Opps: ${stats.availableOpportunities}.`);
      passed++;
    } else {
      console.log(' [FAIL] Dashboard statistics mismatch:', stats);
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in Test 12:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // SCENARIO 13: Existing Module 1 authentication and Module 3 donations still work
  // --------------------------------------------------------------------------
  console.log('\nTEST 13: Regression verification: Module 1 auth & Module 3 donations remain fully operational');
  try {
    const authMe = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${tokenVol1}` }
    });
    const authMeData = await authMe.json();

    const donationsRes = await fetch(`${BASE_URL}/donations/my`, {
      headers: { Authorization: `Bearer ${tokenVol1}` }
    });
    // Note: vol1 has role volunteer, so donation routes requiring role 'donor' return 403, as intended!
    const donStatus = donationsRes.status;

    if (authMe.status === 200 && authMeData.data?.user?.email === 'vol1.mod4@careconnect.test' && donStatus === 403) {
      console.log(' [PASS] Module 1 Auth verified, Module 3 role protection intact (Volunteers cannot create/view donor donations).');
      passed++;
    } else {
      console.log(' [FAIL] Regression test failed:', authMe.status, donStatus);
      failed++;
    }
  } catch (err) {
    console.log(' [FAIL] Exception in Test 13:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // TEST SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n====================================================');
  console.log(`MODULE 4 TEST SUMMARY: ${passed} / 13 SCENARIOS PASSED (${failed} FAILED)`);
  console.log('====================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runModule4Tests();
