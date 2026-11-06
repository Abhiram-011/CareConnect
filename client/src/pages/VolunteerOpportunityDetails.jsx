import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import volunteerService from '../services/volunteerService.js';
import VolunteerStatusBadge from '../components/VolunteerStatusBadge.jsx';
import ApplyOpportunityModal from '../components/ApplyOpportunityModal.jsx';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Building2,
  Phone,
  Mail,
  HeartHandshake,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  Share2
} from 'lucide-react';

export const VolunteerOpportunityDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [opportunity, setOpportunity] = useState(null);
  const [userApplication, setUserApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applyModalOpen, setApplyModalOpen] = useState(false);

  useEffect(() => {
    loadOpportunity();
  }, [id]);

  const loadOpportunity = async () => {
    setLoading(true);
    try {
      const res = await volunteerService.getOpportunityById(id);
      setOpportunity(res.data?.opportunity);
      setUserApplication(res.data?.userApplication);
    } catch (err) {
      showToast(err.customMessage || 'Failed to fetch opportunity details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationSuccess = (newApp) => {
    setUserApplication(newApp);
    loadOpportunity();
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        <p className="mt-3 text-sm text-slate-500 font-medium">Loading opportunity details...</p>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="max-w-2xl mx-auto my-16 px-4 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Opportunity Not Found</h2>
        <p className="text-slate-500 text-sm mt-2 mb-6">
          The volunteer opportunity you are looking for does not exist or may have been removed.
        </p>
        <Link
          to="/volunteer-opportunities"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Browse Open Opportunities
        </Link>
      </div>
    );
  }

  const spotsLeft = Math.max(0, (opportunity.volunteerCapacity || 0) - (opportunity.volunteersAccepted || 0));
  const isExpired = new Date() > new Date(opportunity.applicationDeadline);
  const isFull = spotsLeft === 0;
  const isClosedOrCancelled = opportunity.status !== 'OPEN';

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Top Banner Navigation */}
      <div className="bg-white border-b border-slate-200/80 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            to="/volunteer-opportunities"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-teal-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Opportunities
          </Link>
          <div className="flex items-center gap-2">
            <VolunteerStatusBadge status={opportunity.status} size="md" />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Closed or Cancelled Banner Alert */}
        {isClosedOrCancelled && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-800 text-xs sm:text-sm">
            <Info className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-semibold">
                This opportunity is {opportunity.status.toLowerCase()}.
              </p>
              <p className="text-amber-700 mt-0.5">
                New applications are no longer accepted for this activity. You can explore other open volunteer opportunities.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Details (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
              <span className="inline-block text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-100 mb-3">
                {opportunity.category}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                {opportunity.title}
              </h1>

              {/* Host Home header */}
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700 font-bold border border-teal-100">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    {opportunity.homeId?.name || 'Verified Old-Age Home'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {opportunity.homeId?.city ? `${opportunity.homeId.city}, ${opportunity.homeId.state}` : 'Local Senior Home'}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
                  About the Opportunity
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {opportunity.description}
                </p>
              </div>

              {/* Required Skills */}
              {opportunity.requiredSkills && opportunity.requiredSkills.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
                    Skills &amp; Qualifications
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {opportunity.requiredSkills.map((skill, i) => (
                      <span
                        key={i}
                        className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl font-medium border border-slate-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Instructions */}
              {opportunity.instructions && (
                <div className="mt-6 pt-6 border-t border-slate-100 bg-teal-50/50 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 p-6 sm:p-8 rounded-b-2xl border-t border-teal-100/60">
                  <h3 className="text-xs font-bold text-teal-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-teal-700" />
                    Special Instructions for Volunteers
                  </h3>
                  <p className="text-xs sm:text-sm text-teal-800 leading-relaxed">
                    {opportunity.instructions}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Key Logistics & Action (1 col) */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">
                Logistics &amp; Timing
              </h3>

              <div className="space-y-3.5 text-xs sm:text-sm">
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Task Date</p>
                    <p className="font-semibold text-slate-800">
                      {new Date(opportunity.taskDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Time Window</p>
                    <p className="font-semibold text-slate-800">
                      {opportunity.startTime ? `${opportunity.startTime} - ${opportunity.endTime || 'End'}` : 'To be coordinated'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Venue Location</p>
                    <p className="font-semibold text-slate-800">{opportunity.location}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Capacity &amp; Spots</p>
                    <p className="font-semibold text-slate-800">
                      {opportunity.volunteersAccepted || 0} accepted of {opportunity.volunteerCapacity} required
                    </p>
                    <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
                      {spotsLeft} spot{spotsLeft === 1 ? '' : 's'} remaining
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2 border-t border-slate-100">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Application Deadline</p>
                    <p className={`font-semibold ${isExpired ? 'text-rose-600' : 'text-slate-800'}`}>
                      {new Date(opportunity.applicationDeadline).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                      {isExpired && ' (Expired)'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button Section */}
              <div className="pt-4 border-t border-slate-100">
                {userApplication ? (
                  <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl text-center space-y-2">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-teal-800">
                      <CheckCircle2 className="w-4 h-4 text-teal-600" />
                      Application Submitted
                    </div>
                    <div className="inline-block">
                      <VolunteerStatusBadge status={userApplication.status} size="sm" />
                    </div>
                    <p className="text-[11px] text-slate-600">
                      You applied on{' '}
                      {new Date(userApplication.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                    <Link
                      to="/volunteer/dashboard"
                      className="block text-xs font-semibold text-teal-700 hover:underline pt-1"
                    >
                      Track status in Volunteer Dashboard &rarr;
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        showToast('Please log in to apply.', 'info');
                        navigate('/login');
                        return;
                      }
                      if (currentUser?.role !== 'volunteer') {
                        showToast(`Only volunteers can apply. Your role is '${currentUser?.role}'.`, 'warning');
                        return;
                      }
                      setApplyModalOpen(true);
                    }}
                    disabled={isClosedOrCancelled || isExpired || isFull}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 rounded-xl shadow-md shadow-teal-600/20 hover:shadow-teal-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <HeartHandshake className="w-4 h-4" />
                    {isClosedOrCancelled
                      ? 'Opportunity Closed'
                      : isExpired
                      ? 'Deadline Passed'
                      : isFull
                      ? 'Capacity Full'
                      : 'Apply to Volunteer'}
                  </button>
                )}
              </div>
            </div>

            {/* Old-Age Home Information Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                About the Host Organization
              </h3>
              <p className="text-xs font-semibold text-slate-800">
                {opportunity.homeId?.name}
              </p>
              {opportunity.homeId?.address && (
                <p className="text-xs text-slate-500">
                  {opportunity.homeId.address}, {opportunity.homeId.city}
                </p>
              )}
              {opportunity.homeId?.phone && (
                <div className="flex items-center gap-2 text-xs text-slate-600 pt-1">
                  <Phone className="w-3.5 h-3.5 text-teal-600" />
                  <span>{opportunity.homeId.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ApplyOpportunityModal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        opportunity={opportunity}
        onApplicationSubmitted={handleApplicationSuccess}
      />
    </div>
  );
};

export default VolunteerOpportunityDetails;
