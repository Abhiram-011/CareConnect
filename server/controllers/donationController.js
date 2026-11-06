import mongoose from 'mongoose';
import Donation from '../models/Donation.js';
import Organization from '../models/Organization.js';
import { createNotification } from '../utils/notificationService.js';

// Supported donation categories
export const DONATION_CATEGORIES = [
  'Food and groceries',
  'Clothes',
  'Medicines and medical supplies',
  'Furniture',
  'Books and educational materials',
  'Personal-care products',
  'Financial support',
  'Other'
];

/**
 * @desc    Create a new donation request
 * @route   POST /api/donations
 * @access  Private (Donor)
 */
export const createDonation = async (req, res, next) => {
  try {
    const {
      homeId,
      category,
      itemName,
      description,
      quantity,
      unit,
      message,
      preferredDeliveryDate,
      notes
    } = req.body;

    // 1. Validate Old-Age Home selection
    if (!homeId || !mongoose.Types.ObjectId.isValid(homeId)) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid old-age home from the list.'
      });
    }

    const home = await Organization.findById(homeId);
    if (!home) {
      return res.status(404).json({
        success: false,
        message: 'The selected old-age home could not be found.'
      });
    }

    // 2. Validate Category
    if (!category || !DONATION_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Please select a valid category: ${DONATION_CATEGORIES.join(', ')}.`
      });
    }

    // Special handling for Financial support per specification:
    // If online payment gateway is not integrated, inform the user clearly
    if (category === 'Financial support') {
      return res.status(400).json({
        success: false,
        message:
          'Online financial support gateway is currently coming soon. To donate funds safely, please contact the old-age home administration directly or choose a physical supply category.'
      });
    }

    // 3. Validate Item Name
    if (!itemName || !itemName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an item or donation title.'
      });
    }

    if (itemName.trim().length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Item title cannot exceed 200 characters.'
      });
    }

    // 4. Validate Quantity and Unit
    const numericQuantity = Number(quantity);
    if (!quantity || isNaN(numericQuantity) || numericQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a valid positive number greater than 0.'
      });
    }

    if (!unit || !unit.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please specify the unit (e.g. units, kg, boxes, packets).'
      });
    }

    // 5. Validate Preferred Delivery Date
    if (!preferredDeliveryDate) {
      return res.status(400).json({
        success: false,
        message: 'Please select a preferred delivery date.'
      });
    }

    const deliveryDateObj = new Date(preferredDeliveryDate);
    if (isNaN(deliveryDateObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Preferred delivery date is invalid.'
      });
    }

    // Ensure preferred delivery date is not in the past (allow today onwards)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (deliveryDateObj < today) {
      return res.status(400).json({
        success: false,
        message: 'Preferred delivery date cannot be in the past. Please select today or a future date.'
      });
    }

    // 6. Assemble new donation record
    // CRITICAL: Always use req.user._id as the donor ID; never trust frontend
    const newDonation = new Donation({
      donorId: req.user._id,
      homeId: home._id,
      homeUser: home.user || null,
      category,
      itemName: itemName.trim(),
      description: description ? description.trim() : '',
      quantity: numericQuantity,
      unit: unit.trim(),
      message: message ? message.trim() : '',
      notes: notes ? notes.trim() : '',
      preferredDeliveryDate: deliveryDateObj,
      status: 'PENDING',
      statusHistory: [
        {
          previousStatus: null,
          newStatus: 'PENDING',
          changedBy: req.user._id,
          actorRole: req.user.role || 'donor',
          reason: 'Donation request submitted by donor',
          timestamp: new Date()
        }
      ]
    });

    await newDonation.save();

    // Populate home details for clean response
    await newDonation.populate([
      {
        path: 'homeId',
        select: 'name city address phone email verificationStatus profileImage'
      },
      {
        path: 'donorId',
        select: 'name email phone location profileImage'
      }
    ]);

    // Notify Donor and Home Owner
    await createNotification({
      recipientId: req.user._id,
      type: 'DONATION',
      title: 'Donation Pledge Submitted',
      message: `Your donation request for ${newDonation.quantity} ${newDonation.unit} (${newDonation.itemName}) was successfully submitted to ${home.name}.`,
      relatedEntityType: 'donation',
      relatedEntityId: newDonation._id,
      link: `/tracking/donations/${newDonation._id}`
    });

    if (home.user) {
      await createNotification({
        recipientId: home.user,
        type: 'DONATION',
        title: 'New Donation Request Received',
        message: `${req.user.name} offered a donation of ${newDonation.quantity} ${newDonation.unit} of ${newDonation.itemName}.`,
        relatedEntityType: 'donation',
        relatedEntityId: newDonation._id,
        link: `/donations/${newDonation._id}`
      });
    }

    return res.status(201).json({
      success: true,
      message: `Donation request created successfully! Donation ID: #${newDonation._id
        .toString()
        .slice(-6)
        .toUpperCase()}`,
      data: {
        donation: newDonation
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get logged-in donor's donations with search, filters, and real-time stats
 * @route   GET /api/donations/my
 * @access  Private (Donor)
 */
export const getMyDonations = async (req, res, next) => {
  try {
    const { status, category, search, page = 1, limit = 10 } = req.query;

    const query = { donorId: req.user._id };

    // Status filter
    if (status && status !== 'ALL') {
      if (status === 'ACCEPTED_OR_SCHEDULED') {
        query.status = { $in: ['ACCEPTED', 'SCHEDULED'] };
      } else {
        query.status = status.toUpperCase();
      }
    }

    // Category filter
    if (category && category !== 'ALL') {
      query.category = category;
    }

    // Search filter (by item name)
    if (search && search.trim()) {
      query.itemName = { $regex: search.trim(), $options: 'i' };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Run query and count
    const [donations, totalRecords] = await Promise.all([
      Donation.find(query)
        .populate({
          path: 'homeId',
          select: 'name city address phone email verificationStatus profileImage'
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Donation.countDocuments(query)
    ]);

    // Calculate donor-wide metrics directly from database
    const allDonorDonations = await Donation.find({ donorId: req.user._id }).select('status');
    const stats = {
      total: allDonorDonations.length,
      pending: allDonorDonations.filter((d) => d.status === 'PENDING').length,
      acceptedOrScheduled: allDonorDonations.filter((d) => ['ACCEPTED', 'SCHEDULED'].includes(d.status)).length,
      delivered: allDonorDonations.filter((d) => d.status === 'DELIVERED').length,
      completed: allDonorDonations.filter((d) => d.status === 'COMPLETED').length,
      rejected: allDonorDonations.filter((d) => d.status === 'REJECTED').length,
      cancelled: allDonorDonations.filter((d) => d.status === 'CANCELLED').length
    };

    return res.status(200).json({
      success: true,
      data: {
        donations,
        stats,
        pagination: {
          totalRecords,
          totalPages: Math.ceil(totalRecords / limitNum) || 1,
          currentPage: pageNum,
          limit: limitNum
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get donation requests addressed to the logged-in old-age home
 * @route   GET /api/donations/home/requests
 * @access  Private (Home role)
 */
export const getHomeDonations = async (req, res, next) => {
  try {
    // 1. Locate organization belonging to this home user
    const organization = await Organization.findOne({ user: req.user._id });

    if (!organization) {
      return res.status(200).json({
        success: true,
        message: 'No organization profile registered yet.',
        data: {
          donations: [],
          stats: {
            total: 0,
            pending: 0,
            accepted: 0,
            scheduled: 0,
            delivered: 0,
            completed: 0,
            rejected: 0,
            cancelled: 0
          },
          pagination: {
            totalRecords: 0,
            totalPages: 1,
            currentPage: 1,
            limit: 10
          }
        }
      });
    }

    const { status, category, search, page = 1, limit = 10 } = req.query;

    const query = {
      $or: [{ homeId: organization._id }, { homeUser: req.user._id }]
    };

    if (status && status !== 'ALL') {
      query.status = status.toUpperCase();
    }

    if (category && category !== 'ALL') {
      query.category = category;
    }

    if (search && search.trim()) {
      query.itemName = { $regex: search.trim(), $options: 'i' };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [donations, totalRecords] = await Promise.all([
      Donation.find(query)
        .populate({
          path: 'donorId',
          select: 'name email phone location profileImage'
        })
        .populate({
          path: 'homeId',
          select: 'name city address phone verificationStatus'
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Donation.countDocuments(query)
    ]);

    // Calculate real stats for this home
    const allHomeDonations = await Donation.find({
      $or: [{ homeId: organization._id }, { homeUser: req.user._id }]
    }).select('status');

    const stats = {
      total: allHomeDonations.length,
      pending: allHomeDonations.filter((d) => d.status === 'PENDING').length,
      accepted: allHomeDonations.filter((d) => d.status === 'ACCEPTED').length,
      scheduled: allHomeDonations.filter((d) => d.status === 'SCHEDULED').length,
      delivered: allHomeDonations.filter((d) => d.status === 'DELIVERED').length,
      completed: allHomeDonations.filter((d) => d.status === 'COMPLETED').length,
      rejected: allHomeDonations.filter((d) => d.status === 'REJECTED').length,
      cancelled: allHomeDonations.filter((d) => d.status === 'CANCELLED').length
    };

    return res.status(200).json({
      success: true,
      data: {
        donations,
        stats,
        organization: {
          _id: organization._id,
          name: organization.name,
          verificationStatus: organization.verificationStatus
        },
        pagination: {
          totalRecords,
          totalPages: Math.ceil(totalRecords / limitNum) || 1,
          currentPage: pageNum,
          limit: limitNum
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single donation by ID with role-based access control
 * @route   GET /api/donations/:id
 * @access  Private (Owner Donor, Destination Home, or Admin)
 */
export const getDonationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid donation ID format.'
      });
    }

    const donation = await Donation.findById(id)
      .populate({
        path: 'donorId',
        select: 'name email phone location profileImage'
      })
      .populate({
        path: 'homeId',
        select: 'name address city district state pincode phone email website responsiblePerson verificationStatus profileImage user'
      })
      .populate({
        path: 'statusHistory.changedBy',
        select: 'name role email'
      });

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation record not found.'
      });
    }

    // Role-based Access Control Check
    const userId = req.user._id.toString();
    const isDonorOwner = donation.donorId && donation.donorId._id.toString() === userId;
    const isHomeOwner =
      (donation.homeUser && donation.homeUser.toString() === userId) ||
      (donation.homeId && donation.homeId.user && donation.homeId.user.toString() === userId);
    const isAdmin = req.user.role === 'admin';

    if (!isDonorOwner && !isHomeOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not authorized to view this donation.'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        donation,
        permissions: {
          canCancel: isDonorOwner && ['PENDING', 'ACCEPTED', 'SCHEDULED'].includes(donation.status),
          canAccept: isHomeOwner && donation.status === 'PENDING',
          canReject: isHomeOwner && donation.status === 'PENDING',
          canSchedule: (isHomeOwner || isDonorOwner) && ['ACCEPTED', 'SCHEDULED'].includes(donation.status),
          canMarkDelivered: isDonorOwner && donation.status === 'SCHEDULED',
          canComplete: isHomeOwner && donation.status === 'DELIVERED',
          canEdit: isDonorOwner && donation.status === 'PENDING'
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Accept a pending donation request
 * @route   PATCH /api/donations/:id/accept
 * @access  Private (Assigned Home only)
 */
export const acceptDonation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid donation ID.' });
    }

    const donation = await Donation.findById(id).populate('homeId');
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation request not found.' });
    }

    // Check Home Ownership
    const userId = req.user._id.toString();
    const isHomeOwner =
      (donation.homeUser && donation.homeUser.toString() === userId) ||
      (donation.homeId && donation.homeId.user && donation.homeId.user.toString() === userId);

    if (!isHomeOwner && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the designated old-age home can accept this request.'
      });
    }

    // Workflow validation: PENDING -> ACCEPTED
    if (donation.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Cannot accept donation. Current status is '${donation.status}'. Only PENDING donations can be accepted.`
      });
    }

    const previousStatus = donation.status;
    donation.status = 'ACCEPTED';
    if (notes) {
      donation.notes = notes.trim();
    }

    donation.statusHistory.push({
      previousStatus,
      newStatus: 'ACCEPTED',
      changedBy: req.user._id,
      actorRole: 'home',
      reason: notes?.trim() || 'Donation request accepted by old-age home.',
      timestamp: new Date()
    });

    await donation.save();

    await donation.populate([
      { path: 'donorId', select: 'name email phone' },
      { path: 'homeId', select: 'name city verificationStatus' }
    ]);

    // Notify Donor
    await createNotification({
      recipientId: donation.donorId?._id || donation.donorId,
      type: 'DONATION',
      title: 'Donation Accepted',
      message: `Great news! ${donation.homeId?.name || 'The old-age home'} has accepted your donation of ${donation.itemName}.`,
      relatedEntityType: 'donation',
      relatedEntityId: donation._id,
      link: `/tracking/donations/${donation._id}`
    });

    return res.status(200).json({
      success: true,
      message: 'Donation request has been accepted successfully.',
      data: { donation }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reject a pending donation request
 * @route   PATCH /api/donations/:id/reject
 * @access  Private (Assigned Home only)
 */
export const rejectDonation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid donation ID.' });
    }

    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a reason for rejecting this donation request.'
      });
    }

    const donation = await Donation.findById(id).populate('homeId');
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation request not found.' });
    }

    // Check Home Ownership
    const userId = req.user._id.toString();
    const isHomeOwner =
      (donation.homeUser && donation.homeUser.toString() === userId) ||
      (donation.homeId && donation.homeId.user && donation.homeId.user.toString() === userId);

    if (!isHomeOwner && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the designated old-age home can reject this request.'
      });
    }

    // Workflow validation: PENDING -> REJECTED
    if (donation.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Cannot decline donation. Current status is '${donation.status}'. Only PENDING donations can be declined.`
      });
    }

    const previousStatus = donation.status;
    donation.status = 'REJECTED';
    donation.rejectionReason = rejectionReason.trim();

    donation.statusHistory.push({
      previousStatus,
      newStatus: 'REJECTED',
      changedBy: req.user._id,
      actorRole: 'home',
      reason: rejectionReason.trim(),
      timestamp: new Date()
    });

    await donation.save();

    await donation.populate([
      { path: 'donorId', select: 'name email phone' },
      { path: 'homeId', select: 'name city verificationStatus' }
    ]);

    // Notify Donor
    await createNotification({
      recipientId: donation.donorId?._id || donation.donorId,
      type: 'DONATION',
      title: 'Donation Request Declined',
      message: `${donation.homeId?.name || 'The home'} was unable to accept your donation of ${donation.itemName}. Reason: ${rejectionReason.trim()}`,
      relatedEntityType: 'donation',
      relatedEntityId: donation._id,
      link: `/tracking/donations/${donation._id}`
    });

    return res.status(200).json({
      success: true,
      message: 'Donation request has been declined.',
      data: { donation }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Confirm / Update delivery schedule
 * @route   PATCH /api/donations/:id/schedule
 * @access  Private (Assigned Home or Donor)
 */
export const scheduleDonation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { scheduledDate, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid donation ID.' });
    }

    if (!scheduledDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid scheduled delivery date.'
      });
    }

    const scheduledDateObj = new Date(scheduledDate);
    if (isNaN(scheduledDateObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid scheduled date format.'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (scheduledDateObj < today) {
      return res.status(400).json({
        success: false,
        message: 'Scheduled date cannot be in the past. Please select today or a future date.'
      });
    }

    const donation = await Donation.findById(id).populate('homeId');
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation request not found.' });
    }

    // Check ownership: Donor or Home
    const userId = req.user._id.toString();
    const isDonorOwner = donation.donorId.toString() === userId;
    const isHomeOwner =
      (donation.homeUser && donation.homeUser.toString() === userId) ||
      (donation.homeId && donation.homeId.user && donation.homeId.user.toString() === userId);

    if (!isDonorOwner && !isHomeOwner && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not authorized to schedule delivery for this donation.'
      });
    }

    // Workflow validation: ACCEPTED -> SCHEDULED (or rescheduling if already SCHEDULED)
    if (!['ACCEPTED', 'SCHEDULED'].includes(donation.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot schedule delivery. Current status is '${donation.status}'. The donation must be ACCEPTED first.`
      });
    }

    const previousStatus = donation.status;
    donation.status = 'SCHEDULED';
    donation.scheduledDate = scheduledDateObj;
    if (notes) {
      donation.notes = notes.trim();
    }

    const actor = isHomeOwner ? 'home' : isDonorOwner ? 'donor' : 'admin';
    donation.statusHistory.push({
      previousStatus,
      newStatus: 'SCHEDULED',
      changedBy: req.user._id,
      actorRole: actor,
      reason: notes?.trim() || `Delivery scheduled for ${scheduledDateObj.toLocaleDateString()}`,
      timestamp: new Date()
    });

    await donation.save();

    await donation.populate([
      { path: 'donorId', select: 'name email phone' },
      { path: 'homeId', select: 'name city verificationStatus' }
    ]);

    // Notify counterpart
    const schedRecipient = actor === 'home' ? (donation.donorId?._id || donation.donorId) : donation.homeUser;
    if (schedRecipient) {
      createNotification({
        recipientId: schedRecipient,
        type: 'DONATION',
        title: 'Delivery Schedule Updated',
        message: `Delivery for ${donation.itemName} has been scheduled for ${scheduledDateObj.toLocaleDateString()}.`,
        relatedEntityType: 'donation',
        relatedEntityId: donation._id,
        link: `/tracking/donations/${donation._id}`
      });
    }

    return res.status(200).json({
      success: true,
      message: `Delivery has been scheduled for ${scheduledDateObj.toLocaleDateString()}.`,
      data: { donation }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Donor marks items as delivered
 * @route   PATCH /api/donations/:id/mark-delivered
 * @access  Private (Donor only)
 */
export const markDelivered = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid donation ID.' });
    }

    const donation = await Donation.findById(id);
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation request not found.' });
    }

    // Check Donor ownership
    if (donation.donorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the donating donor can mark items as delivered.'
      });
    }

    // Workflow validation: SCHEDULED -> DELIVERED
    if (donation.status !== 'SCHEDULED') {
      return res.status(400).json({
        success: false,
        message: `Cannot mark as delivered. Current status is '${donation.status}'. Delivery must be SCHEDULED before marking as delivered.`
      });
    }

    const previousStatus = donation.status;
    donation.status = 'DELIVERED';
    donation.deliveredAt = new Date();
    if (notes) {
      donation.notes = notes.trim();
    }

    donation.statusHistory.push({
      previousStatus,
      newStatus: 'DELIVERED',
      changedBy: req.user._id,
      actorRole: 'donor',
      reason: notes?.trim() || 'Items marked as delivered by donor.',
      timestamp: new Date()
    });

    await donation.save();

    await donation.populate([
      { path: 'donorId', select: 'name email phone' },
      { path: 'homeId', select: 'name city verificationStatus' }
    ]);

    // Notify Home User
    if (donation.homeUser) {
      createNotification({
        recipientId: donation.homeUser,
        type: 'DONATION',
        title: 'Donation Marked as Delivered',
        message: `${req.user.name} has marked ${donation.itemName} as delivered. Please confirm receipt!`,
        relatedEntityType: 'donation',
        relatedEntityId: donation._id,
        link: `/donations/${donation._id}`
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Items marked as delivered! The old-age home has been notified to confirm receipt.',
      data: { donation }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Old-age home confirms receipt of items (COMPLETED)
 * @route   PATCH /api/donations/:id/complete
 * @access  Private (Assigned Home only)
 */
export const completeDonation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid donation ID.' });
    }

    const donation = await Donation.findById(id).populate('homeId');
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation record not found.' });
    }

    // Check Home Ownership
    const userId = req.user._id.toString();
    const isHomeOwner =
      (donation.homeUser && donation.homeUser.toString() === userId) ||
      (donation.homeId && donation.homeId.user && donation.homeId.user.toString() === userId);

    if (!isHomeOwner && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the recipient old-age home can confirm receipt of this donation.'
      });
    }

    // Workflow validation: DELIVERED -> COMPLETED
    if (donation.status !== 'DELIVERED') {
      return res.status(400).json({
        success: false,
        message: `Cannot complete donation. Current status is '${donation.status}'. Items must be marked DELIVERED before receipt confirmation.`
      });
    }

    const previousStatus = donation.status;
    donation.status = 'COMPLETED';
    donation.completedAt = new Date();
    if (notes) {
      donation.notes = notes.trim();
    }

    donation.statusHistory.push({
      previousStatus,
      newStatus: 'COMPLETED',
      changedBy: req.user._id,
      actorRole: 'home',
      reason: notes?.trim() || 'Receipt of items confirmed by old-age home. Donation complete!',
      timestamp: new Date()
    });

    await donation.save();

    await donation.populate([
      { path: 'donorId', select: 'name email phone' },
      { path: 'homeId', select: 'name city verificationStatus' }
    ]);

    // Notify Donor
    createNotification({
      recipientId: donation.donorId?._id || donation.donorId,
      type: 'DONATION',
      title: 'Donation Completed! 🎉',
      message: `Your donation of ${donation.itemName} has been received and confirmed by ${donation.homeId?.name || 'the elderly home'}. Thank you for your generosity!`,
      relatedEntityType: 'donation',
      relatedEntityId: donation._id,
      link: `/tracking/donations/${donation._id}`
    });

    return res.status(200).json({
      success: true,
      message: 'Donation receipt confirmed! The donation is officially COMPLETED.',
      data: { donation }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Donor cancels an eligible donation request
 * @route   PATCH /api/donations/:id/cancel
 * @access  Private (Donor only)
 */
export const cancelDonation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid donation ID.' });
    }

    const donation = await Donation.findById(id);
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation request not found.' });
    }

    // Check Donor ownership
    if (donation.donorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only cancel your own donation requests.'
      });
    }

    // Workflow validation: Only PENDING, ACCEPTED, or SCHEDULED can be cancelled
    const eligibleStatuses = ['PENDING', 'ACCEPTED', 'SCHEDULED'];
    if (!eligibleStatuses.includes(donation.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel donation. Current status is '${donation.status}'. Only donations before physical delivery (Pending, Accepted, Scheduled) can be cancelled.`
      });
    }

    const previousStatus = donation.status;
    donation.status = 'CANCELLED';

    donation.statusHistory.push({
      previousStatus,
      newStatus: 'CANCELLED',
      changedBy: req.user._id,
      actorRole: 'donor',
      reason: reason?.trim() || 'Donation request cancelled by donor.',
      timestamp: new Date()
    });

    await donation.save();

    await donation.populate([
      { path: 'donorId', select: 'name email phone' },
      { path: 'homeId', select: 'name city verificationStatus' }
    ]);

    // Notify Home User
    if (donation.homeUser) {
      await createNotification({
        recipientId: donation.homeUser,
        type: 'DONATION',
        title: 'Donation Request Cancelled',
        message: `Donor ${req.user.name} cancelled their donation request for ${donation.itemName}.`,
        relatedEntityType: 'donation',
        relatedEntityId: donation._id,
        link: `/donations/${donation._id}`
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Your donation request has been cancelled.',
      data: { donation }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update eligible donation details (Donor only while PENDING)
 * @route   PUT /api/donations/:id
 * @access  Private (Donor only)
 */
export const updateDonationDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { itemName, description, quantity, unit, message, notes, preferredDeliveryDate } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid donation ID.' });
    }

    const donation = await Donation.findById(id);
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation request not found.' });
    }

    if (donation.donorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own donation requests.'
      });
    }

    // Only allow editing while status is PENDING
    if (donation.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Cannot edit donation details. Request has already been reviewed (Status: '${donation.status}').`
      });
    }

    if (itemName && itemName.trim()) {
      donation.itemName = itemName.trim();
    }

    if (description !== undefined) {
      donation.description = description.trim();
    }

    if (quantity !== undefined) {
      const num = Number(quantity);
      if (isNaN(num) || num <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be a positive number greater than 0.'
        });
      }
      donation.quantity = num;
    }

    if (unit && unit.trim()) {
      donation.unit = unit.trim();
    }

    if (message !== undefined) {
      donation.message = message.trim();
    }

    if (notes !== undefined) {
      donation.notes = notes.trim();
    }

    if (preferredDeliveryDate) {
      const dateObj = new Date(preferredDeliveryDate);
      if (isNaN(dateObj.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid preferred delivery date.'
        });
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dateObj < today) {
        return res.status(400).json({
          success: false,
          message: 'Preferred delivery date cannot be in the past.'
        });
      }
      donation.preferredDeliveryDate = dateObj;
    }

    donation.statusHistory.push({
      previousStatus: 'PENDING',
      newStatus: 'PENDING',
      changedBy: req.user._id,
      actorRole: 'donor',
      reason: 'Donation request details updated by donor.',
      timestamp: new Date()
    });

    await donation.save();

    await donation.populate([
      { path: 'donorId', select: 'name email phone' },
      { path: 'homeId', select: 'name city verificationStatus' }
    ]);

    return res.status(200).json({
      success: true,
      message: 'Donation details updated successfully.',
      data: { donation }
    });
  } catch (error) {
    next(error);
  }
};
