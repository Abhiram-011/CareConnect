// Comprehensive Automated Test Suite for Module 6: Search, Tracking & Notification Module
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import Organization from './models/Organization.js';
import Donation from './models/Donation.js';
import VolunteerOpportunity from './models/VolunteerOpportunity.js';
import VolunteerApplication from './models/VolunteerApplication.js';
import Requirement from './models/Requirement.js';
import Notification from './models/Notification.js';

dotenv.config();

const BASE_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'careconnect_super_secret_jwt_key_2026_secure';

const makeToken = (user) => jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

async function runModule6Tests() {
  console.log('====================================================');
  console.log('STARTING MODULE 6: SEARCH, TRACKING & NOTIFICATIONS');
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

  const timestamp = Date.now();
  const donorEmail = `m6donor_${timestamp}@careconnect.test`;
  const donor2Email = `m6donor2_${timestamp}@careconnect.test`;
  const homeEmail = `m6home_${timestamp}@careconnect.test`;
  const volunteerEmail = `m6vol_${timestamp}@careconnect.test`;
  const volunteer2Email = `m6vol2_${timestamp}@careconnect.test`;

  let donorUser, donor2User, homeUser, volUser, vol2User;
  let donorToken, donor2Token, homeToken, volunteerToken, volunteer2Token;

  let createdOrgId = '';
  let createdRequirementId = '';
  let createdOpportunityId = '';
  let createdDonationId = '';
  let createdApplicationId = '';
  let testNotificationId = '';

  try {
    // -------------------------------------------------------------
    // SETUP: Create test users directly with verified status
    // -------------------------------------------------------------
    console.log('[Setup] Provisioning test actors...');

    donorUser = await User.create({
      name: 'Module 6 Donor',
      email: donorEmail,
      password: 'Password@123',
      phone: '9876543211',
      role: 'donor',
      location: 'Pune',
      isEmailVerified: true
    });
    donorToken = makeToken(donorUser);

    donor2User = await User.create({
      name: 'Module 6 Donor 2',
      email: donor2Email,
      password: 'Password@123',
      phone: '9876543212',
      role: 'donor',
      location: 'Mumbai',
      isEmailVerified: true
    });
    donor2Token = makeToken(donor2User);

    homeUser = await User.create({
      name: 'Silver Haven Admin',
      email: homeEmail,
      password: 'Password@123',
      phone: '9876543213',
      role: 'home',
      location: 'Pune',
      isEmailVerified: true
    });
    homeToken = makeToken(homeUser);

    volUser = await User.create({
      name: 'Module 6 Volunteer',
      email: volunteerEmail,
      password: 'Password@123',
      phone: '9876543214',
      role: 'volunteer',
      location: 'Pune',
      isEmailVerified: true
    });
    volunteerToken = makeToken(volUser);

    vol2User = await User.create({
      name: 'Module 6 Volunteer 2',
      email: volunteer2Email,
      password: 'Password@123',
      phone: '9876543215',
      role: 'volunteer',
      location: 'Nashik',
      isEmailVerified: true
    });
    volunteer2Token = makeToken(vol2User);

    // Setup an Organization for home user
    const testOrg = await Organization.create({
      user: homeUser._id,
      name: 'Silver Haven Senior Living',
      address: '101 Peace Avenue, Kothrud',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411038',
      phone: '9876543210',
      email: homeEmail,
      responsiblePerson: 'Dr. Asha Kulkarni',
      organizationType: 'Trust',
      registrationNumber: `REG-M6-${timestamp}`,
      verificationStatus: 'VERIFIED',
      careTypes: ['Assisted Living', 'Medical Care', 'Dementia Care'],
      description: 'A serene and loving sanctuary for elderly citizens in Pune.'
    });
    createdOrgId = testOrg._id.toString();

    // Create a Requirement (Donation Need)
    const testReq = await Requirement.create({
      organization: createdOrgId,
      title: 'Monthly Rice & Wheat Grains',
      description: 'Grain supplies needed for 45 resident seniors for the month.',
      category: 'Groceries & Food',
      unit: 'kg',
      quantityRequired: 100,
      quantityFulfilled: 25,
      urgency: 'High',
      status: 'Open'
    });
    createdRequirementId = testReq._id.toString();

    // Create an open Volunteer Opportunity
    const testOpp = await VolunteerOpportunity.create({
      homeId: createdOrgId,
      homeUser: homeUser._id,
      title: 'Sunday Recreational & Music Therapy',
      description: 'Spend 2 hours singing bhajans and playing board games with resident elders.',
      category: 'Educational or recreational activities',
      location: 'Pune',
      volunteerCapacity: 5,
      volunteersAccepted: 0,
      taskDate: new Date(Date.now() + 8 * 86400000),
      applicationDeadline: new Date(Date.now() + 7 * 86400000),
      status: 'OPEN'
    });
    createdOpportunityId = testOpp._id.toString();

    console.log('[Setup] Test data initialized successfully.\n');

    // =========================================================================
    // TEST 1: Search Old-Age Homes (Public & Filtering)
    // =========================================================================
    console.log('TEST 1: Search Old-Age Homes by Name, City, and Status');
    try {
      const res = await fetch(`${BASE_URL}/search/homes?search=Silver+Haven&city=Pune&verificationStatus=VERIFIED`);
      const body = await res.json();
      if (res.status === 200 && body.success && body.data.homes.length >= 1) {
        const found = body.data.homes.find((h) => h._id.toString() === createdOrgId);
        if (found && found.name === 'Silver Haven Senior Living') {
          console.log('  ✔ PASS: Successfully searched and filtered old-age homes');
          passed++;
        } else {
          throw new Error('Created home was not in returned search results');
        }
      } else {
        throw new Error(body.message || `Status: ${res.status}`);
      }
    } catch (e) {
      console.log(`  ✖ FAIL: ${e.message}`);
      failed++;
    }

    // =========================================================================
    // TEST 2: Search Public Home Details & Projection Security
    // =========================================================================
    console.log('TEST 2: Public Home Details Prohibits Leaking Private Documents/Admin Notes');
    try {
      const res = await fetch(`${BASE_URL}/search/homes/${createdOrgId}`);
      const body = await res.json();
      if (res.status === 200 && body.success && body.data.home) {
        const h = body.data.home;
        if (h.documents === undefined && h.duplicateFlags === undefined) {
          console.log('  ✔ PASS: Public projection strictly protects confidential documents and duplicate flags');
          passed++;
        } else {
          throw new Error('Confidential fields were exposed in public projection');
        }
      } else {
        throw new Error(body.message || `Status: ${res.status}`);
      }
    } catch (e) {
      console.log(`  ✖ FAIL: ${e.message}`);
      failed++;
    }

    // =========================================================================
    // TEST 3: Search Donation Opportunities / Needs
    // =========================================================================
    console.log('TEST 3: Search Donation Needs with Category and Urgency Filters');
    try {
      const res = await fetch(`${BASE_URL}/search/donations?category=Groceries&urgency=High`);
      const body = await res.json();
      if (res.status === 200 && body.success && body.data.needs.length >= 1) {
        const found = body.data.needs.find((n) => n._id.toString() === createdRequirementId);
        if (found && found.title === 'Monthly Rice & Wheat Grains') {
          console.log('  ✔ PASS: Real database donation requirements retrieved with filters');
          passed++;
        } else {
          throw new Error('Created donation need not found in filtered results');
        }
      } else {
        throw new Error(body.message || `Status: ${res.status}`);
      }
    } catch (e) {
      console.log(`  ✖ FAIL: ${e.message}`);
      failed++;
    }

    // =========================================================================
    // TEST 4: Search Volunteer Opportunities
    // =========================================================================
    console.log('TEST 4: Search Open Volunteer Opportunities');
    try {
      const res = await fetch(`${BASE_URL}/search/volunteer-opportunities?category=recreational&location=Pune`);
      const body = await res.json();
      if (res.status === 200 && body.success && body.data.opportunities.length >= 1) {
        const found = body.data.opportunities.find((o) => o._id.toString() === createdOpportunityId);
        if (found && found.title.includes('Recreational')) {
          console.log('  ✔ PASS: Volunteer opportunities searchable with location & category filters');
          passed++;
        } else {
          throw new Error('Created opportunity not found in search results');
        }
      } else {
        throw new Error(body.message || `Status: ${res.status}`);
      }
    } catch (e) {
      console.log(`  ✖ FAIL: ${e.message}`);
      failed++;
    }

    // =========================================================================
    // TEST 5: Create Donation & Verify Automatic Donor In-App Notification
    // =========================================================================
    console.log('TEST 5: Create Donation and Auto-Generate Submission Notification');
    try {
      const donRes = await fetch(`${BASE_URL}/donations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${donorToken}`
        },
        body: JSON.stringify({
          homeId: createdOrgId,
          category: 'Food and groceries',
          itemName: '50kg Wheat Flour',
          quantity: 50,
          unit: 'kg',
          deliveryMode: 'SELF_DELIVERY',
          preferredDeliveryDate: new Date(Date.now() + 3 * 86400000).toISOString()
        })
      });
      const donBody = await donRes.json();
      if (donRes.status === 201 && donBody.success) {
        createdDonationId = donBody.data.donation._id;
        
        // Check if notification exists for donor
        const notif = await Notification.findOne({
          recipientId: donorUser._id,
          relatedEntityId: createdDonationId,
          type: 'DONATION'
        });

        if (notif && notif.title.includes('Pledge')) {
          testNotificationId = notif._id.toString();
          console.log('  ✔ PASS: Donation created and submission notification dispatched to donor');
          passed++;
        } else {
          throw new Error('Notification not found in database for donor');
        }
      } else {
        throw new Error(donBody.message || `Status: ${donRes.status}`);
      }
    } catch (e) {
      console.log(`  ✖ FAIL: ${e.message}`);
      failed++;
    }

    // =========================================================================
    // TEST 6: Accept Donation & Verify Lifecycle Notification
    // =========================================================================
    console.log('TEST 6: Accept Donation and Auto-Generate Acceptance Notification');
    try {
      const accRes = await fetch(`${BASE_URL}/donations/${createdDonationId}/accept`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${homeToken}`
        },
        body: JSON.stringify({ notes: 'Accepted with gratitude by Silver Haven!' })
      });
      const accBody = await accRes.json();
      if (accRes.status === 200 && accBody.success) {
        // Verify notification for donor
        const notif = await Notification.findOne({
          recipientId: donorUser._id,
          relatedEntityId: createdDonationId,
          title: 'Donation Accepted'
        });
        if (notif) {
          console.log('  ✔ PASS: Donation accepted and acceptance notification dispatched');
          passed++;
        } else {
          throw new Error('Acceptance notification was not delivered to donor');
        }
      } else {
        throw new Error(accBody.message || `Status: ${accRes.status}`);
      }
    } catch (e) {
      console.log(`  ✖ FAIL: ${e.message}`);
      failed++;
    }

    // =========================================================================
    // TEST 7: Donation Tracking Details & Progression Timeline
    // =========================================================================
    console.log('TEST 7: Donation Tracking Details with Visual Flow Stages');
    try {
      const res = await fetch(`${BASE_URL}/tracking/donations/${createdDonationId}`, {
        headers: { Authorization: `Bearer ${donorToken}` }
      });
      const body = await res.json();
      if (res.status === 200 && body.success && body.data.donation) {
        const d = body.data.donation;
        if (d.status === 'ACCEPTED' && d.timeline && d.timeline.length === 5) {
          const acceptedStage = d.timeline.find((t) => t.status === 'ACCEPTED');
          if (acceptedStage && acceptedStage.state === 'current') {
            console.log('  ✔ PASS: Donation tracking returns visual timeline with active ACCEPTED stage');
            passed++;
          } else {
            throw new Error('Timeline state did not reflect ACCEPTED stage');
          }
        } else {
          throw new Error('Timeline stages not properly constructed');
        }
      } else {
        throw new Error(body.message || `Status: ${res.status}`);
      }
    } catch (e) {
      console.log(`  ✖ FAIL: ${e.message}`);
      failed++;
    }

    // =========================================================================
    // TEST 8: Strict Donation Tracking Ownership Authorization
    // =========================================================================
    console.log('TEST 8: Security - Unauthorized Donor Cannot Access Other User\'s Donation Tracking');
    try {
      const res = await fetch(`${BASE_URL}/tracking/donations/${createdDonationId}`, {
        headers: { Authorization: `Bearer ${donor2Token}` } // Donor 2 should be denied
      });
      if (res.status === 403) {
        console.log('  ✔ PASS: Unauthorized user access safely blocked with 403 Forbidden');
        passed++;
      } else {
        throw new Error(`Expected 403 Forbidden, but received status ${res.status}`);
      }
    } catch (e) {
      console.log(`  ✖ FAIL: ${e.message}`);
      failed++;
    }

    // =========================================================================
    // TEST 9: Apply for Volunteer Opportunity & Verify Application Notification
    // =========================================================================
    console.log('TEST 9: Volunteer Application and Auto-Generated In-App Notifications');
    try {
      const appRes = await fetch(`${BASE_URL}/volunteer-opportunities/${createdOpportunityId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${volunteerToken}`
        },
        body: JSON.stringify({
          motivation: 'I love interacting with senior citizens and playing classical music.',
          relevantSkills: ['Music', 'First Aid', 'Empathy']
        })
      });
      const appBody = await appRes.json();
      if (appRes.status === 201 && appBody.success) {
        createdApplicationId = appBody.data.application._id;

        // Verify volunteer received submission confirmation notification
        const notif = await Notification.findOne({
          recipientId: volUser._id,
          relatedEntityId: createdApplicationId,
          type: 'VOLUNTEER_APPLICATION'
        });

        if (notif) {
          console.log('  ✔ PASS: Volunteer application created and confirmation notification sent');
          passed++;
        } else {
          throw new Error('Notification not found for volunteer');
        }
      } else {
        throw new Error(appBody.message || `Status: ${appRes.status}`);
      }
    } catch (e) {
      console.log(`  ✖ FAIL: ${e.message}`);
      failed++;
    }

    // =========================================================================
    // TEST 10: Accept Volunteer Application & Verify Acceptance Notification
    // =========================================================================
    console.log('TEST 10: Accept Volunteer Application and Send Status Notification');
    try {
      const accRes = await fetch(`${BASE_URL}/volunteer-applications/${createdApplicationId}/accept`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${homeToken}`
        },
        body: JSON.stringify({ notes: 'We would love to have you this Sunday!' })
      });
      const accBody = await accRes.json();
      if (accRes.status === 200 && accBody.success) {
        const notif = await Notification.findOne({
          recipientId: volUser._id,
          relatedEntityId: createdApplicationId,
          title: 'Volunteer Application Accepted'
        });
        if (notif) {
          console.log('  ✔ PASS: Volunteer application accepted and acceptance notification dispatched');
          passed++;
        } else {
          throw new Error('Acceptance notification not delivered to volunteer');
        }
      } else {
        throw new Error(accBody.message || `Status: ${accRes.status}`);
      }
    } catch (e) {
      console.log(`  ✖ FAIL: ${e.message}`);
      failed++;
    }

    // =========================================================================
    // TEST 11: Volunteer Application Tracking API
    // =========================================================================
    console.log('TEST 11: Volunteer Application Tracking with Visual Flow Status');
    try {
      const res = await fetch(`${BASE_URL}/tracking/volunteer-applications/${createdApplicationId}`, {
        headers: { Authorization: `Bearer ${volunteerToken}` }
      });
      const body = await res.json();
      if (res.status === 200 && body.success && body.data.application) {
        const app = body.data.application;
        if (app.status === 'ACCEPTED' && app.timeline && app.timeline.length === 3) {
          console.log('  ✔ PASS: Volunteer application tracking details returned with 3-stage timeline');
          passed++;
        } else {
          throw new Error('Tracking timeline structure invalid');
        }
      } else {
        throw new Error(body.message || `Status: ${res.status}`);
      }
    } catch (e) {
      console.log(`  ✖ FAIL: ${e.message}`);
      failed++;
    }

    // =========================================================================
    // TEST 12: Strict Volunteer Tracking Ownership Authorization
    // =========================================================================
    console.log('TEST 12: Security - Other Volunteers Cannot Access Private Application Tracking');
    try {
      const res = await fetch(`${BASE_URL}/tracking/volunteer-applications/${createdApplicationId}`, {
        headers: { Authorization: `Bearer ${volunteer2Token}` }
      });
      if (res.status === 403) {
        console.log('  ✔ PASS: Unauthorized volunteer tracking access blocked with 403');
        passed++;
      } else {
        throw new Error(`Expected 403 Forbidden, but received status ${res.status}`);
      }
    } catch (e) {
      console.log(`  ✖ FAIL: ${e.message}`);
      failed++;
    }

    // =========================================================================
    // TEST 13: Notification Center - List Notifications & Unread Count
    // =========================================================================
    console.log('TEST 13: Notification Center - List Notifications and Unread Count Endpoint');
    try {
      const resCount = await fetch(`${BASE_URL}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${donorToken}` }
      });
      const countBody = await resCount.json();

      const resList = await fetch(`${BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${donorToken}` }
      });
      const listBody = await resList.json();

      if (
        resCount.status === 200 &&
        resList.status === 200 &&
        countBody.success &&
        listBody.success &&
        listBody.data.notifications.length > 0
      ) {
        console.log(`  ✔ PASS: Notification list (${listBody.data.notifications.length} items) and unread count (${countBody.data.unreadCount}) retrieved`);
        passed++;
      } else {
        throw new Error('Failed to fetch notification list or count');
      }
    } catch (e) {
      console.log(`  ✖ FAIL: ${e.message}`);
      failed++;
    }

    // =========================================================================
    // TEST 14: Notification Center - Mark Single Notification As Read
    // =========================================================================
    console.log('TEST 14: Mark Single Notification As Read');
    try {
      if (!testNotificationId) {
        const notif = await Notification.findOne({ recipientId: donorUser._id });
        testNotificationId = notif?._id.toString();
      }

      const res = await fetch(`${BASE_URL}/notifications/${testNotificationId}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${donorToken}` }
      });
      const body = await res.json();
      if (res.status === 200 && body.success && body.data.notification.isRead === true) {
        console.log('  ✔ PASS: Notification successfully marked as read');
        passed++;
      } else {
        throw new Error(body.message || `Status: ${res.status}`);
      }
    } catch (e) {
      console.log(`  ✖ FAIL: ${e.message}`);
      failed++;
    }

    // =========================================================================
    // TEST 15: Notification Center - Mark All Notifications As Read
    // =========================================================================
    console.log('TEST 15: Mark All Notifications As Read');
    try {
      const res = await fetch(`${BASE_URL}/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${donorToken}` }
      });
      const body = await res.json();
      if (res.status === 200 && body.success) {
        const unreadRem = await Notification.countDocuments({ recipientId: donorUser._id, isRead: false });
        if (unreadRem === 0) {
          console.log('  ✔ PASS: All user notifications marked as read');
          passed++;
        } else {
          throw new Error(`${unreadRem} unread notifications still exist`);
        }
      } else {
        throw new Error(body.message || `Status: ${res.status}`);
      }
    } catch (e) {
      console.log(`  ✖ FAIL: ${e.message}`);
      failed++;
    }

    // =========================================================================
    // TEST 16: Notification Center - Delete Notification
    // =========================================================================
    console.log('TEST 16: Delete Notification');
    try {
      const res = await fetch(`${BASE_URL}/notifications/${testNotificationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${donorToken}` }
      });
      const body = await res.json();
      if (res.status === 200 && body.success) {
        const deletedCheck = await Notification.findById(testNotificationId);
        if (!deletedCheck) {
          console.log('  ✔ PASS: Notification successfully removed');
          passed++;
        } else {
          throw new Error('Notification still present in database after delete');
        }
      } else {
        throw new Error(body.message || `Status: ${res.status}`);
      }
    } catch (e) {
      console.log(`  ✖ FAIL: ${e.message}`);
      failed++;
    }

    // =========================================================================
    // TEST 17: Activity History API
    // =========================================================================
    console.log('TEST 17: Activity History API - Aggregates Historical Actions');
    try {
      const res = await fetch(`${BASE_URL}/activity/history`, {
        headers: { Authorization: `Bearer ${donorToken}` }
      });
      const body = await res.json();
      if (res.status === 200 && body.success && Array.isArray(body.data.activities)) {
        if (body.data.activities.length > 0) {
          const act = body.data.activities[0];
          if (act.title && act.date && act.type) {
            console.log(`  ✔ PASS: Activity history successfully aggregated (${body.data.activities.length} entries)`);
            passed++;
          } else {
            throw new Error('Activity entry missing expected fields');
          }
        } else {
          throw new Error('No activities returned for active donor');
        }
      } else {
        throw new Error(body.message || `Status: ${res.status}`);
      }
    } catch (e) {
      console.log(`  ✖ FAIL: ${e.message}`);
      failed++;
    }

    // =========================================================================
    // TEST 18: Activity History Filtering by Type
    // =========================================================================
    console.log('TEST 18: Activity History Filtering by Category');
    try {
      const res = await fetch(`${BASE_URL}/activity/history?type=DONATION`, {
        headers: { Authorization: `Bearer ${donorToken}` }
      });
      const body = await res.json();
      if (res.status === 200 && body.success && Array.isArray(body.data.activities)) {
        const allDonationType = body.data.activities.every((a) => a.type === 'DONATION');
        if (allDonationType) {
          console.log('  ✔ PASS: Filtered activity history accurately isolates requested category');
          passed++;
        } else {
          throw new Error('Activity history contained non-DONATION items');
        }
      } else {
        throw new Error(body.message || `Status: ${res.status}`);
      }
    } catch (e) {
      console.log(`  ✖ FAIL: ${e.message}`);
      failed++;
    }

  } finally {
    // -------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------
    console.log('\n[Cleanup] Cleaning up test records...');
    try {
      if (createdDonationId) await Donation.deleteOne({ _id: createdDonationId });
      if (createdApplicationId) await VolunteerApplication.deleteOne({ _id: createdApplicationId });
      if (createdOpportunityId) await VolunteerOpportunity.deleteOne({ _id: createdOpportunityId });
      if (createdRequirementId) await Requirement.deleteOne({ _id: createdRequirementId });
      if (createdOrgId) await Organization.deleteOne({ _id: createdOrgId });
      if (donorUser) await Notification.deleteMany({ recipientId: donorUser._id });
      if (homeUser) await Notification.deleteMany({ recipientId: homeUser._id });
      if (volUser) await Notification.deleteMany({ recipientId: volUser._id });
      await User.deleteMany({
        email: { $in: [donorEmail, donor2Email, homeEmail, volunteerEmail, volunteer2Email] }
      });
      console.log('[Cleanup] Completed.\n');
    } catch (cleanErr) {
      console.error('[Cleanup Error]:', cleanErr.message);
    }
  }

  console.log('====================================================');
  console.log(`MODULE 6 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runModule6Tests().catch((err) => {
  console.error('Fatal Module 6 test runner error:', err);
  process.exit(1);
});
