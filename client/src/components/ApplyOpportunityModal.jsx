import React, { useState } from 'react';
import { useToast } from '../context/ToastContext.jsx';
import volunteerService from '../services/volunteerService.js';
import {
  X,
  HeartHandshake,
  Send,
  Loader2,
  Calendar,
  MapPin,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const ApplyOpportunityModal = ({ isOpen, onClose, opportunity, onApplicationSubmitted }) => {
  const { showToast } = useToast();
  const [motivation, setMotivation] = useState('');
  const [relevantSkillsInput, setRelevantSkillsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  if (!isOpen || !opportunity) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      const skillsArray = relevantSkillsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await volunteerService.applyForOpportunity(opportunity._id, {
        motivation,
        relevantSkills: skillsArray
      });

      showToast(res.message || 'Application submitted successfully!', 'success');
      if (onApplicationSubmitted) {
        onApplicationSubmitted(res.data?.application);
      }
      onClose();
    } catch (err) {
      setFormError(err.customMessage || 'Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const spotsLeft = Math.max(0, (opportunity.volunteerCapacity || 0) - (opportunity.volunteersAccepted || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Apply for Volunteer Task</h3>
              <p className="text-xs text-teal-100 line-clamp-1">{opportunity.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Opportunity Quick Info Card */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 space-y-2">
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
              <span>
                {opportunity.taskDate ? new Date(opportunity.taskDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                }) : 'Flexible Date'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-teal-600 shrink-0" />
              <span>
                {opportunity.startTime ? `${opportunity.startTime} - ${opportunity.endTime || 'End'}` : 'Time TBD'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 col-span-2">
              <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
              <span className="truncate">{opportunity.location}</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-200/80">
            <span className="flex items-center gap-1 text-slate-700 font-medium">
              <Users className="w-4 h-4 text-teal-600" />
              Required Capacity: {opportunity.volunteerCapacity}
            </span>
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {spotsLeft} spot{spotsLeft === 1 ? '' : 's'} remaining
            </span>
          </div>
        </div>

        {/* Application Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Why would you like to volunteer for this task? (Motivation statement)
            </label>
            <textarea
              rows={3}
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              placeholder="Share a short note on your motivation or what you look forward to contributing..."
              maxLength={1000}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 resize-none transition-all"
            />
            <p className="text-[11px] text-slate-400 text-right mt-1">
              {motivation.length}/1000 characters
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Relevant Skills or Experience (Optional)
            </label>
            <input
              type="text"
              value={relevantSkillsInput}
              onChange={(e) => setRelevantSkillsInput(e.target.value)}
              placeholder="e.g. First Aid, Storytelling, Cooking, Music (comma separated)"
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 rounded-xl shadow-md shadow-teal-600/20 hover:shadow-teal-600/30 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting Application...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Application
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyOpportunityModal;
