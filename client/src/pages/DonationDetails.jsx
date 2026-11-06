import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import donationService from '../services/donationService.js';
import DonationStatusBadge from '../components/DonationStatusBadge.jsx';
import DonationTimeline from '../components/DonationTimeline.jsx';
import VerificationBadge from '../components/VerificationBadge.jsx';
import {
  ArrowLeft,
  Calendar,
  Building2,
  Package,
  Layers,
  FileText,
  MapPin,
  Phone,
  Mail,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Ban,
  CheckCheck,
  AlertTriangle,
  Loader2,
  Edit3,
  ExternalLink
} from 'lucide-react';

export const DonationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [donation, setDonation] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals & Action States
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduleNotes, setScheduleNotes] = useState('');

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    itemName: '',
    description: '',
    quantity: 1,
    unit: 'units',
    preferredDeliveryDate: '',
    message: '',
    notes: ''
  });

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchDonationDetails();
  }, [id]);

  const fetchDonationDetails = async () => {
    try {
      setLoading(true);
      const res = await donationService.getDonationById(id);
      if (res.success && res.data?.donation) {
        setDonation(res.data.donation);
        setPermissions(res.data.permissions || {});
        // Pre-fill edit form
        const d = res.data.donation;
        setEditFormData({
          itemName: d.itemName || '',
          description: d.description || '',
          quantity: d.quantity || 1,
          unit: d.unit || 'units',
          preferredDeliveryDate: d.preferredDeliveryDate
            ? new Date(d.preferredDeliveryDate).toISOString().split('T')[0]
            : '',
          message: d.message || '',
          notes: d.notes || ''
        });
      } else {
        showToast(res.message || 'Failed to load donation details.', 'error');
      }
    } catch (err) {
      showToast(err.customMessage || 'Could not access donation request.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 1. Accept Request (Home)
  const handleAccept = async () => {
    if (!window.confirm('Accept this donation request? The donor will be notified to schedule delivery.')) {
      return;
    }
    try {
      setActionLoading(true);
      const res = await donationService.acceptDonation(id, {
        notes: 'Donation request accepted by old-age home management.'
      });
      if (res.success) {
        showToast(res.message || 'Donation accepted!', 'success');
        await fetchDonationDetails();
      }
    } catch (err) {
      showToast(err.customMessage || 'Failed to accept donation.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Reject Request (Home)
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      showToast('Please provide a reason for declining the request.', 'error');
      return;
    }
    try {
      setActionLoading(true);
      const res = await donationService.rejectDonation(id, { rejectionReason });
      if (res.success) {
        showToast(res.message || 'Donation request declined.', 'info');
        setRejectModalOpen(false);
        await fetchDonationDetails();
      }
    } catch (err) {
      showToast(err.customMessage || 'Failed to decline donation.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Schedule Delivery (Home or Donor)
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduledDate) {
      showToast('Please pick a scheduled delivery date.', 'error');
      return;
    }
    try {
      setActionLoading(true);
      const res = await donationService.scheduleDonation(id, {
        scheduledDate,
        notes: scheduleNotes
      });
      if (res.success) {
        showToast(res.message || 'Delivery scheduled successfully!', 'success');
        setScheduleModalOpen(false);
        await fetchDonationDetails();
      }
    } catch (err) {
      showToast(err.customMessage || 'Failed to schedule delivery.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Mark Delivered (Donor)
  const handleMarkDelivered = async () => {
    if (!window.confirm('Confirm that you have dispatched or personally delivered these items to the old-age home?')) {
      return;
    }
    try {
      setActionLoading(true);
      const res = await donationService.markDelivered(id, {
        notes: 'Items delivered by donor.'
      });
      if (res.success) {
        showToast(res.message || 'Items marked as delivered!', 'success');
        await fetchDonationDetails();
      }
    } catch (err) {
      showToast(err.customMessage || 'Failed to mark as delivered.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Complete Receipt (Home)
  const handleCompleteReceipt = async () => {
    if (!window.confirm('Confirm receipt of these donated items in satisfactory condition? This will mark the donation COMPLETED.')) {
      return;
    }
    try {
      setActionLoading(true);
      const res = await donationService.completeDonation(id, {
        notes: 'Items received and verified in good condition by old-age home staff.'
      });
      if (res.success) {
        showToast(res.message || 'Donation completed! Thank you.', 'success');
        await fetchDonationDetails();
      }
    } catch (err) {
      showToast(err.customMessage || 'Failed to confirm receipt.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 6. Cancel Request (Donor)
  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await donationService.cancelDonation(id, { reason: cancelReason });
      if (res.success) {
        showToast(res.message || 'Donation cancelled.', 'info');
        setCancelModalOpen(false);
        await fetchDonationDetails();
      }
    } catch (err) {
      showToast(err.customMessage || 'Failed to cancel donation.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 7. Edit Details (Donor while PENDING)
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await donationService.updateDonation(id, editFormData);
      if (res.success) {
        showToast('Donation details updated successfully!', 'success');
        setEditModalOpen(false);
        await fetchDonationDetails();
      }
    } catch (err) {
      showToast(err.customMessage || 'Failed to update details.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
        <p className="text-slate-500 font-medium text-sm">Loading donation records...</p>
      </div>
    );
  }

  if (!donation) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
          <Package className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Donation Not Found</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          The requested donation could not be loaded, or you do not have permission to view it.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-sm shadow-md"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  const isDonor = currentUser?.role === 'donor';
  const isHome = currentUser?.role === 'home';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Breadcrumbs / Back button */}
      <div className="flex items-center justify-between">
        <Link
          to={isHome ? '/home/dashboard' : '/donor/dashboard'}
          className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:text-teal-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {isHome ? 'Home Management Portal' : 'Donor Dashboard'}
        </Link>

        <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
          Tracking ID: #{donation._id.slice(-6).toUpperCase()}
        </span>
      </div>

      {/* 2. Top Header Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <DonationStatusBadge status={donation.status} size="lg" />
              <span className="text-xs text-teal-100 bg-white/10 px-3 py-1 rounded-full border border-white/20">
                Created on {new Date(donation.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {donation.itemName}
            </h1>
            <p className="text-teal-100 text-sm max-w-xl">
              Category: <span className="font-semibold text-white">{donation.category}</span> &bull;{' '}
              Quantity:{' '}
              <span className="font-semibold text-white">
                {donation.quantity} {donation.unit}
              </span>
            </p>
          </div>

          {/* Action buttons in header */}
          <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
            {/* Donor Edit Details (while PENDING) */}
            {permissions.canEdit && (
              <button
                type="button"
                onClick={() => setEditModalOpen(true)}
                disabled={actionLoading}
                className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Details
              </button>
            )}

            {/* Home Accept / Reject */}
            {permissions.canAccept && (
              <button
                type="button"
                onClick={handleAccept}
                disabled={actionLoading}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Accept Request
              </button>
            )}

            {permissions.canReject && (
              <button
                type="button"
                onClick={() => setRejectModalOpen(true)}
                disabled={actionLoading}
                className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                Decline
              </button>
            )}

            {/* Schedule (Home or Donor) */}
            {permissions.canSchedule && (
              <button
                type="button"
                onClick={() => {
                  setScheduledDate(
                    donation.scheduledDate
                      ? new Date(donation.scheduledDate).toISOString().split('T')[0]
                      : ''
                  );
                  setScheduleModalOpen(true);
                }}
                disabled={actionLoading}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                {donation.status === 'SCHEDULED' ? 'Reschedule' : 'Set Delivery Date'}
              </button>
            )}

            {/* Donor Mark Delivered */}
            {permissions.canMarkDelivered && (
              <button
                type="button"
                onClick={handleMarkDelivered}
                disabled={actionLoading}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <Truck className="w-3.5 h-3.5" />
                Mark Items as Delivered
              </button>
            )}

            {/* Home Confirm Receipt & Complete */}
            {permissions.canComplete && (
              <button
                type="button"
                onClick={handleCompleteReceipt}
                disabled={actionLoading}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Confirm Receipt &amp; Complete
              </button>
            )}

            {/* Donor Cancel Request */}
            {permissions.canCancel && (
              <button
                type="button"
                onClick={() => setCancelModalOpen(true)}
                disabled={actionLoading}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-rose-600 hover:border-transparent text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-1.5"
              >
                <Ban className="w-3.5 h-3.5" />
                Cancel Donation
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Status Timeline Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-600" />
              Donation Lifecycle &amp; Timeline
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Current stage: <span className="font-bold text-teal-700">{donation.status}</span>
            </p>
          </div>
          <DonationStatusBadge status={donation.status} size="sm" />
        </div>

        <DonationTimeline
          currentStatus={donation.status}
          statusHistory={donation.statusHistory || []}
        />
      </div>

      {/* 4. Two-Column Detailed Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Donation Item Specifications */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-teal-600" />
              Item Information &amp; Delivery Logistics
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">
                  Item Title
                </span>
                <p className="text-sm font-bold text-slate-800">{donation.itemName}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">
                  Category
                </span>
                <p className="text-sm font-bold text-slate-800">{donation.category}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">
                  Pledged Quantity
                </span>
                <p className="text-sm font-bold text-teal-700">
                  {donation.quantity} {donation.unit}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">
                  Preferred Delivery Date
                </span>
                <p className="text-sm font-bold text-slate-800">
                  {new Date(donation.preferredDeliveryDate).toLocaleDateString()}
                </p>
              </div>

              {donation.scheduledDate && (
                <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 space-y-1 sm:col-span-2">
                  <span className="text-[11px] font-semibold text-purple-700 uppercase">
                    Agreed Scheduled Date
                  </span>
                  <p className="text-sm font-bold text-purple-900">
                    {new Date(donation.scheduledDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            {donation.description && (
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700">Description &amp; Specifications:</span>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  {donation.description}
                </p>
              </div>
            )}

            {/* Message to Home */}
            {donation.message && (
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700">Donor Message:</span>
                <p className="text-xs text-slate-600 leading-relaxed bg-teal-50/50 p-4 rounded-2xl border border-teal-100/60 italic">
                  "{donation.message}"
                </p>
              </div>
            )}

            {/* Delivery Notes */}
            {donation.notes && (
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700">Logistics &amp; Delivery Notes:</span>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  {donation.notes}
                </p>
              </div>
            )}

            {/* Rejection reason if declined */}
            {donation.status === 'REJECTED' && donation.rejectionReason && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
                  Decline Reason from Home
                </span>
                <p className="text-xs italic leading-relaxed">
                  "{donation.rejectionReason}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Destination Old-Age Home & Donor Info */}
        <div className="space-y-6">
          {/* Recipient Old-Age Home Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Recipient Old-Age Home
              </span>
              <Building2 className="w-4 h-4 text-teal-600" />
            </div>

            <div className="space-y-2">
              <h4 className="text-base font-bold text-slate-900">
                {donation.homeId?.name || 'Elderly Home Care'}
              </h4>
              <div className="inline-block">
                <VerificationBadge organization={donation.homeId} size="sm" />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
              {donation.homeId?.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    {donation.homeId.address}, {donation.homeId.city}, {donation.homeId.state} -{' '}
                    {donation.homeId.pincode}
                  </span>
                </div>
              )}

              {donation.homeId?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{donation.homeId.phone}</span>
                </div>
              )}

              {donation.homeId?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{donation.homeId.email}</span>
                </div>
              )}

              {donation.homeId?.responsiblePerson && (
                <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Contact: {donation.homeId.responsiblePerson}</span>
                </div>
              )}
            </div>
          </div>

          {/* Donor Profile Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Contributing Donor
              </span>
              <User className="w-4 h-4 text-teal-600" />
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 font-bold flex items-center justify-center text-sm shadow-xs">
                {donation.donorId?.name?.charAt(0).toUpperCase() || 'D'}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {donation.donorId?.name || 'CareConnect Donor'}
                </h4>
                <p className="text-xs text-slate-500">{donation.donorId?.email}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
              {donation.donorId?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{donation.donorId.phone}</span>
                </div>
              )}

              {donation.donorId?.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{donation.donorId.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ACTION MODALS */}
      {/* ======================================================== */}

      {/* 1. Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center">
                <XCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Decline Donation Request</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Please let the donor know why this donation cannot be accepted (e.g., storage limits, excess supply, specific medical requirements).
            </p>
            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <textarea
                required
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Reason for declining..."
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md"
                >
                  Confirm Decline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Schedule Delivery Modal */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center gap-3 text-purple-600">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Schedule Delivery Date</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Set or confirm the planned delivery/handover date between the donor and old-age home.
            </p>
            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Scheduled Date</label>
                <input
                  type="date"
                  required
                  min={todayStr}
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Logistics / Timing Notes <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={scheduleNotes}
                  onChange={(e) => setScheduleNotes(e.target.value)}
                  placeholder="e.g. Courier drop-off by 2 PM, Ring front office reception"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(false)}
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md"
                >
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Cancel Donation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Cancel Donation Request?</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to cancel this donation? This action is permanent and will notify the recipient old-age home.
            </p>
            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Reason for Cancellation <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Change of plans, unable to procure items..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Keep Request
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md"
                >
                  Yes, Cancel Donation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Edit Details Modal (while PENDING) */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center gap-3 text-teal-700">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 flex items-center justify-center">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Edit Donation Request</h3>
                <p className="text-xs text-slate-500">Update details before the home reviews</p>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Item Title</label>
                <input
                  type="text"
                  required
                  value={editFormData.itemName}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, itemName: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editFormData.quantity}
                    onChange={(e) =>
                      setEditFormData((prev) => ({ ...prev, quantity: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Unit</label>
                  <input
                    type="text"
                    required
                    value={editFormData.unit}
                    onChange={(e) =>
                      setEditFormData((prev) => ({ ...prev, unit: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Preferred Delivery Date</label>
                <input
                  type="date"
                  min={todayStr}
                  required
                  value={editFormData.preferredDeliveryDate}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      preferredDeliveryDate: e.target.value
                    }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Description</label>
                <textarea
                  rows={2}
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Message to Home</label>
                <input
                  type="text"
                  value={editFormData.message}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, message: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Delivery Notes</label>
                <input
                  type="text"
                  value={editFormData.notes}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationDetails;
