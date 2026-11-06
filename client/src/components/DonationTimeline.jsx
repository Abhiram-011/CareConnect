import React from 'react';
import {
  Clock,
  CheckCircle2,
  Calendar,
  Truck,
  CheckCheck,
  XCircle,
  Ban,
  User,
  Building2,
  ShieldAlert
} from 'lucide-react';

export const DonationTimeline = ({ currentStatus, statusHistory = [] }) => {
  const normalizedStatus = (currentStatus || 'PENDING').toUpperCase();

  // Primary linear steps
  const steps = [
    { key: 'PENDING', label: 'Requested', desc: 'Awaiting home review', icon: Clock },
    { key: 'ACCEPTED', label: 'Accepted', desc: 'Approved by home', icon: CheckCircle2 },
    { key: 'SCHEDULED', label: 'Scheduled', desc: 'Delivery date set', icon: Calendar },
    { key: 'DELIVERED', label: 'Delivered', desc: 'Donor sent items', icon: Truck },
    { key: 'COMPLETED', label: 'Completed', desc: 'Receipt confirmed', icon: CheckCheck }
  ];

  // Helper to determine step completion in normal flow
  const statusRank = {
    PENDING: 1,
    ACCEPTED: 2,
    SCHEDULED: 3,
    DELIVERED: 4,
    COMPLETED: 5
  };

  const isTerminalNegative = ['REJECTED', 'CANCELLED'].includes(normalizedStatus);
  const currentRank = statusRank[normalizedStatus] || 1;

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '' : d.toLocaleString([], {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Visual Progress Bar (For non-terminal or before terminal) */}
      {!isTerminalNegative ? (
        <div className="relative py-4">
          <div className="overflow-hidden">
            <div className="grid grid-cols-5 gap-2 relative">
              {/* Connector line behind steps */}
              <div
                className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0"
                aria-hidden="true"
              >
                <div
                  className="h-full bg-teal-600 transition-all duration-500"
                  style={{
                    width: `${Math.min(100, ((currentRank - 1) / 4) * 100)}%`
                  }}
                />
              </div>

              {steps.map((step, idx) => {
                const stepRank = idx + 1;
                const isPassed = currentRank > stepRank;
                const isCurrent = currentRank === stepRank;
                const Icon = step.icon;

                return (
                  <div key={step.key} className="flex flex-col items-center text-center relative z-10">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                        isPassed
                          ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30 ring-4 ring-white'
                          : isCurrent
                          ? 'bg-teal-600 text-white ring-4 ring-teal-100 shadow-md animate-pulse'
                          : 'bg-slate-100 text-slate-400 border border-slate-200 ring-4 ring-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span
                      className={`mt-2 text-xs font-bold leading-tight ${
                        isCurrent
                          ? 'text-teal-900 font-extrabold'
                          : isPassed
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </span>
                    <span className="text-[10px] text-slate-400 hidden sm:block mt-0.5">
                      {step.desc}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* If REJECTED or CANCELLED banner */
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
            normalizedStatus === 'REJECTED'
              ? 'bg-rose-50/80 border-rose-200 text-rose-900'
              : 'bg-slate-100/90 border-slate-200 text-slate-800'
          }`}
        >
          {normalizedStatus === 'REJECTED' ? (
            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <Ban className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
          )}
          <div>
            <h4 className="text-sm font-bold">
              {normalizedStatus === 'REJECTED'
                ? 'Donation Request Declined'
                : 'Donation Request Cancelled'}
            </h4>
            <p className="text-xs mt-0.5 opacity-90">
              {normalizedStatus === 'REJECTED'
                ? 'The old-age home has reviewed and declined this donation.'
                : 'The donor cancelled this donation request before fulfillment.'}
            </p>
          </div>
        </div>
      )}

      {/* 2. Detailed Audit History Log */}
      <div className="pt-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-teal-600" />
          Activity &amp; Status Log
        </h4>

        {statusHistory && statusHistory.length > 0 ? (
          <div className="space-y-3 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {statusHistory.map((item, idx) => {
              const roleColor =
                item.actorRole === 'home'
                  ? 'bg-blue-100 text-blue-800'
                  : item.actorRole === 'donor'
                  ? 'bg-teal-100 text-teal-800'
                  : 'bg-purple-100 text-purple-800';

              return (
                <div key={item._id || idx} className="relative flex items-start gap-3 pl-7">
                  {/* Timeline dot */}
                  <div className="absolute left-2.5 top-1.5 w-2.5 h-2.5 rounded-full bg-teal-600 ring-4 ring-white" />

                  <div className="flex-1 bg-slate-50 border border-slate-200/70 rounded-xl p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">
                          {item.newStatus}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold uppercase ${roleColor}`}
                        >
                          {item.actorRole || 'system'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {formatDate(item.timestamp)}
                      </span>
                    </div>

                    {item.reason && (
                      <p className="text-slate-600 text-xs italic">
                        "{item.reason}"
                      </p>
                    )}

                    {item.changedBy?.name && (
                      <p className="text-[11px] text-slate-500">
                        By: <span className="font-medium text-slate-700">{item.changedBy.name}</span>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No transition history logged yet.</p>
        )}
      </div>
    </div>
  );
};

export default DonationTimeline;
