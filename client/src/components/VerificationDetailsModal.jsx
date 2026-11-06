import React from 'react';
import {
  ShieldCheck,
  Clock,
  XCircle,
  HelpCircle,
  Check,
  X,
  Calendar,
  Building,
  Info
} from 'lucide-react';

export const VerificationDetailsModal = ({ isOpen, onClose, organization }) => {
  if (!isOpen || !organization) return null;

  const status = organization.verificationStatus || 'UNVERIFIED';

  const getStatusConfig = () => {
    switch (status) {
      case 'VERIFIED':
        return {
          icon: ShieldCheck,
          label: 'Verified',
          tag: '🟢 Verified',
          color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
          dotColor: 'bg-emerald-500',
          statement:
            'Verified by the platform based on submitted information and reviewed documentation.'
        };
      case 'PENDING':
        return {
          icon: Clock,
          label: 'Verification Pending',
          tag: '🟡 Verification Pending',
          color: 'text-amber-700 bg-amber-50 border-amber-200',
          dotColor: 'bg-amber-500',
          statement:
            'This organization is currently undergoing verification by platform administrators.'
        };
      case 'REJECTED':
        return {
          icon: XCircle,
          label: 'Verification Rejected',
          tag: '🔴 Verification Rejected',
          color: 'text-rose-700 bg-rose-50 border-rose-200',
          dotColor: 'bg-rose-500',
          statement:
            'Verification was not approved based on reviewed documentation.'
        };
      case 'UNVERIFIED':
      default:
        return {
          icon: HelpCircle,
          label: 'Unverified',
          tag: '⚪ Unverified',
          color: 'text-slate-700 bg-slate-100 border-slate-200',
          dotColor: 'bg-slate-400',
          statement:
            'This organization has not completed platform verification.'
        };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  const checklist = organization.checklist || {};

  const verificationChecks = [
    {
      id: 'orgDetails',
      label: 'Organization details reviewed',
      passed: !!checklist.organizationDetailsChecked || status === 'VERIFIED'
    },
    {
      id: 'regInfo',
      label: 'Registration information reviewed',
      passed: !!checklist.registrationInfoChecked || status === 'VERIFIED'
    },
    {
      id: 'address',
      label: 'Address information reviewed',
      passed: !!checklist.addressChecked || status === 'VERIFIED'
    },
    {
      id: 'docs',
      label: 'Submitted documents reviewed',
      passed: !!checklist.registrationDocChecked || status === 'VERIFIED'
    }
  ];

  const formattedVerifiedDate = organization.verifiedAt
    ? new Date(organization.verifiedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : organization.submittedAt
    ? new Date(organization.submittedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 sm:p-7 relative overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${config.color}`}>
            <StatusIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              Verification Details
            </h3>
            <p className="text-xs text-slate-500 truncate max-w-xs sm:max-w-sm">
              {organization.name}
            </p>
          </div>
        </div>

        {/* Current Status Badge */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Verification Status
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${config.color}`}>
              <span className={`w-2 h-2 rounded-full ${config.dotColor}`}></span>
              {config.label}
            </span>
          </div>
          <p className="text-xs text-slate-700 font-medium leading-relaxed">
            {config.statement}
          </p>
        </div>

        {/* Verification Checks List */}
        <div className="mb-5">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
            Platform Verification Checks
          </h4>
          <div className="space-y-2">
            {verificationChecks.map((check) => (
              <div
                key={check.id}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-white hover:bg-slate-50/50 text-xs transition-colors"
              >
                <span className="font-medium text-slate-700">{check.label}</span>
                {check.passed ? (
                  <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                    <Check className="w-3.5 h-3.5" /> Checked
                  </span>
                ) : (
                  <span className="text-slate-400 font-normal">Pending</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Metadata */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 mb-5">
          {organization.registrationNumber && (
            <div className="flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <span>Reg: <strong className="text-slate-700">{organization.registrationNumber}</strong></span>
            </div>
          )}
          {formattedVerifiedDate && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {status === 'VERIFIED' ? 'Verified on:' : 'Submitted:'}{' '}
                <strong className="text-slate-700">{formattedVerifiedDate}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Safe Platform Trust Notice (Section 1 & 10) */}
        <div className="p-3 bg-teal-50/80 border border-teal-200/80 rounded-2xl flex items-start gap-2.5 text-[11px] text-teal-950 leading-relaxed">
          <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
          <p>
            CareConnect validates submitted documentation and registration authorities. Platform verification reflects administrative document review rather than an absolute endorsement.
          </p>
        </div>

        {/* Action Button */}
        <div className="mt-5 text-right">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationDetailsModal;
