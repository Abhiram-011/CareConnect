import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  History,
  Heart,
  Users,
  Building2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';
import { getActivityHistory } from '../services/activityService.js';
import { useAuth } from '../context/AuthContext.jsx';

export const ActivityHistory = () => {
  const { currentUser } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (filterType !== 'ALL') params.type = filterType;
      const res = await getActivityHistory(params);
      if (res.success) {
        setActivities(res.data.activities || []);
      }
    } catch (err) {
      console.error('Error fetching activity history:', err);
      setError('Unable to load your activity history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [filterType]);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'DONATION':
        return <Heart className="w-5 h-5 text-rose-500" />;
      case 'VOLUNTEER':
        return <Users className="w-5 h-5 text-teal-600" />;
      case 'VERIFICATION':
        return <Building2 className="w-5 h-5 text-emerald-600" />;
      case 'REPORT':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default:
        return <Clock className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <History className="w-7 h-7 text-teal-600" />
          My Activity History
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          A comprehensive record of all your donations, applications, and platform interactions over time.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-slate-200 pb-3">
        {['ALL', 'DONATION', 'VOLUNTEER', 'REPORT'].map((type) => {
          const labels = {
            ALL: 'All Activities',
            DONATION: 'Donations',
            VOLUNTEER: 'Volunteering',
            REPORT: 'Reports'
          };
          const active = filterType === type;
          return (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                active
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {labels[type]}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Activity Timeline List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 animate-pulse h-20"></div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <History className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Recorded Activities</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            You don't have any activities recorded under this category yet.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              to="/search/homes"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-xs"
            >
              Explore Old-Age Homes
            </Link>
          </div>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 space-y-6">
          {activities.map((act) => (
            <div key={act.id} className="relative group">
              {/* Timeline Pin */}
              <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center shadow-xs group-hover:border-teal-500 transition-colors">
                <div className="scale-75 sm:scale-90">{getActivityIcon(act.type)}</div>
              </div>

              {/* Activity Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 hover:border-teal-300 hover:shadow-xs transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                  <span className="text-xs font-bold text-slate-900 tracking-tight">
                    {act.title}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(act.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{act.description}</p>

                {act.status && (
                  <div className="mt-2.5 flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      Status: {act.status}
                    </span>
                    {act.link && (
                      <Link
                        to={act.link}
                        className="text-[11px] font-semibold text-teal-700 hover:underline inline-flex items-center gap-1"
                      >
                        View &rarr;
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityHistory;

