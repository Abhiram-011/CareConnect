import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users,
  Search,
  Calendar,
  Building2,
  Clock,
  RotateCcw,
  Eye,
  X,
  CheckCircle2,
  AlertCircle,
  Undo2,
  MapPin,
  CheckCheck
} from 'lucide-react';
import {
  getVolunteerApplicationsTracking,
  getVolunteerApplicationTrackingById
} from '../services/trackingService.js';
import volunteerService from '../services/volunteerService.js';
import { VolunteerStatusBadge } from '../components/VolunteerStatusBadge.jsx';
import { useToast } from '../context/ToastContext.jsx';

export const VolunteerTracking = () => {
  const { id: paramId } = useParams();
  const { showToast } = useToast();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected application for detailed modal
  const [selectedApp, setSelectedApp] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await getVolunteerApplicationsTracking(params);
      if (res.success) {
        setApplications(res.data.applications || []);
      }
    } catch (err) {
      console.error('Error fetching volunteer tracking applications:', err);
      setError('Unable to load volunteer application tracking data.');
    } finally {
      setLoading(false);
    }
  };

  const openDetails = async (appId) => {
    try {
      const res = await getVolunteerApplicationTrackingById(appId);
      if (res.success) {
        setSelectedApp(res.data.application);
      }
    } catch (err) {
      console.error('Error loading application details:', err);
      showToast('Could not load application details.', 'error');
    }
  };

  const handleWithdraw = async (appId) => {
    if (!window.confirm('Are you sure you want to withdraw this volunteer application?')) {
      return;
    }
    try {
      setWithdrawing(true);
      const res = await volunteerService.withdrawApplication(appId, 'Withdrawn by volunteer');
      if (res.success) {
        showToast('Application withdrawn successfully.', 'info');
        if (selectedApp?._id === appId) {
          setSelectedApp(res.data.application);
        }
        fetchApplications();
      }
    } catch (err) {
      console.error('Withdraw error:', err);
      showToast(err.customMessage || 'Failed to withdraw application.', 'error');
    } finally {
      setWithdrawing(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  useEffect(() => {
    if (paramId) {
      openDetails(paramId);
    }
  }, [paramId]);

  const filteredApps = applications.filter((app) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (app._id && app._id.toLowerCase().includes(term)) ||
      (app.opportunityId?.title && app.opportunityId.title.toLowerCase().includes(term)) ||
      (app.opportunityId?.homeId?.name &&
        app.opportunityId.homeId.name.toLowerCase().includes(term))
    );
  });

  // Timeline helper
  const renderVolunteerTimeline = (currentStatus, statusHistory = []) => {
    const isTerminal = ['REJECTED', 'WITHDRAWN'].includes(currentStatus);
    const steps = [
      { key: 'PENDING', label: 'Applied', desc: 'Application submitted' },
      { key: 'ACCEPTED', label: 'Accepted', desc: 'Welcome aboard' },
      { key: 'COMPLETED', label: 'Completed', desc: 'Service completed' }
    ];

    const getStepStatus = (stepKey) => {
      if (currentStatus === stepKey) return 'current';
      if (currentStatus === 'COMPLETED') return 'completed';
      if (currentStatus === 'ACCEPTED' && stepKey === 'PENDING') return 'completed';
      return 'upcoming';
    };

    return (
      <div className="space-y-4">
        {isTerminal ? (
          <div
            className={`p-4 rounded-xl border flex items-center gap-3 ${
              currentStatus === 'REJECTED'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">
                Application Status: {currentStatus === 'REJECTED' ? 'Declined' : 'Withdrawn'}
              </p>
              <p className="text-xs opacity-80">
                {currentStatus === 'REJECTED'
                  ? 'The care facility could not proceed with this application at this time.'
                  : 'You chose to withdraw this application.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 py-2">
            {steps.map((step, idx) => {
              const state = getStepStatus(step.key);
              return (
                <div key={step.key} className="text-center relative">
                  <div
                    className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      state === 'completed'
                        ? 'bg-teal-600 text-white'
                        : state === 'current'
                        ? 'bg-teal-100 text-teal-800 ring-2 ring-teal-600'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {state === 'completed' ? <CheckCheck className="w-4 h-4" /> : idx + 1}
                  </div>
                  <p className="text-xs font-bold mt-1.5 text-slate-800">{step.label}</p>
                  <p className="text-[11px] text-slate-500">{step.desc}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Status History Trail */}
        {statusHistory.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Status Log
            </h5>
            <div className="space-y-2">
              {statusHistory.map((h, i) => (
                <div key={i} className="text-xs flex items-start justify-between text-slate-600">
                  <span className="font-semibold text-slate-800">&bull; {h.status}</span>
                  <span className="text-slate-400">
                    {h.changedAt ? new Date(h.changedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <Users className="w-8 h-8 text-teal-600" />
              Volunteer Application Tracking
            </h1>
            <p className="mt-1 text-slate-600 text-sm max-w-2xl">
              Track the progress of your volunteer applications from submission through review, acceptance, and service completion.
            </p>
          </div>
          <Link
            to="/volunteer/opportunities"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 shadow-xs transition-colors self-start md:self-auto"
          >
            <Users className="w-4 h-4" />
            Browse New Opportunities
          </Link>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by opportunity title or old-age home name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            >
              <option value="">All Application Statuses</option>
              <option value="PENDING">PENDING (Awaiting Decision)</option>
              <option value="ACCEPTED">ACCEPTED (Ready to Serve)</option>
              <option value="COMPLETED">COMPLETED (Finished)</option>
              <option value="REJECTED">REJECTED (Declined)</option>
              <option value="WITHDRAWN">WITHDRAWN</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl mb-6 text-sm">
          {error}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse h-28"></div>
          ))}
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No Volunteer Applications Found</h3>
          <p className="text-sm text-slate-500 mt-1 mb-5">
            You haven't submitted any applications matching this filter.
          </p>
          <Link
            to="/volunteer/opportunities"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-xs"
          >
            Find Opportunities
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApps.map((app) => (
            <div
              key={app._id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 hover:border-teal-300 hover:shadow-xs transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-slate-400">
                    APP #{app._id.slice(-6).toUpperCase()}
                  </span>
                  <VolunteerStatusBadge status={app.status} size="sm" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {app.opportunityId?.title || 'Volunteer Role'}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-teal-600" />
                    <span>{app.opportunityId?.homeId?.name || 'Care Facility'}</span>
                    {app.opportunityId?.location && (
                      <span className="text-slate-400">&bull; {app.opportunityId.location}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                  <span>
                    Applied on: {new Date(app.createdAt).toLocaleDateString([], { dateStyle: 'medium' })}
                  </span>
                  {app.opportunityId?.startDate && (
                    <span>
                      Service: {new Date(app.opportunityId.startDate).toLocaleDateString([], { dateStyle: 'medium' })}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                {app.status === 'PENDING' && (
                  <button
                    onClick={() => handleWithdraw(app._id)}
                    disabled={withdrawing}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    Withdraw
                  </button>
                )}
                <button
                  onClick={() => openDetails(app._id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  View Status
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-mono font-semibold text-slate-400">
                  APPLICATION #{selectedApp._id.toUpperCase()}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                  {selectedApp.opportunityId?.title || 'Volunteer Role'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-6 space-y-6">
              {/* Timeline */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Application Progress
                </h4>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  {renderVolunteerTimeline(selectedApp.status, selectedApp.statusHistory)}
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Organization</span>
                  <span className="font-semibold text-slate-800 text-sm">
                    {selectedApp.opportunityId?.homeId?.name || 'Registered Home'}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Category</span>
                  <span className="font-semibold text-slate-800 text-sm">
                    {selectedApp.opportunityId?.category || 'Community Care'}
                  </span>
                </div>
              </div>

              {selectedApp.motivation && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <span className="text-slate-400 block mb-0.5">Your Statement of Motivation</span>
                  <p className="text-slate-700 italic">"{selectedApp.motivation}"</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              {selectedApp.status === 'PENDING' ? (
                <button
                  onClick={() => handleWithdraw(selectedApp._id)}
                  disabled={withdrawing}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  Withdraw Application
                </button>
              ) : (
                <div></div>
              )}
              <button
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerTracking;

