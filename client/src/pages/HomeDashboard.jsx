import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import organizationService from '../services/organizationService.js';
import requirementService from '../services/requirementService.js';
import donationService from '../services/donationService.js';
import VerificationBadge from '../components/VerificationBadge.jsx';
import DonationStatusBadge from '../components/DonationStatusBadge.jsx';
import {
  Building2,
  ShieldCheck,
  Clock,
  XCircle,
  HelpCircle,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MapPin,
  Phone,
  Mail,
  User,
  ExternalLink,
  ChevronRight,
  Info,
  Calendar,
  History,
  FileCheck2,
  Trash2,
  Package,
  Plus,
  Edit3,
  Flame,
  CheckCheck,
  PieChart,
  Layers,
  Sparkles,
  X,
  Heart,
  Truck,
  Ban,
  ArrowRight
} from 'lucide-react';

export const HomeDashboard = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [organization, setOrganization] = useState(null);
  const [isEditingForm, setIsEditingForm] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    district: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    website: '',
    responsiblePerson: '',
    organizationType: 'Trust',
    registrationNumber: '',
    registrationType: 'Public Trust Act',
    registrationAuthority: '',
    registrationDate: '',
    description: '',
    capacity: 40,
    residentsCount: 25
  });

  // Selected files for upload
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [documentTypeMap, setDocumentTypeMap] = useState({});
  const [formErrors, setFormErrors] = useState({});

  // Active Tab: 'requirements' vs 'profile'
  const [activeTab, setActiveTab] = useState('requirements');

  // Requirements State
  const [requirements, setRequirements] = useState([]);
  const [reqStats, setReqStats] = useState({ total: 0, open: 0, partiallyFulfilled: 0, fulfilled: 0, closed: 0 });
  const [reqLoading, setReqLoading] = useState(false);
  const [reqFilterStatus, setReqFilterStatus] = useState('All');
  const [reqFilterCategory, setReqFilterCategory] = useState('All');
  const [reqFilterUrgency, setReqFilterUrgency] = useState('All');
  const [reqSearch, setReqSearch] = useState('');

  // Requirement Modal State
  const [showReqModal, setShowReqModal] = useState(false);
  const [editingReqId, setEditingReqId] = useState(null);
  const [reqFormSubmitting, setReqFormSubmitting] = useState(false);
  const [reqFormData, setReqFormData] = useState({
    title: '',
    description: '',
    category: 'Groceries & Food',
    unit: 'kg',
    quantityRequired: 50,
    quantityFulfilled: 0,
    urgency: 'Medium',
    status: 'Open',
    neededByDate: '',
    notes: ''
  });

  const categories = [
    'Groceries & Food',
    'Medical & Healthcare',
    'Hygiene & Sanitation',
    'Bedding & Clothing',
    'Mobility & Assistive Devices',
    'Facility & Maintenance',
    'Recreational & Educational',
    'Other'
  ];

  const urgencies = ['High', 'Medium', 'Low'];
  const reqStatuses = ['Open', 'Partially Fulfilled', 'Fulfilled', 'Closed'];

  // Fetch requirements
  const fetchRequirements = async () => {
    try {
      setReqLoading(true);
      const res = await requirementService.getMyRequirements({
        status: reqFilterStatus,
        category: reqFilterCategory,
        urgency: reqFilterUrgency,
        search: reqSearch
      });
      if (res.success && res.data) {
        setRequirements(res.data.requirements || []);
        if (res.data.stats) setReqStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to load requirements:', err);
    } finally {
      setReqLoading(false);
    }
  };

  // Home Donations State (Module 3)
  const [homeDonations, setHomeDonations] = useState([]);
  const [homeDonationStats, setHomeDonationStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    scheduled: 0,
    delivered: 0,
    completed: 0,
    rejected: 0,
    cancelled: 0
  });
  const [homeDonationLoading, setHomeDonationLoading] = useState(false);
  const [homeDonationStatusFilter, setHomeDonationStatusFilter] = useState('ALL');
  const [homeDonationCategoryFilter, setHomeDonationCategoryFilter] = useState('ALL');
  const [homeDonationSearch, setHomeDonationSearch] = useState('');
  const [homeDonationPage, setHomeDonationPage] = useState(1);
  const [homeDonationPagination, setHomeDonationPagination] = useState({
    totalRecords: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10
  });

  // Action Modals State
  const [homeRejectModalOpen, setHomeRejectModalOpen] = useState(false);
  const [selectedDonationForReject, setSelectedDonationForReject] = useState(null);
  const [homeRejectionReason, setHomeRejectionReason] = useState('');

  const [homeScheduleModalOpen, setHomeScheduleModalOpen] = useState(false);
  const [selectedDonationForSchedule, setSelectedDonationForSchedule] = useState(null);
  const [homeScheduledDate, setHomeScheduledDate] = useState('');
  const [homeScheduleNotes, setHomeScheduleNotes] = useState('');

  const [actionInProgress, setActionInProgress] = useState(false);

  // Fetch Home Donations
  const fetchHomeDonations = async () => {
    try {
      setHomeDonationLoading(true);
      const params = {
        page: homeDonationPage,
        limit: 10
      };
      if (homeDonationStatusFilter !== 'ALL') {
        params.status = homeDonationStatusFilter;
      }
      if (homeDonationCategoryFilter !== 'ALL') {
        params.category = homeDonationCategoryFilter;
      }
      if (homeDonationSearch && homeDonationSearch.trim()) {
        params.search = homeDonationSearch.trim();
      }

      const res = await donationService.getHomeDonations(params);
      if (res.success && res.data) {
        setHomeDonations(res.data.donations || []);
        if (res.data.stats) setHomeDonationStats(res.data.stats);
        if (res.data.pagination) setHomeDonationPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load home donations:', err);
    } finally {
      setHomeDonationLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeDonations();
  }, [activeTab, homeDonationStatusFilter, homeDonationCategoryFilter, homeDonationPage]);

  // Action handlers
  const handleAcceptDonation = async (donationId) => {
    if (!window.confirm('Accept this donation request? The donor will be notified to proceed with delivery scheduling.')) {
      return;
    }
    try {
      setActionInProgress(true);
      const res = await donationService.acceptDonation(donationId, {
        notes: 'Donation request accepted by old-age home.'
      });
      if (res.success) {
        showToast(res.message || 'Donation request accepted!', 'success');
        await fetchHomeDonations();
      }
    } catch (err) {
      showToast(err.customMessage || 'Failed to accept donation.', 'error');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleOpenRejectModal = (donation) => {
    setSelectedDonationForReject(donation);
    setHomeRejectionReason('');
    setHomeRejectModalOpen(true);
  };

  const handleSubmitReject = async (e) => {
    e.preventDefault();
    if (!selectedDonationForReject || !homeRejectionReason.trim()) {
      showToast('Please provide a reason for declining.', 'error');
      return;
    }
    try {
      setActionInProgress(true);
      const res = await donationService.rejectDonation(selectedDonationForReject._id, {
        rejectionReason: homeRejectionReason.trim()
      });
      if (res.success) {
        showToast(res.message || 'Donation request declined.', 'info');
        setHomeRejectModalOpen(false);
        setSelectedDonationForReject(null);
        await fetchHomeDonations();
      }
    } catch (err) {
      showToast(err.customMessage || 'Failed to decline donation.', 'error');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleOpenScheduleModal = (donation) => {
    setSelectedDonationForSchedule(donation);
    setHomeScheduledDate(
      donation.scheduledDate
        ? new Date(donation.scheduledDate).toISOString().split('T')[0]
        : ''
    );
    setHomeScheduleNotes(donation.notes || '');
    setHomeScheduleModalOpen(true);
  };

  const handleSubmitSchedule = async (e) => {
    e.preventDefault();
    if (!selectedDonationForSchedule || !homeScheduledDate) {
      showToast('Please select a delivery date.', 'error');
      return;
    }
    try {
      setActionInProgress(true);
      const res = await donationService.scheduleDonation(selectedDonationForSchedule._id, {
        scheduledDate: homeScheduledDate,
        notes: homeScheduleNotes.trim()
      });
      if (res.success) {
        showToast(res.message || 'Delivery scheduled successfully!', 'success');
        setHomeScheduleModalOpen(false);
        setSelectedDonationForSchedule(null);
        await fetchHomeDonations();
      }
    } catch (err) {
      showToast(err.customMessage || 'Failed to schedule delivery.', 'error');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleCompleteReceipt = async (donationId) => {
    if (!window.confirm('Confirm that you have received and verified the donated items? This marks the donation COMPLETED.')) {
      return;
    }
    try {
      setActionInProgress(true);
      const res = await donationService.completeDonation(donationId, {
        notes: 'Items received and verified by old-age home staff.'
      });
      if (res.success) {
        showToast(res.message || 'Donation receipt confirmed! Thank you.', 'success');
        await fetchHomeDonations();
      }
    } catch (err) {
      showToast(err.customMessage || 'Failed to confirm receipt.', 'error');
    } finally {
      setActionInProgress(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'requirements') {
      fetchRequirements();
    }
  }, [activeTab, reqFilterStatus, reqFilterCategory, reqFilterUrgency, reqSearch]);

  const handleOpenCreateModal = () => {
    setEditingReqId(null);
    setReqFormData({
      title: '',
      description: '',
      category: 'Groceries & Food',
      unit: 'kg',
      quantityRequired: 20,
      quantityFulfilled: 0,
      urgency: 'Medium',
      status: 'Open',
      neededByDate: '',
      notes: ''
    });
    setShowReqModal(true);
  };

  const handleOpenEditModal = (req) => {
    setEditingReqId(req._id);
    setReqFormData({
      title: req.title || '',
      description: req.description || '',
      category: req.category || 'Groceries & Food',
      unit: req.unit || 'units',
      quantityRequired: req.quantityRequired || 1,
      quantityFulfilled: req.quantityFulfilled || 0,
      urgency: req.urgency || 'Medium',
      status: req.status || 'Open',
      neededByDate: req.neededByDate ? new Date(req.neededByDate).toISOString().split('T')[0] : '',
      notes: req.notes || ''
    });
    setShowReqModal(true);
  };

  const handleSaveRequirement = async (e) => {
    e.preventDefault();
    if (!reqFormData.title.trim()) {
      showToast('Please provide a requirement title.', 'error');
      return;
    }
    if (Number(reqFormData.quantityRequired) <= 0) {
      showToast('Required quantity must be at least 1.', 'error');
      return;
    }

    setReqFormSubmitting(true);
    try {
      if (editingReqId) {
        const res = await requirementService.updateRequirement(editingReqId, reqFormData);
        if (res.success) {
          showToast('Requirement updated successfully.', 'success');
          setShowReqModal(false);
          fetchRequirements();
        }
      } else {
        const res = await requirementService.createRequirement(reqFormData);
        if (res.success) {
          showToast('New requirement added successfully.', 'success');
          setShowReqModal(false);
          fetchRequirements();
        }
      }
    } catch (err) {
      showToast(err.customMessage || 'Failed to save requirement.', 'error');
    } finally {
      setReqFormSubmitting(false);
    }
  };

  const handleDeleteRequirement = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete the requirement "${title}"?`)) {
      return;
    }
    try {
      const res = await requirementService.deleteRequirement(id);
      if (res.success) {
        showToast('Requirement deleted.', 'info');
        fetchRequirements();
      }
    } catch (err) {
      showToast(err.customMessage || 'Failed to delete requirement.', 'error');
    }
  };

  const orgTypes = [
    'Trust',
    'Society',
    'Section 8 Non-Profit',
    'Private Organization',
    'Religious / Charitable Trust',
    'Other'
  ];

  const documentTypes = [
    { value: 'registration_certificate', label: 'Registration Certificate' },
    { value: 'organization_id', label: 'Organization ID Document / PAN' },
    { value: 'address_proof', label: 'Address Proof / Utility Bill' },
    { value: 'facility_photos', label: 'Facility Photos / Premises' },
    { value: 'other', label: 'Other Authorization Document' }
  ];

  // Fetch current organization on mount
  const fetchOrganization = async () => {
    try {
      setLoading(true);
      const res = await organizationService.getMyOrganization();
      if (res.success && res.data?.organization) {
        const org = res.data.organization;
        setOrganization(org);

        // Prepopulate form
        setFormData({
          name: org.name || currentUser?.name || '',
          address: org.address || '',
          city: org.city || currentUser?.location?.split(',')[0] || '',
          district: org.district || '',
          state: org.state || 'Karnataka',
          pincode: org.pincode || '',
          phone: org.phone || currentUser?.phone || '',
          email: org.email || currentUser?.email || '',
          website: org.website || '',
          responsiblePerson: org.responsiblePerson || currentUser?.name || '',
          organizationType: org.organizationType || 'Trust',
          registrationNumber: org.registrationNumber || '',
          registrationType: org.registrationType || 'Public Trust Act',
          registrationAuthority: org.registrationAuthority || '',
          registrationDate: org.registrationDate
            ? new Date(org.registrationDate).toISOString().split('T')[0]
            : '',
          description: org.description || '',
          capacity: org.capacity || 40,
          residentsCount: org.residentsCount || 25
        });

        if (org.verificationStatus === 'UNVERIFIED' || org.verificationStatus === 'REJECTED') {
          setIsEditingForm(true);
        }
      }
    } catch (err) {
      console.error('Failed to load organization profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganization();
  }, []);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Please enter organization name.';
    if (!formData.address.trim()) errs.address = 'Please enter full address.';
    if (!formData.city.trim()) errs.city = 'Please enter city.';
    if (!formData.state.trim()) errs.state = 'Please enter state.';
    if (!formData.pincode.trim()) errs.pincode = 'Please enter PIN code.';
    if (!formData.phone.trim()) errs.phone = 'Please enter contact number.';
    if (!formData.email.trim()) errs.email = 'Please enter organization email.';
    if (!formData.responsiblePerson.trim()) errs.responsiblePerson = 'Please enter responsible person name.';
    if (!formData.registrationNumber.trim()) errs.registrationNumber = 'Please enter registration number.';

    // Check if at least one document exists or is selected
    const hasExistingDocs = organization?.documents && organization.documents.length > 0;
    const hasNewDocs = selectedFiles.length > 0;
    if (!hasExistingDocs && !hasNewDocs) {
      errs.documents = 'Please upload at least one supporting verification document.';
    }

    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Handle document file selections
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // Validate size (max 5MB each)
    const validFiles = [];
    for (const f of files) {
      if (f.size > 5 * 1024 * 1024) {
        showToast(`File '${f.name}' exceeds the 5MB size limit.`, 'error');
        continue;
      }
      validFiles.push(f);
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);

    // Default document types for newly selected files
    setDocumentTypeMap((prev) => {
      const nextMap = { ...prev };
      validFiles.forEach((file, index) => {
        if (!nextMap[file.name]) {
          nextMap[file.name] = documentTypes[Math.min(index, documentTypes.length - 1)].value;
        }
      });
      return nextMap;
    });

    if (formErrors.documents) {
      setFormErrors((prev) => ({ ...prev, documents: '' }));
    }
  };

  const removeSelectedFile = (fileName) => {
    setSelectedFiles((prev) => prev.filter((f) => f.name !== fileName));
  };

  const handleDocTypeChange = (fileName, type) => {
    setDocumentTypeMap((prev) => ({ ...prev, [fileName]: type }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      showToast('Please correct the errors in the form before submitting.', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const payload = new FormData();
      Object.keys(formData).forEach((key) => {
        payload.append(key, formData[key]);
      });

      // Append documents & metadata
      selectedFiles.forEach((file) => {
        payload.append('documents', file);
        payload.append(`type_${file.name}`, documentTypeMap[file.name] || 'registration_certificate');
      });

      const res = await organizationService.submitVerification(payload);

      if (res.success) {
        showToast(
          'Your verification request has been submitted and is awaiting review.',
          'success',
          6000
        );
        setSelectedFiles([]);
        setIsEditingForm(false);
        await fetchOrganization();
      } else {
        showToast(res.message || 'Verification submission failed.', 'error');
      }
    } catch (err) {
      showToast(err.customMessage || 'Failed to submit verification details.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading organization portal...</p>
      </div>
    );
  }

  const status = organization?.verificationStatus || 'UNVERIFIED';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-indigo-950/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-blue-200 text-xs font-semibold tracking-wide border border-white/20">
              <Building2 className="w-3.5 h-3.5" />
              Old-Age Home Facility Management
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {organization?.name || currentUser?.name}
            </h1>
            <p className="text-blue-100/90 text-sm sm:text-base max-w-2xl">
              Manage your daily living requirements, publish urgent community needs, and maintain your official platform trust credentials.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 self-start md:self-auto">
            <div>
              <p className="text-xs text-blue-200 uppercase tracking-wider font-semibold">
                Platform Status
              </p>
              <div className="mt-1">
                <VerificationBadge organization={organization} size="lg" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('requirements')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all ${
            activeTab === 'requirements'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          Requirements & Needs
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeTab === 'requirements' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {reqStats.total}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('donations')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all ${
            activeTab === 'donations'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Heart className="w-4 h-4" />
          Donation Requests
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeTab === 'donations'
                ? 'bg-white/20 text-white'
                : homeDonationStats.pending > 0
                ? 'bg-amber-100 text-amber-800'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {homeDonationStats.pending > 0 ? `${homeDonationStats.pending} new` : homeDonationStats.total}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all ${
            activeTab === 'profile'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Profile & Verification
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: REQUIREMENTS & NEEDS MANAGEMENT */}
      {/* ============================================================ */}
      {activeTab === 'requirements' && (
        <div className="space-y-8">
          {/* Top Requirements Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-6 h-6 text-teal-600" />
                Home Living & Care Requirements
              </h2>
              <p className="text-slate-600 text-sm mt-0.5">
                Add, track, and update required supplies, medications, and daily living essentials for your residents.
              </p>
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Add Requirement
            </button>
          </div>

          {/* Metric Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">Total Items</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{reqStats.total}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-blue-200 bg-blue-50/30 shadow-xs">
              <span className="text-xs font-semibold text-blue-700 uppercase">Open / Pending</span>
              <p className="text-2xl font-black text-blue-900 mt-1">{reqStats.open}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-amber-200 bg-amber-50/30 shadow-xs">
              <span className="text-xs font-semibold text-amber-700 uppercase">Partially Fulfilled</span>
              <p className="text-2xl font-black text-amber-900 mt-1">{reqStats.partiallyFulfilled}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-emerald-200 bg-emerald-50/30 shadow-xs">
              <span className="text-xs font-semibold text-emerald-700 uppercase">Fulfilled</span>
              <p className="text-2xl font-black text-emerald-900 mt-1">{reqStats.fulfilled}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 bg-slate-50 shadow-xs col-span-2 lg:col-span-1">
              <span className="text-xs font-semibold text-slate-500 uppercase">Closed / Archived</span>
              <p className="text-2xl font-black text-slate-700 mt-1">{reqStats.closed}</p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-5 relative">
              <input
                type="text"
                placeholder="Search requirements by title or description..."
                value={reqSearch}
                onChange={(e) => setReqSearch(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
              />
            </div>
            <div className="sm:col-span-3">
              <select
                value={reqFilterCategory}
                onChange={(e) => setReqFilterCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-700 bg-white"
              >
                <option value="All">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <select
                value={reqFilterUrgency}
                onChange={(e) => setReqFilterUrgency(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-700 bg-white"
              >
                <option value="All">All Urgency</option>
                {urgencies.map((u) => (
                  <option key={u} value={u}>
                    {u} Urgency
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <select
                value={reqFilterStatus}
                onChange={(e) => setReqFilterStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-700 bg-white"
              >
                <option value="All">All Status</option>
                {reqStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Requirements Grid */}
          {reqLoading ? (
            <div className="py-12 flex justify-center items-center gap-2 text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
              <span>Loading requirements...</span>
            </div>
          ) : requirements.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800">No requirements found</h3>
              <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
                Publish your first requirement so donors and volunteers can view and pledge needed supplies.
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-sm hover:bg-teal-700 transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Add Your First Requirement
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {requirements.map((req) => {
                const pct = req.progressPercentage || Math.round(((req.quantityFulfilled || 0) / (req.quantityRequired || 1)) * 100);
                const remaining = req.remainingQuantity !== undefined ? req.remainingQuantity : Math.max(0, (req.quantityRequired || 0) - (req.quantityFulfilled || 0));

                return (
                  <div
                    key={req._id}
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-6 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700">
                          {req.category}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {/* Urgency Badge */}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold uppercase flex items-center gap-1 ${
                              req.urgency === 'High'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : req.urgency === 'Medium'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            <Flame className="w-3 h-3" />
                            {req.urgency}
                          </span>

                          {/* Status Badge */}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              req.status === 'Fulfilled'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : req.status === 'Partially Fulfilled'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : req.status === 'Closed'
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 leading-snug">{req.title}</h3>
                        {req.description && (
                          <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                            {req.description}
                          </p>
                        )}
                      </div>

                      {/* Quantity Numbers */}
                      <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50/90 rounded-2xl text-center border border-slate-100">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400">Required</span>
                          <p className="font-extrabold text-slate-900 text-sm mt-0.5">
                            {req.quantityRequired} <span className="text-[11px] font-normal text-slate-500">{req.unit}</span>
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-emerald-600">Fulfilled</span>
                          <p className="font-extrabold text-emerald-700 text-sm mt-0.5">
                            {req.quantityFulfilled || 0} <span className="text-[11px] font-normal text-slate-500">{req.unit}</span>
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-rose-500">Remaining</span>
                          <p className="font-extrabold text-rose-700 text-sm mt-0.5">
                            {remaining} <span className="text-[11px] font-normal text-slate-500">{req.unit}</span>
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="flex items-center justify-between text-xs font-semibold mb-1">
                          <span className="text-slate-600">Fulfillment Progress</span>
                          <span className="text-teal-700 font-bold">{pct}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 rounded-full ${
                              pct >= 100
                                ? 'bg-emerald-500'
                                : pct > 50
                                ? 'bg-teal-500'
                                : pct > 20
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Needed By Date / Notes */}
                      {req.neededByDate && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Needed by: {new Date(req.neededByDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleOpenEditModal(req)}
                        className="flex-1 py-2 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRequirement(req._id, req.title)}
                        className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-100 transition-colors"
                        title="Delete Requirement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* CREATE / EDIT REQUIREMENT MODAL */}
          {showReqModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">
                        {editingReqId ? 'Edit Requirement' : 'Add New Requirement'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {editingReqId ? 'Update requirement quantities or urgency' : 'List a specific item or resource required by residents'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowReqModal(false)}
                    className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveRequirement} className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Requirement Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Monthly Adult Diapers & Hygiene Kits"
                      value={reqFormData.title}
                      onChange={(e) => setReqFormData({ ...reqFormData, title: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                    />
                  </div>

                  {/* Category & Urgency */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                      <select
                        value={reqFormData.category}
                        onChange={(e) => setReqFormData({ ...reqFormData, category: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                      >
                        {categories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Urgency Level</label>
                      <select
                        value={reqFormData.urgency}
                        onChange={(e) => setReqFormData({ ...reqFormData, urgency: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white font-bold"
                      >
                        <option value="High">🔴 High Priority (Immediate need)</option>
                        <option value="Medium">🟡 Medium Priority (Within 2 weeks)</option>
                        <option value="Low">🟢 Low Priority (Regular stock)</option>
                      </select>
                    </div>
                  </div>

                  {/* Quantity Required, Fulfilled, Unit */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Required Qty <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={reqFormData.quantityRequired}
                        onChange={(e) => setReqFormData({ ...reqFormData, quantityRequired: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Fulfilled Qty</label>
                      <input
                        type="number"
                        min="0"
                        value={reqFormData.quantityFulfilled}
                        onChange={(e) => setReqFormData({ ...reqFormData, quantityFulfilled: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Unit</label>
                      <input
                        type="text"
                        placeholder="kg / boxes / units"
                        value={reqFormData.unit}
                        onChange={(e) => setReqFormData({ ...reqFormData, unit: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                      />
                    </div>
                  </div>

                  {/* Status & Needed By Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Requirement Status</label>
                      <select
                        value={reqFormData.status}
                        onChange={(e) => setReqFormData({ ...reqFormData, status: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                      >
                        {reqStatuses.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Needed By Date (Optional)</label>
                      <input
                        type="date"
                        value={reqFormData.neededByDate}
                        onChange={(e) => setReqFormData({ ...reqFormData, neededByDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Description & Purpose</label>
                    <textarea
                      rows="2"
                      placeholder="Brief details about specific brand, sizes, dietary restrictions..."
                      value={reqFormData.description}
                      onChange={(e) => setReqFormData({ ...reqFormData, description: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                    ></textarea>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowReqModal(false)}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={reqFormSubmitting}
                      className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all disabled:opacity-60 flex items-center gap-2"
                    >
                      {reqFormSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      {editingReqId ? 'Update Requirement' : 'Publish Requirement'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: INCOMING DONATION REQUESTS MANAGEMENT (MODULE 3) */}
      {/* ============================================================ */}
      {activeTab === 'donations' && (
        <div className="space-y-8">
          {/* Top Header Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <Heart className="w-6 h-6 text-teal-600" />
                  Donation Requests &amp; Community Pledges
                </h2>
                <p className="text-slate-600 text-sm mt-0.5">
                  Review pledges from donors, coordinate delivery schedules, and confirm receipts for your residents.
                </p>
              </div>

              {homeDonationStats.pending > 0 && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold animate-pulse">
                  <Clock className="w-4 h-4 text-amber-600" />
                  {homeDonationStats.pending} pending requests need review
                </div>
              )}
            </div>

            {/* Metrics Overview Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Requests</span>
                <p className="text-2xl font-black text-slate-900 mt-1">{homeDonationStats.total}</p>
              </div>

              <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200">
                <span className="text-[11px] font-semibold text-amber-700 uppercase">Pending Review</span>
                <p className="text-2xl font-black text-amber-900 mt-1">{homeDonationStats.pending}</p>
              </div>

              <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-200">
                <span className="text-[11px] font-semibold text-blue-700 uppercase">Accepted / Scheduled</span>
                <p className="text-2xl font-black text-blue-900 mt-1">
                  {homeDonationStats.accepted + homeDonationStats.scheduled}
                </p>
              </div>

              <div className="bg-purple-50/60 rounded-2xl p-4 border border-purple-200">
                <span className="text-[11px] font-semibold text-purple-700 uppercase">Awaiting Confirmation</span>
                <p className="text-2xl font-black text-purple-900 mt-1">{homeDonationStats.delivered}</p>
              </div>

              <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-200">
                <span className="text-[11px] font-semibold text-emerald-700 uppercase">Completed</span>
                <p className="text-2xl font-black text-emerald-900 mt-1">{homeDonationStats.completed}</p>
              </div>
            </div>

            {/* Filters Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-slate-100">
              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none text-xs">
                {[
                  { key: 'ALL', label: 'All Requests' },
                  { key: 'PENDING', label: 'Pending Review' },
                  { key: 'ACCEPTED', label: 'Accepted' },
                  { key: 'SCHEDULED', label: 'Scheduled' },
                  { key: 'DELIVERED', label: 'Delivered (Verify)' },
                  { key: 'COMPLETED', label: 'Completed' },
                  { key: 'REJECTED', label: 'Declined' }
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => {
                      setHomeDonationStatusFilter(f.key);
                      setHomeDonationPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-colors ${
                      homeDonationStatusFilter === f.key
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="flex items-center gap-2">
                <div className="relative min-w-[220px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={homeDonationSearch}
                    onChange={(e) => setHomeDonationSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setHomeDonationPage(1);
                        fetchHomeDonations();
                      }
                    }}
                    placeholder="Search item title..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setHomeDonationPage(1);
                    fetchHomeDonations();
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                >
                  Search
                </button>
              </div>
            </div>
          </div>

          {/* Donations List */}
          {homeDonationLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-slate-200/80">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              <p className="text-slate-500 text-sm">Loading donation requests addressed to your facility...</p>
            </div>
          ) : homeDonations.length === 0 ? (
            /* Clean Empty State */
            <div className="py-16 px-6 text-center rounded-3xl bg-white border border-slate-200/80 flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Heart className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-lg font-bold text-slate-800">
                  {homeDonationStatusFilter !== 'ALL'
                    ? `No ${homeDonationStatusFilter.toLowerCase()} donation requests found`
                    : 'No donation requests received yet.'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  When donors pledge items, medical supplies, or groceries to your care home, their requests will appear here for review and scheduling.
                </p>
              </div>
            </div>
          ) : (
            /* Requests Cards */
            <div className="space-y-4">
              {homeDonations.map((item) => (
                <div
                  key={item._id}
                  className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                        ID: #{item._id.slice(-6).toUpperCase()}
                      </span>
                      <DonationStatusBadge status={item.status} size="sm" />
                      <span className="text-xs text-slate-400">
                        Received on {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <Link
                      to={`/donations/${item._id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-800 self-start sm:self-auto"
                    >
                      View Full Lifecycle &amp; Timeline
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Item Details */}
                    <div className="md:col-span-2 space-y-2">
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                          {item.category}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 mt-1">{item.itemName}</h3>
                        {item.description && (
                          <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">Quantity</span>
                          <p className="font-extrabold text-slate-900 text-sm">
                            {item.quantity} {item.unit}
                          </p>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">Preferred Date</span>
                          <p className="font-bold text-slate-800 text-sm">
                            {new Date(item.preferredDeliveryDate).toLocaleDateString()}
                          </p>
                        </div>

                        {item.scheduledDate && (
                          <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-100 col-span-2 sm:col-span-1">
                            <span className="text-[10px] text-purple-700 font-semibold uppercase">Scheduled Date</span>
                            <p className="font-bold text-purple-900 text-sm">
                              {new Date(item.scheduledDate).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>

                      {item.message && (
                        <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100/60 text-xs text-slate-600 italic">
                          <span className="font-bold not-italic text-teal-800">Donor Note: </span>
                          "{item.message}"
                        </div>
                      )}

                      {item.rejectionReason && (
                        <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800">
                          <span className="font-bold">Decline Reason: </span>
                          "{item.rejectionReason}"
                        </div>
                      )}
                    </div>

                    {/* Donor Info & Action Buttons */}
                    <div className="flex flex-col justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Donor Information
                        </span>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center">
                            {item.donorId?.name?.charAt(0).toUpperCase() || 'D'}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">
                              {item.donorId?.name || 'Verified Donor'}
                            </p>
                            <p className="text-[11px] text-slate-500">{item.donorId?.email}</p>
                          </div>
                        </div>

                        {item.donorId?.phone && (
                          <p className="text-[11px] text-slate-600 flex items-center gap-1.5 pt-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {item.donorId.phone}
                          </p>
                        )}
                      </div>

                      {/* Quick Action Buttons for Home */}
                      <div className="space-y-2 pt-2 border-t border-slate-200">
                        {/* Status: PENDING */}
                        {item.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleAcceptDonation(item._id)}
                              disabled={actionInProgress}
                              className="flex-1 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1 shadow-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Accept
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenRejectModal(item)}
                              disabled={actionInProgress}
                              className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors"
                            >
                              Decline
                            </button>
                          </div>
                        )}

                        {/* Status: ACCEPTED or SCHEDULED */}
                        {['ACCEPTED', 'SCHEDULED'].includes(item.status) && (
                          <button
                            type="button"
                            onClick={() => handleOpenScheduleModal(item)}
                            disabled={actionInProgress}
                            className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            {item.status === 'SCHEDULED' ? 'Reschedule Delivery' : 'Confirm Delivery Date'}
                          </button>
                        )}

                        {/* Status: DELIVERED (Donor delivered items, Home must confirm) */}
                        {item.status === 'DELIVERED' && (
                          <button
                            type="button"
                            onClick={() => handleCompleteReceipt(item._id)}
                            disabled={actionInProgress}
                            className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            Confirm Receipt &amp; Complete
                          </button>
                        )}

                        <Link
                          to={`/donations/${item._id}`}
                          className="w-full py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors text-center block"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {homeDonationPagination.totalPages > 1 && (
                <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 text-xs text-slate-600">
                  <span>
                    Page {homeDonationPagination.currentPage} of {homeDonationPagination.totalPages} (
                    {homeDonationPagination.totalRecords} requests)
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={homeDonationPagination.currentPage <= 1}
                      onClick={() => setHomeDonationPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      disabled={homeDonationPagination.currentPage >= homeDonationPagination.totalPages}
                      onClick={() => setHomeDonationPage((p) => p + 1)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Decline / Reject Modal for Home */}
          {homeRejectModalOpen && selectedDonationForReject && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
                <div className="flex items-center gap-3 text-rose-600">
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Decline Donation Request</h3>
                    <p className="text-xs text-slate-500">
                      Item: {selectedDonationForReject.itemName}
                    </p>
                  </div>
                </div>
                <form onSubmit={handleSubmitReject} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Reason for declining</label>
                    <textarea
                      required
                      rows={3}
                      value={homeRejectionReason}
                      onChange={(e) => setHomeRejectionReason(e.target.value)}
                      placeholder="e.g. Storage capacity reached, excess inventory, item specifications incompatible..."
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setHomeRejectModalOpen(false)}
                      disabled={actionInProgress}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionInProgress}
                      className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md"
                    >
                      Confirm Decline
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Schedule Delivery Modal for Home */}
          {homeScheduleModalOpen && selectedDonationForSchedule && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
                <div className="flex items-center gap-3 text-purple-600">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Schedule Delivery Date</h3>
                    <p className="text-xs text-slate-500">
                      Item: {selectedDonationForSchedule.itemName}
                    </p>
                  </div>
                </div>
                <form onSubmit={handleSubmitSchedule} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Scheduled Delivery Date</label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={homeScheduledDate}
                      onChange={(e) => setHomeScheduledDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Receiving Instructions / Notes <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={homeScheduleNotes}
                      onChange={(e) => setHomeScheduleNotes(e.target.value)}
                      placeholder="e.g. Delivery gate open between 10 AM - 4 PM"
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setHomeScheduleModalOpen(false)}
                      disabled={actionInProgress}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionInProgress}
                      className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md"
                    >
                      Confirm Schedule
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: FACILITY PROFILE & TRUST VERIFICATION */}
      {/* ============================================================ */}
      {activeTab === 'profile' && (
        <div className="space-y-8">
      {/* 2. Verification Status Card (Section 14) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-teal-600" />
              Verification & Trust Status
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              CareConnect requires official documentation before conferring verified status.
            </p>
          </div>

          {status === 'VERIFIED' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Reviewed by Admin
            </span>
          )}
        </div>

        {/* Dynamic Status Blocks */}
        <div className="mt-5">
          {status === 'PENDING' && (
            <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-amber-950 flex items-center gap-2">
                    🟡 Verification Pending
                  </h3>
                  <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                    Your verification request has been submitted and is awaiting administrator review. An administrator is inspecting your submitted registration information and documents.
                  </p>
                  {organization?.submittedAt && (
                    <p className="text-[11px] text-amber-800 mt-2 font-medium">
                      Submitted on:{' '}
                      <span className="font-bold">
                        {new Date(organization.submittedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {status === 'VERIFIED' && (
            <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-emerald-950 flex items-center gap-2">
                    🟢 Verified Organization
                  </h3>
                  <p className="text-xs text-emerald-900 mt-1 leading-relaxed">
                    Verified by the platform based on submitted information and reviewed documentation. Your facility displays the Verified badge across search and donor browse portals.
                  </p>
                  {organization?.verifiedAt && (
                    <p className="text-[11px] text-emerald-800 mt-2 font-medium">
                      Last verified:{' '}
                      <span className="font-bold">
                        {new Date(organization.verifiedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {status === 'REJECTED' && (
            <div className="p-5 rounded-2xl bg-rose-50/80 border border-rose-200/80 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                  <XCircle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-rose-950 flex items-center gap-2">
                    🔴 Verification Rejected
                  </h3>
                  <p className="text-xs text-rose-900 mt-1">
                    Your verification request was reviewed and could not be approved at this time.
                  </p>

                  <div className="mt-3 p-3 bg-white/90 border border-rose-200 rounded-xl text-xs text-rose-950">
                    <span className="font-bold text-rose-900">Reason provided by administrator:</span>
                    <p className="mt-0.5 font-medium">{organization?.rejectionReason || 'Documentation could not be verified.'}</p>
                  </div>

                  <div className="mt-4">
                    <button
                      onClick={() => setIsEditingForm(true)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                    >
                      Resubmit Verification Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {status === 'UNVERIFIED' && (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    ⚪ Unverified Organization
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Your old-age home has not yet completed platform verification. Complete the verification form below with your official registration details and supporting documents.
                  </p>
                  <div className="mt-3">
                    <button
                      onClick={() => setIsEditingForm(true)}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                    >
                      Complete Verification Submission
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Verification Submission / Update Form */}
      {(isEditingForm || status === 'UNVERIFIED') && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileCheck2 className="w-6 h-6 text-teal-600" />
                {status === 'REJECTED' ? 'Resubmit Verification Information' : 'Organization Verification Details'}
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                Provide genuine organization credentials and supporting legal documents.
              </p>
            </div>
            {status !== 'UNVERIFIED' && status !== 'REJECTED' && (
              <button
                type="button"
                onClick={() => setIsEditingForm(false)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline"
              >
                Hide Form
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section A: Organization Details */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 text-teal-800 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> 1. Organization Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Organization Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Sneha Nilaya Senior Living & Care Trust"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                  />
                  {formErrors.name && <p className="text-xs text-rose-600 mt-1">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Organization Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="organizationType"
                    value={formData.organizationType}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 bg-white"
                  >
                    {orgTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Complete Physical Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="e.g. Plot 42, 3rd Cross, Indiranagar"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                  />
                  {formErrors.address && <p className="text-xs text-rose-600 mt-1">{formErrors.address}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g. Bangalore"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                  />
                  {formErrors.city && <p className="text-xs text-rose-600 mt-1">{formErrors.city}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    placeholder="e.g. Bangalore Urban"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    State <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="e.g. Karnataka"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                  />
                  {formErrors.state && <p className="text-xs text-rose-600 mt-1">{formErrors.state}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    PIN Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="e.g. 560038"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                  />
                  {formErrors.pincode && <p className="text-xs text-rose-600 mt-1">{formErrors.pincode}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Contact Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98888 11111"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                  />
                  {formErrors.phone && <p className="text-xs text-rose-600 mt-1">{formErrors.phone}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Official Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="contact@facility.org"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                  />
                  {formErrors.email && <p className="text-xs text-rose-600 mt-1">{formErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Responsible Person / Trustee <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="responsiblePerson"
                    value={formData.responsiblePerson}
                    onChange={handleChange}
                    placeholder="e.g. Dr. Meera Nambiar (Trustee)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                  />
                  {formErrors.responsiblePerson && (
                    <p className="text-xs text-rose-600 mt-1">{formErrors.responsiblePerson}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Website (Optional)
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                  />
                </div>
              </div>
            </div>

            {/* Section B: Registration Information */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 text-teal-800 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4" /> 2. Official Registration Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Registration Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    placeholder="e.g. TRUST/BLR/2018/8892"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                  />
                  {formErrors.registrationNumber && (
                    <p className="text-xs text-rose-600 mt-1">{formErrors.registrationNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Registration Act / Type
                  </label>
                  <input
                    type="text"
                    name="registrationType"
                    value={formData.registrationType}
                    onChange={handleChange}
                    placeholder="e.g. Indian Trusts Act, 1882"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Registration Authority
                  </label>
                  <input
                    type="text"
                    name="registrationAuthority"
                    value={formData.registrationAuthority}
                    onChange={handleChange}
                    placeholder="e.g. Charity Commissioner / Sub-Registrar"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Registration Date
                  </label>
                  <input
                    type="date"
                    name="registrationDate"
                    value={formData.registrationDate}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                  />
                </div>
              </div>
            </div>

            {/* Section C: Supporting Documents Upload (Section 3 & 13) */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-teal-800 flex items-center gap-2">
                  <UploadCloud className="w-4 h-4" /> 3. Supporting Documents Upload
                </h3>
                <span className="text-xs text-slate-400">PDF, PNG, JPG (Max 5MB each)</span>
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-300 hover:border-teal-600 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-teal-50/20 transition-all cursor-pointer relative">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  aria-label="Upload verification files"
                />
                <UploadCloud className="w-10 h-10 text-teal-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-800">
                  Click to select files or drag & drop documents here
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Registration certificate, Organization ID/PAN, Address proof, or Facility photos.
                </p>
              </div>
              {formErrors.documents && (
                <p className="text-xs text-rose-600 mt-2 font-semibold">{formErrors.documents}</p>
              )}

              {/* Staged New Documents List */}
              {selectedFiles.length > 0 && (
                <div className="mt-4 space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-700 uppercase">
                    Files Ready to Upload ({selectedFiles.length})
                  </h4>
                  {selectedFiles.map((file) => (
                    <div
                      key={file.name}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-teal-200 bg-teal-50/40 text-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <FileText className="w-4 h-4 text-teal-700 shrink-0" />
                        <span className="font-semibold text-slate-800 truncate">{file.name}</span>
                        <span className="text-slate-400 font-mono">({Math.round(file.size / 1024)} KB)</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={documentTypeMap[file.name] || 'registration_certificate'}
                          onChange={(e) => handleDocTypeChange(file.name, e.target.value)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium"
                        >
                          {documentTypes.map((dt) => (
                            <option key={dt.value} value={dt.value}>
                              {dt.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => removeSelectedFile(file.name)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-100 transition-colors"
                          title="Remove file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Existing Uploaded Documents */}
              {organization?.documents && organization.documents.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <h4 className="text-xs font-bold text-slate-600 uppercase">
                    Previously Uploaded Documents ({organization.documents.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {organization.documents.map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileCheck2 className="w-4 h-4 text-teal-600 shrink-0" />
                          <div className="truncate">
                            <p className="font-semibold text-slate-800 truncate">{doc.originalName}</p>
                            <p className="text-[10px] text-slate-400 capitalize">{doc.documentType.replace('_', ' ')}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                          Stored
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submission Notice & Submit Button */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Submitting sets status to <strong>PENDING</strong> for administrator document review.</span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-7 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-md shadow-teal-600/20 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting verification...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Submit Verification Request
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Verification History Timeline (Section 8) */}
      {organization?.verificationHistory && organization.verificationHistory.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-teal-600" />
            Verification History Log
          </h2>

          <div className="space-y-3">
            {organization.verificationHistory.slice().reverse().map((entry, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-slate-100 bg-slate-50/70 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">
                      {new Date(entry.reviewedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                        entry.status === 'VERIFIED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : entry.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {entry.status}
                    </span>
                    <span className="text-slate-400">&bull;</span>
                    <span className="text-slate-600 font-medium">By: {entry.reviewedByName || 'Administrator'}</span>
                  </div>
                  {entry.rejectionReason && (
                    <p className="text-rose-700 mt-1 font-medium">
                      Rejection Reason: {entry.rejectionReason}
                    </p>
                  )}
                  {entry.notes && (
                    <p className="text-slate-600 mt-1">{entry.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
      )}
    </div>
  );
};

export default HomeDashboard;
