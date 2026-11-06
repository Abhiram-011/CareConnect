import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import volunteerService from '../services/volunteerService.js';
import VolunteerStatusBadge from '../components/VolunteerStatusBadge.jsx';
import {
  HeartHandshake,
  Activity,
  CheckCircle2,
  Clock,
  Sparkles,
  Inbox,
  Calendar,
  MapPin,
  Loader2,
  ArrowRight,
  Filter,
  Search,
  Undo2,
  Award,
  Users,
  Compass,
  AlertCircle
} from 'lucide-react';

export const VolunteerDashboard = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({
    totalApplications: 0,
    pending: 0,
    accepted: 0,
    completed: 0,
    rejected: 0,
    withdrawn: 0,
    availableOpportunities: 0
  });

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, PENDING, ACCEPTED, COMPLETED
  const [withdrawingId, setWithdrawingId] = useState(null);

  useEffect(() => {
    loadMyApplications();
  }, []);

  const loadMyApplications = async () => {
    setLoading(true);
    try {
      const res = await volunteerService.getMyApplications();
      setApplications(res.data?.applications || []);
      if (res.data?.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      showToast(err.customMessage || 'Failed to load volunteer applications.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (applicationId) => {
    if (!window.confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
      return;
    }
    setWithdrawingId(applicationId);
    try {
      const res = await volunteerService.withdrawApplication(applicationId, {
        notes: 'Withdrawn by volunteer from dashboard.'
      });
      showToast(res.message || 'Application withdrawn successfully.', 'info');
      loadMyApplications();
    } catch (err) {
      showToast(err.customMessage || 'Failed to withdraw application.', 'error');
    } finally {
      setWithdrawingId(null);
    }
  };

  const filteredApplications = applications.filter((app) => {
    if (activeTab === 'ALL') return true;
    return app.status === activeTab;
  });

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Hero Welcome Header */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 text-white py-10 px-4 sm:px-6 lg:px-8 border-b border-teal-800/30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold mb-3 border border-teal-400/20">
              <Sparkles className="w-3.5 h-3.5" />
              Volunteer Portal &bull; Module 4
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {currentUser?.name}!
            </h1>
            <p className="mt-1 text-slate-300 text-xs sm:text-sm">
              Track your service applications, accepted elderly care tasks, and explore new opportunities.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/volunteer-opportunities"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-semibold text-xs sm:text-sm shadow-md shadow-teal-900/40 transition-all"
            >
              <Compass className="w-4 h-4" />
              Browse Opportunities
            </Link>
            <Link
              to="/volunteer/profile"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/15 transition-all"
            >
              My Volunteer Profile
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* Real-time Dashboard KPI Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {/* Stat 1: Available Opportunities */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Available Now
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-slate-800">
                {stats.availableOpportunities}
              </p>
            </div>
          </div>

          {/* Stat 2: Total Applications */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100 shrink-0">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Applications
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-slate-800">
                {stats.totalApplications}
              </p>
            </div>
          </div>

          {/* Stat 3: Pending Review */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Pending
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-slate-800">
                {stats.pending}
              </p>
            </div>
          </div>

          {/* Stat 4: Accepted Tasks */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Accepted
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-slate-800">
                {stats.accepted}
              </p>
            </div>
          </div>

          {/* Stat 5: Completed Activities */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center gap-3.5 col-span-2 sm:col-span-1">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Completed
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-slate-800">
                {stats.completed}
              </p>
            </div>
          </div>
        </div>

        {/* Applications Workspace */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Tab Selector & Controls */}
          <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              {[
                { key: 'ALL', label: 'All Applications', count: stats.totalApplications },
                { key: 'PENDING', label: 'Pending', count: stats.pending },
                { key: 'ACCEPTED', label: 'Accepted Tasks', count: stats.accepted },
                { key: 'COMPLETED', label: 'Completed', count: stats.completed }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`text-xs font-semibold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <Link
              to="/volunteer-opportunities"
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 self-end sm:self-auto"
            >
              Explore more opportunities &rarr;
            </Link>
          </div>

          {/* Applications Content */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
              <p className="mt-3 text-xs text-slate-500 font-medium">Loading your applications...</p>
            </div>
          ) : applications.length === 0 ? (
            /* Empty State for New Volunteers */
            <div className="py-16 px-6 text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-4 border border-teal-100">
                <HeartHandshake className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                You haven't applied for any volunteer activities yet
              </h3>
              <p className="text-xs text-slate-500 mt-2 mb-6 leading-relaxed">
                Senior living homes frequently seek caring volunteers for companionship, storytelling, music sessions, and events assistance. Start making a difference today!
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  to="/volunteer-opportunities"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
                >
                  <Compass className="w-4 h-4" />
                  Browse Open Opportunities
                </Link>
                <Link
                  to="/volunteer/profile"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                >
                  Update Profile &amp; Skills
                </Link>
              </div>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-500">
              No applications match status <span className="font-semibold">"{activeTab}"</span>.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredApplications.map((app) => {
                const opp = app.opportunityId;
                const canWithdraw = app.status === 'PENDING';

                return (
                  <div key={app._id} className="p-5 sm:p-6 hover:bg-slate-50/60 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <VolunteerStatusBadge status={app.status} size="sm" />
                          <span className="text-[11px] text-slate-500 font-medium">
                            Applied on {new Date(app.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                          {opp?.category && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                              {opp.category}
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-slate-800">
                          {opp ? (
                            <Link
                              to={`/volunteer-opportunities/${opp._id}`}
                              className="hover:text-teal-700 transition-colors"
                            >
                              {opp.title}
                            </Link>
                          ) : (
                            <span className="text-slate-500">Opportunity No Longer Available</span>
                          )}
                        </h3>

                        {opp && (
                          <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap pt-1">
                            <span className="flex items-center gap-1 font-medium text-slate-700">
                              <MapPin className="w-3.5 h-3.5 text-teal-600" />
                              {opp.homeId?.name || 'Old-Age Home'} &bull; {opp.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-teal-600" />
                              {new Date(opp.taskDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                            {opp.startTime && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-teal-600" />
                                {opp.startTime}
                              </span>
                            )}
                          </div>
                        )}

                        {app.motivation && (
                          <div className="pt-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <p className="font-semibold text-slate-700 text-[11px] mb-0.5">Your Note to Home:</p>
                            <p className="italic">"{app.motivation}"</p>
                          </div>
                        )}

                        {/* Status history audit notes */}
                        {app.statusHistory && app.statusHistory.length > 1 && (
                          <div className="pt-1 text-[11px] text-slate-400">
                            Latest update: {app.statusHistory[app.statusHistory.length - 1].notes}
                          </div>
                        )}
                      </div>

                      {/* Right Actions */}
                      <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                        {opp && (
                          <Link
                            to={`/volunteer-opportunities/${opp._id}`}
                            className="text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                          >
                            View Details
                          </Link>
                        )}

                        {canWithdraw && (
                          <button
                            onClick={() => handleWithdraw(app._id)}
                            disabled={withdrawingId === app._id}
                            className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {withdrawingId === app._id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Undo2 className="w-3.5 h-3.5" />
                            )}
                            Withdraw Application
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VolunteerDashboard;
