import React from 'react';
import {
  Clock,
  CheckCircle,
  Calendar,
  Truck,
  CheckCheck,
  XCircle,
  Ban,
  HelpCircle
} from 'lucide-react';

export const DonationStatusBadge = ({ status, size = 'md', showIcon = true }) => {
  const normalized = (status || 'PENDING').toUpperCase();

  const configs = {
    PENDING: {
      label: 'Pending Review',
      icon: Clock,
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      dot: 'bg-amber-500'
    },
    ACCEPTED: {
      label: 'Accepted',
      icon: CheckCircle,
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      dot: 'bg-blue-500'
    },
    SCHEDULED: {
      label: 'Scheduled',
      icon: Calendar,
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
      dot: 'bg-purple-500'
    },
    DELIVERED: {
      label: 'Delivered',
      icon: Truck,
      bg: 'bg-teal-50',
      text: 'text-teal-700',
      border: 'border-teal-200',
      dot: 'bg-teal-500'
    },
    COMPLETED: {
      label: 'Completed',
      icon: CheckCheck,
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500'
    },
    REJECTED: {
      label: 'Declined',
      icon: XCircle,
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      dot: 'bg-rose-500'
    },
    CANCELLED: {
      label: 'Cancelled',
      icon: Ban,
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      border: 'border-slate-200',
      dot: 'bg-slate-400'
    }
  };

  const config = configs[normalized] || {
    label: normalized,
    icon: HelpCircle,
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400'
  };

  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ${config.bg} ${config.text} ${config.border} ${sizeClasses[size] || sizeClasses.md}`}
    >
      {showIcon && <Icon className={iconSizes[size] || iconSizes.md} />}
      <span>{config.label}</span>
    </span>
  );
};

export default DonationStatusBadge;
