import React, { useState } from 'react';
import { useToast } from '../context/ToastContext.jsx';
import reportService from '../services/reportService.js';
import {
  X,
  AlertTriangle,
  Flag,
  ShieldAlert,
  Loader2,
  CheckCircle2
} from 'lucide-react';

const REPORT_CATEGORIES = {
  home: [
    'Unverified or False Legal Documents',
    'Suspicious Old-Age Home Operations',
    'Misleading Information',
    'Elder Neglect or Mistreatment Allegation',
    'Other'
  ],
  donation: [
    'Misleading Donation Request',
    'Fraudulent Supplies',
    'Fake Delivery Confirmation',
    'Inappropriate Content',
    'Other'
  ],
  user: [
    'Suspicious User Account',
    'Impersonation or Fake Identity',
    'Harassment or Abuse',
    'Spam or Fraudulent Behaviour',
    'Other'
  ],
  volunteer: [
    'Inappropriate Volunteer Activity',
    'No-show or Misconduct',
    'Safety Concern',
    'Other'
  ],
  opportunity: [
    'Misleading Opportunity Details',
    'Unsafe Volunteer Environment',
    'Commercial Activity Masked as Volunteer Work',
    'Other'
  ]
};

export const ReportModal = ({
  isOpen,
  onClose,
  reportedEntityId,
  reportedEntityType = 'home',
  entityName = ''
}) => {
  const { showToast } = useToast();

  const categories = REPORT_CATEGORIES[reportedEntityType] || REPORT_CATEGORIES.home;

  const [category, setCategory] = useState(categories[0]);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      showToast('Please provide details for the report.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await reportService.submitReport({
        reportedEntityId,
        reportedEntityType,
        category,
        description: description.trim()
      });

      if (res.success) {
        setSubmitted(true);
        showToast('Report submitted. CareConnect administration will investigate.', 'success');
        setTimeout(() => {
          setSubmitted(false);
          setDescription('');
          onClose();
        }, 1500);
      }
    } catch (err) {
      showToast(err.customMessage || 'Failed to submit report. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Report to Administration</h3>
            <p className="text-xs text-slate-500">
              Confidential moderation for {reportedEntityType}: <span className="font-semibold text-slate-700">{entityName || reportedEntityId}</span>
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Thank you for helping keep CareConnect safe.</h4>
            <p className="text-xs text-slate-500">
              Our administrative trust and moderation team has logged your report and will review the entity.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reason / Report Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description of Suspicious Activity <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe what you observed, including any specific discrepancies or concerns..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                maxLength={2000}
                required
              />
              <span className="text-[11px] text-slate-400">Max 2,000 characters. Reports are reviewed by human administrators.</span>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                CareConnect enforces strict zero-tolerance for fraud, mistreatment, or misrepresentation. Malicious or abusive false reports may result in account penalties.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <Flag className="w-3.5 h-3.5" /> Submit Report
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReportModal;

