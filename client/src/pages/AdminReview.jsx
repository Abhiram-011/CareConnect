import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import organizationService from '../services/organizationService.js';
import VerificationBadge from '../components/VerificationBadge.jsx';
import {
  Building2,
  ShieldCheck,
  XCircle,
  FileCheck2,
  FileText,
  AlertTriangle,
  ArrowLeft,
  Check,
  X,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  User,
  Calendar,
  History,
  Info,
  Loader2
} from 'lucide-react';

export const AdminReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [organization, setOrganization] = useState(null);

  // Verification Checklist State (Section 6)
  const [checklist, setChecklist] = useState({
    organizationDetailsChecked: false,
    registrationInfoChecked: false,
    registrationDocChecked: false,
    addressChecked: false,
    contactChecked: false,
    otherDocsChecked: false
  });

  // Decision Modal States
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('Invalid registration information');
  const [customRejectionText, setCustomRejectionText] = useState('');

  const commonRejectionReasons = [
    'Invalid registration information',
    'Required document missing',
    'Information mismatch',
    'Duplicate organization',
    'Address could not be verified',
    'Document could not be verified',
    'Other reason'
  ];

  const fetchOrganizationDetails = async () => {
    try {
      setLoading(true);
      const res = await organizationService.getAdminVerificationById(id);
      if (res.success && res.data?.organization) {
        const org = res.data.organization;
        setOrganization(org);

        // Preload existing checklist if available
        if (org.checklist) {
          setChecklist({
            organizationDetailsChecked: !!org.checklist.organizationDetailsChecked,
            registrationInfoChecked: !!org.checklist.registrationInfoChecked,
            registrationDocChecked: !!org.checklist.registrationDocChecked,
            addressChecked: !!org.checklist.addressChecked,
            contactChecked: !!org.checklist.contactChecked,
            otherDocsChecked: !!org.checklist.otherDocsChecked
          });
        }
      } else {
        showToast('Verification record not found.', 'error');
        navigate('/admin/dashboard');
      }
    } catch (err) {
      showToast('Failed to load verification record.', 'error');
      navigate('/admin/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizationDetails();
  }, [id]);

  const handleChecklistToggle = (key) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Approve action handler
  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const res = await organizationService.approveVerification(id, {
        checklist,
        notes: adminNotes || 'All organization details and legal registration documents checked and verified.'
      });

      if (res.success) {
        showToast('Organization verified successfully.', 'success');
        setApproveModalOpen(false);
        setAdminNotes('');
        await fetchOrganizationDetails();
      } else {
        showToast(res.message || 'Approval failed.', 'error');
      }
    } catch (err) {
      showToast(err.customMessage || 'Failed to approve verification.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Reject action handler
  const handleReject = async () => {
    const finalReason =
      rejectionReason === 'Other reason'
        ? customRejectionText.trim()
        : rejectionReason;

    if (!finalReason || !finalReason.trim()) {
      showToast('A rejection reason is required before rejecting verification.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const res = await organizationService.rejectVerification(id, {
        rejectionReason: finalReason,
        checklist,
        notes: adminNotes
      });

      if (res.success) {
        showToast('Verification request rejected.', 'info');
        setRejectModalOpen(false);
        setAdminNotes('');
        setCustomRejectionText('');
        await fetchOrganizationDetails();
      } else {
        showToast(res.message || 'Rejection failed.', 'error');
      }
    } catch (err) {
      showToast(err.customMessage || 'Failed to reject verification.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading organization verification details...</p>
      </div>
    );
  }

  if (!organization) return null;

  const hasFlags = organization.duplicateFlags && organization.duplicateFlags.length > 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/dashboard"
            className="p-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors"
            title="Back to Admin Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {organization.name}
              </h1>
              <VerificationBadge organization={organization} size="md" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Verification Request ID: <code className="text-slate-700 font-mono">{organization._id}</code>
            </p>
          </div>
        </div>

        {/* Top Decision Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setRejectModalOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <XCircle className="w-4 h-4" />
            Reject Request
          </button>
          <button
            onClick={() => setApproveModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Approve & Verify
          </button>
        </div>
      </div>

      {/* Duplicate / Suspicious Detection Warning (Section 11) */}
      {hasFlags && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span>⚠️ Requires Manual Review — System Flags Detected</span>
          </div>
          <ul className="list-disc pl-6 space-y-1 text-amber-900 font-medium">
            {organization.duplicateFlags.map((flag, idx) => (
              <li key={idx}>{flag}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Two-Column Grid: Info & Documents on Left, Checklist & Decision on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols wide) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Organization Details Panel */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider text-teal-800 flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Organization Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Organization Name:</span>
                <span className="text-slate-900 font-bold text-sm">{organization.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Organization Type:</span>
                <span className="text-slate-900 font-bold text-sm">{organization.organizationType}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 block font-medium">Address:</span>
                <span className="text-slate-800 font-semibold">{organization.address}, {organization.city}, {organization.state} - {organization.pincode}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Responsible Person:</span>
                <span className="text-slate-800 font-semibold">{organization.responsiblePerson}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Contact Phone:</span>
                <span className="text-slate-800 font-semibold font-mono">{organization.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Official Email:</span>
                <span className="text-slate-800 font-semibold">{organization.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Website:</span>
                <span className="text-slate-800 font-semibold">
                  {organization.website ? (
                    <a href={organization.website} target="_blank" rel="noreferrer" className="text-teal-700 underline flex items-center gap-1">
                      {organization.website} <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    'Not specified'
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Registration Information Panel */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider text-teal-800 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4" /> Registration Authority Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Registration Number:</span>
                <span className="text-slate-900 font-black text-sm font-mono bg-slate-100 px-2 py-0.5 rounded inline-block mt-0.5">
                  {organization.registrationNumber}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Registration Act / Type:</span>
                <span className="text-slate-800 font-semibold">{organization.registrationType || 'Public Trust'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Registration Authority:</span>
                <span className="text-slate-800 font-semibold">{organization.registrationAuthority || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Registration Date:</span>
                <span className="text-slate-800 font-semibold">
                  {organization.registrationDate
                    ? new Date(organization.registrationDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'Not provided'}
                </span>
              </div>
            </div>
          </div>

          {/* Submitted Supporting Documents Panel (Section 6 & 13) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider text-teal-800 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Submitted Documents ({organization.documents?.length || 0})
              </h2>
              <span className="text-xs text-slate-400 font-medium">Secure Administrative Streaming</span>
            </div>

            {(!organization.documents || organization.documents.length === 0) ? (
              <div className="p-4 bg-slate-50 rounded-2xl text-center text-xs text-slate-500 border border-slate-200">
                No supporting documents uploaded with this request.
              </div>
            ) : (
              <div className="space-y-3">
                {organization.documents.map((doc, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{doc.originalName}</p>
                        <p className="text-slate-500 capitalize mt-0.5">
                          Type: <strong className="text-slate-700">{doc.documentType.replace('_', ' ')}</strong> &bull; Size: {Math.round(doc.size / 1024)} KB
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Uploaded: {new Date(doc.uploadedAt).toLocaleDateString('en-US')}
                        </p>
                      </div>
                    </div>

                    <a
                      href={`/api/organizations/admin/document/${doc.fileName}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-600 text-teal-700 hover:bg-teal-600 hover:text-white font-semibold text-xs transition-colors self-start sm:self-auto shrink-0 shadow-2xs"
                    >
                      <span>View Document</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Verification Checklist & History */}
        <div className="space-y-6">
          {/* Verification Checklist Card (Section 6) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider text-teal-800 flex items-center gap-2">
                <Check className="w-4 h-4" /> Verification Checklist
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Mark items as verified during your inspection.
              </p>
            </div>

            <div className="space-y-2.5">
              {[
                { key: 'organizationDetailsChecked', label: 'Organization details checked' },
                { key: 'registrationInfoChecked', label: 'Registration information checked' },
                { key: 'registrationDocChecked', label: 'Registration document checked' },
                { key: 'addressChecked', label: 'Physical address checked' },
                { key: 'contactChecked', label: 'Contact information checked' },
                { key: 'otherDocsChecked', label: 'Other applicable documents checked' }
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer text-xs font-medium text-slate-800 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={checklist[item.key]}
                    onChange={() => handleChecklistToggle(item.key)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <button
                onClick={() => setApproveModalOpen(true)}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Approve & Mark Verified
              </button>
              <button
                onClick={() => setRejectModalOpen(true)}
                className="w-full py-2.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                Reject Verification
              </button>
            </div>
          </div>

          {/* Verification History Log (Section 8) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-3">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider text-teal-800 flex items-center gap-2">
              <History className="w-4 h-4" /> Review History
            </h2>

            {(!organization.verificationHistory || organization.verificationHistory.length === 0) ? (
              <p className="text-xs text-slate-500">No previous reviews recorded.</p>
            ) : (
              <div className="space-y-3">
                {organization.verificationHistory.slice().reverse().map((entry, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded-full ${
                          entry.status === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : entry.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {entry.status}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(entry.reviewedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium">By: {entry.reviewedByName || 'Admin'}</p>
                    {entry.rejectionReason && (
                      <p className="text-rose-700 font-semibold">Reason: {entry.rejectionReason}</p>
                    )}
                    {entry.notes && (
                      <p className="text-slate-500 italic">"{entry.notes}"</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Approve Confirmation Modal */}
      {approveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Check className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Approve Organization</h3>
                <p className="text-xs text-slate-500">{organization.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This will set the verification status to <strong>VERIFIED</strong>. The public badge will state: <em>"Verified by the platform based on submitted information and reviewed documentation."</em>
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Admin Verification Notes (Optional)
              </label>
              <textarea
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="e.g. Trust registration certificate confirmed with charity commissioner database."
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setApproveModalOpen(false)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Confirm Verification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal (Section 7: Mandatory Reason) */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Reject Verification Request</h3>
                <p className="text-xs text-slate-500">{organization.name}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rejection Reason <span className="text-rose-500">* (Required)</span>
                </label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  {commonRejectionReasons.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {rejectionReason === 'Other reason' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Specify Rejection Details <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={customRejectionText}
                    onChange={(e) => setCustomRejectionText(e.target.value)}
                    placeholder="Provide specific details why verification could not be granted..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Additional Internal Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Notes for internal audit log..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReview;
