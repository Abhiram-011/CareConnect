import React, { useState } from 'react';
import {
  ShieldCheck,
  Clock,
  XCircle,
  HelpCircle,
  Info
} from 'lucide-react';
import VerificationDetailsModal from './VerificationDetailsModal.jsx';

export const VerificationBadge = ({
  organization,
  showInfoButton = true,
  size = 'md',
  className = ''
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  const status = organization?.verificationStatus || 'UNVERIFIED';

  const getConfig = () => {
    switch (status) {
      case 'VERIFIED':
        return {
          icon: ShieldCheck,
          label: 'Verified',
          tag: '🟢 Verified',
          badgeClass:
            'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
          dotClass: 'bg-emerald-500'
        };
      case 'PENDING':
        return {
          icon: Clock,
          label: 'Verification Pending',
          tag: '🟡 Verification Pending',
          badgeClass:
            'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100',
          dotClass: 'bg-amber-500'
        };
      case 'REJECTED':
        return {
          icon: XCircle,
          label: 'Verification Rejected',
          tag: '🔴 Verification Rejected',
          badgeClass:
            'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100',
          dotClass: 'bg-rose-500'
        };
      case 'UNVERIFIED':
      default:
        return {
          icon: HelpCircle,
          label: 'Unverified',
          tag: '⚪ Unverified',
          badgeClass:
            'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200',
          dotClass: 'bg-slate-400'
        };
    }
  };

  const config = getConfig();
  const IconComponent = config.icon;

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[11px] gap-1'
      : size === 'lg'
      ? 'px-3.5 py-1.5 text-sm gap-2'
      : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setModalOpen(true);
        }}
        className={`inline-flex items-center rounded-full font-semibold border transition-all shadow-2xs cursor-pointer select-none group ${config.badgeClass} ${sizeClasses} ${className}`}
        title="Click to view verification checks & details"
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${config.dotClass}`}></span>
        <span>{config.label}</span>
        {showInfoButton && (
          <Info className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-colors ml-0.5" />
        )}
      </button>

      {modalOpen && (
        <VerificationDetailsModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          organization={organization}
        />
      )}
    </>
  );
};

export default VerificationBadge;
