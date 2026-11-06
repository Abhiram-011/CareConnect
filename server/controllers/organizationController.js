import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Organization from '../models/Organization.js';
import User from '../models/User.js';
import { detectDuplicateFlags } from '../utils/duplicateDetector.js';
import { notifyAdmins } from '../utils/notificationService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', 'uploads', 'documents');

/**
 * @desc    Submit or update organization verification details with documents
 * @route   POST /api/organizations/verification
 * @access  Private (Old-Age Home role only)
 */
export const submitVerification = async (req, res, next) => {
  try {
    const {
      name,
      address,
      city,
      district,
      state,
      pincode,
      phone,
      email,
      website,
      responsiblePerson,
      organizationType,
      registrationNumber,
      registrationType,
      registrationAuthority,
      registrationDate,
      description,
      capacity,
      residentsCount,
      careTypes
    } = req.body;

    // 1. Validation for required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter organization name.' });
    }
    if (!address || !address.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter complete address.' });
    }
    if (!city || !city.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter city.' });
    }
    if (!state || !state.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter state.' });
    }
    if (!pincode || !pincode.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter PIN code.' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter contact number.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter organization email.' });
    }
    if (!responsiblePerson || !responsiblePerson.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter name of responsible person.' });
    }
    if (!registrationNumber || !registrationNumber.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter registration number.' });
    }

    // Find existing organization profile for this user or create new
    let org = await Organization.findOne({ user: req.user._id });

    // Handle parsed careTypes if string
    let parsedCareTypes = ['Medical Care', 'Assisted Living'];
    if (careTypes) {
      if (Array.isArray(careTypes)) {
        parsedCareTypes = careTypes;
      } else if (typeof careTypes === 'string') {
        try {
          parsedCareTypes = JSON.parse(careTypes);
        } catch {
          parsedCareTypes = careTypes.split(',').map((c) => c.trim());
        }
      }
    }

    // Process newly uploaded files
    const newDocs = [];
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      for (const file of req.files) {
        // Document type can be passed in body or extracted from fieldname/form metadata
        const docType = req.body[`type_${file.fieldname}`] || req.body.documentType || 'registration_certificate';
        newDocs.push({
          documentType: docType,
          originalName: file.originalname,
          fileName: file.filename,
          mimeType: file.mimetype,
          size: file.size,
          filePath: `/api/admin/verifications/document/${file.filename}`,
          uploadedAt: new Date()
        });
      }
    }

    const orgData = {
      name: name.trim(),
      address: address.trim(),
      city: city.trim(),
      district: (district || '').trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      website: (website || '').trim(),
      responsiblePerson: responsiblePerson.trim(),
      organizationType: organizationType || 'Trust',
      registrationNumber: registrationNumber.trim(),
      registrationType: (registrationType || 'Public Trust Act').trim(),
      registrationAuthority: (registrationAuthority || '').trim(),
      registrationDate: registrationDate ? new Date(registrationDate) : undefined,
      description: (description || '').trim(),
      capacity: capacity ? Number(capacity) : 40,
      residentsCount: residentsCount ? Number(residentsCount) : 25,
      careTypes: parsedCareTypes,
      verificationStatus: 'PENDING',
      submittedAt: new Date()
    };

    // Run duplicate & suspicious listing check
    const duplicateFlags = await detectDuplicateFlags(orgData, org?._id);
    orgData.duplicateFlags = duplicateFlags;

    const submissionHistoryEntry = {
      status: 'PENDING',
      reviewedByName: req.user.name,
      reviewedAt: new Date(),
      notes: org?.verificationStatus === 'REJECTED' 
        ? 'Resubmitted for verification with revised information and documents.'
        : 'Initial verification request submitted and awaiting review.',
      checklist: {
        organizationDetailsChecked: false,
        registrationInfoChecked: false,
        registrationDocChecked: false,
        addressChecked: false,
        contactChecked: false,
        otherDocsChecked: false
      }
    };

    if (org) {
      // Update existing organization
      Object.assign(org, orgData);
      if (newDocs.length > 0) {
        org.documents.push(...newDocs);
      }
      org.verificationHistory.push(submissionHistoryEntry);
      await org.save();
    } else {
      // Create new organization record
      orgData.user = req.user._id;
      orgData.documents = newDocs;
      orgData.verificationHistory = [submissionHistoryEntry];
      org = await Organization.create(orgData);
    }

    // Notify administrators of pending verification request
    await notifyAdmins({
      type: 'VERIFICATION',
      title: 'New Organization Verification Request',
      message: `Organization '${org.name}' has submitted verification documents for review.`,
      relatedEntityType: 'Organization',
      relatedEntityId: org._id,
      link: `/admin/homes/${org._id}`
    });

    return res.status(200).json({
      success: true,
      message: 'Your verification request has been submitted and is awaiting review.',
      data: {
        organization: org
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user's organization profile & verification status
 * @route   GET /api/organizations/my-organization
 * @access  Private (Home role)
 */
export const getMyOrganization = async (req, res, next) => {
  try {
    let org = await Organization.findOne({ user: req.user._id });

    if (!org) {
      // Return empty default state without breaking
      return res.status(200).json({
        success: true,
        message: 'No organization verification submitted yet.',
        data: {
          organization: {
            verificationStatus: 'UNVERIFIED',
            name: req.user.name,
            phone: req.user.phone,
            email: req.user.email,
            documents: [],
            verificationHistory: []
          }
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Organization profile fetched successfully.',
      data: {
        organization: org
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all public organizations with search & status filters
 * @route   GET /api/organizations/public
 * @access  Public
 */
export const getPublicOrganizations = async (req, res, next) => {
  try {
    const { search, city, verificationStatus, careType } = req.query;

    const query = {};

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { description: regex }, { city: regex }];
    }

    if (city && city.trim()) {
      query.city = new RegExp(city.trim(), 'i');
    }

    if (careType && careType !== 'All') {
      query.careTypes = careType;
    }

    if (verificationStatus && verificationStatus !== 'All') {
      query.verificationStatus = verificationStatus.toUpperCase();
    }

    const orgs = await Organization.find(query).sort({ verifiedAt: -1, createdAt: -1 });

    const safeOrgs = orgs.map((o) => o.toPublicJSON());

    return res.status(200).json({
      success: true,
      data: {
        organizations: safeOrgs,
        total: safeOrgs.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single public organization profile by ID
 * @route   GET /api/organizations/public/:id
 * @access  Public
 */
export const getPublicOrganizationById = async (req, res, next) => {
  try {
    const org = await Organization.findById(req.params.id);

    if (!org) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found.'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        organization: org.toPublicJSON()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all verification requests for Admin dashboard
 * @route   GET /api/admin/verifications
 * @access  Private (Admin role only)
 */
export const getAdminVerifications = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const query = {};

    if (status && status !== 'All') {
      query.verificationStatus = status.toUpperCase();
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: regex },
        { registrationNumber: regex },
        { city: regex },
        { email: regex }
      ];
    }

    const organizations = await Organization.find(query)
      .populate('user', 'name email phone')
      .populate('verifiedBy', 'name email')
      .sort({ submittedAt: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        organizations,
        count: organizations.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get verification statistics for Admin dashboard
 * @route   GET /api/admin/verifications/stats
 * @access  Private (Admin role only)
 */
export const getAdminVerificationStats = async (req, res, next) => {
  try {
    const total = await Organization.countDocuments();
    const pending = await Organization.countDocuments({ verificationStatus: 'PENDING' });
    const verified = await Organization.countDocuments({ verificationStatus: 'VERIFIED' });
    const rejected = await Organization.countDocuments({ verificationStatus: 'REJECTED' });
    const unverified = await Organization.countDocuments({ verificationStatus: 'UNVERIFIED' });

    return res.status(200).json({
      success: true,
      data: {
        total,
        pending,
        verified,
        rejected,
        unverified
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get detailed verification request for Admin review
 * @route   GET /api/admin/verifications/:id
 * @access  Private (Admin role only)
 */
export const getAdminVerificationById = async (req, res, next) => {
  try {
    const org = await Organization.findById(req.params.id)
      .populate('user', 'name email phone createdAt')
      .populate('verifiedBy', 'name email');

    if (!org) {
      return res.status(404).json({
        success: false,
        message: 'Verification request not found.'
      });
    }

    // Refresh duplicate flags to ensure most up to date detection
    const flags = await detectDuplicateFlags(org.toObject(), org._id);
    org.duplicateFlags = flags;

    return res.status(200).json({
      success: true,
      data: {
        organization: org
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin approves organization verification
 * @route   PATCH /api/admin/verifications/:id/approve
 * @access  Private (Admin role only)
 */
export const approveVerification = async (req, res, next) => {
  try {
    const org = await Organization.findById(req.params.id);

    if (!org) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found.'
      });
    }

    const { checklist, notes } = req.body;

    org.verificationStatus = 'VERIFIED';
    org.verifiedAt = new Date();
    org.verifiedBy = req.user._id;
    org.verificationNotes = notes || 'Organization details and submitted documents reviewed and approved.';
    org.rejectionReason = '';

    if (checklist) {
      org.checklist = {
        organizationDetailsChecked: !!checklist.organizationDetailsChecked,
        registrationInfoChecked: !!checklist.registrationInfoChecked,
        registrationDocChecked: !!checklist.registrationDocChecked,
        addressChecked: !!checklist.addressChecked,
        contactChecked: !!checklist.contactChecked,
        otherDocsChecked: !!checklist.otherDocsChecked
      };
    }

    // Add to verification history
    org.verificationHistory.push({
      status: 'VERIFIED',
      reviewedBy: req.user._id,
      reviewedByName: req.user.name,
      reviewedAt: new Date(),
      notes: org.verificationNotes,
      rejectionReason: '',
      checklist: org.checklist
    });

    await org.save();

    return res.status(200).json({
      success: true,
      message: 'Organization verified successfully.',
      data: {
        organization: org
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin rejects organization verification
 * @route   PATCH /api/admin/verifications/:id/reject
 * @access  Private (Admin role only)
 */
export const rejectVerification = async (req, res, next) => {
  try {
    const org = await Organization.findById(req.params.id);

    if (!org) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found.'
      });
    }

    const { rejectionReason, checklist, notes } = req.body;

    // Strict validation: Rejection reason cannot be empty
    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required. Please provide a clear explanation for the organization.'
      });
    }

    org.verificationStatus = 'REJECTED';
    org.rejectionReason = rejectionReason.trim();
    org.verifiedBy = req.user._id;
    org.verificationNotes = notes || '';

    if (checklist) {
      org.checklist = {
        organizationDetailsChecked: !!checklist.organizationDetailsChecked,
        registrationInfoChecked: !!checklist.registrationInfoChecked,
        registrationDocChecked: !!checklist.registrationDocChecked,
        addressChecked: !!checklist.addressChecked,
        contactChecked: !!checklist.contactChecked,
        otherDocsChecked: !!checklist.otherDocsChecked
      };
    }

    // Add to verification history
    org.verificationHistory.push({
      status: 'REJECTED',
      reviewedBy: req.user._id,
      reviewedByName: req.user.name,
      reviewedAt: new Date(),
      rejectionReason: org.rejectionReason,
      notes: org.verificationNotes,
      checklist: org.checklist
    });

    await org.save();

    return res.status(200).json({
      success: true,
      message: 'Verification request rejected.',
      data: {
        organization: org
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Securely view or download a verification document (Admin & Owner only)
 * @route   GET /api/admin/verifications/document/:filename
 * @access  Private (Admin or Document Owner)
 */
export const getSecureDocument = async (req, res) => {
  try {
    const { filename } = req.params;

    // Sanitize filename to prevent directory traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(uploadDir, safeFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Document file not found.'
      });
    }

    // Check authorization: Must be Admin OR the organization that owns this document
    if (req.user.role !== 'admin') {
      const org = await Organization.findOne({
        user: req.user._id,
        'documents.fileName': safeFilename
      });

      if (!org) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You do not have permission to access this private verification document.'
        });
      }
    }

    return res.sendFile(filePath);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve document.'
    });
  }
};
