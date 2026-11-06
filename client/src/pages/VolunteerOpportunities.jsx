import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import volunteerService from '../services/volunteerService.js';
import VolunteerStatusBadge from '../components/VolunteerStatusBadge.jsx';
import ApplyOpportunityModal from '../components/ApplyOpportunityModal.jsx';
import {
  Search,
  Filter,
  Calendar,
  MapPin,
  Clock,
  Users,
  HeartHandshake,
  Loader2,
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  ArrowRight
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Food and essential-supply distribution',
  'Educational or recreational activities',
  'Event assistance',
  'Companionship and social activities',
  'General support',
  'Other'
];

export const VolunteerOpportunities = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [locationFilter, setLocationFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Selected Opportunity for Application Modal
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [applyModalOpen, setApplyModalOpen] = useState(false);

  useEffect(() => {
    loadOpportunities();
  }, [selectedCategory, dateFilter]);

  const loadOpportunities = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCategory && selectedCategory !== 'All') {
        params.category = selectedCategory;
      }
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      if (locationFilter.trim()) {
        params.location = locationFilter.trim();
      }
      if (dateFilter) {
        params.date = dateFilter;
      }

      const res = await volunteerService.getOpportunities(params);
      setOpportunities(res.data?.opportunities || []);
    } catch (err) {
      showToast(err.customMessage || 'Failed to load volunteer opportunities.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadOpportunities();
  };

  const handleApplyClick = (opp) => {
    if (!isAuthenticated) {
      showToast('Please login or register to apply for volunteer opportunities.', 'info');
      return;
    }
    if (currentUser?.role !== 'volunteer') {
      showToast(`Only volunteers can apply for opportunities. Your current role is '${currentUser?.role}'.`, 'warning');
      return;
    }
    setSelectedOpportunity(opp);
    setApplyModalOpen(true);
  };

  const handleApplicationSuccess = () => {
    loadOpportunities();
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white border-b border-teal-800/20 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-400/20 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-4">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                Community Impact &amp; Volunteerism
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Volunteer Opportunities for Elder Care
              </h1>
              <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
                Offer your warmth, companionship, and professional skills to brighten the lives of senior citizens in verified old-age homes across the community.
              </p>
            </div>

            {currentUser?.role === 'volunteer' && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/volunteer/dashboard"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm shadow-lg shadow-teal-900/40 transition-all"
                >
                  <HeartHandshake className="w-4 h-4" />
                  My Volunteer Dashboard
                </Link>
                <Link
                  to="/volunteer/profile"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/15 transition-all"
                >
                  Manage Profile
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Filters and Search Bar */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 mb-8">
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search text */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search title, skills, description..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
                />
              </div>

              {/* Location filter */}
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  placeholder="Filter by location or city..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
                />
              </div>

              {/* Date Filter */}
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  Filter
                </button>
                {(searchTerm || locationFilter || dateFilter || selectedCategory !== 'All') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setLocationFilter('');
                      setDateFilter('');
                      setSelectedCategory('All');
                    }}
                    className="px-3 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs rounded-xl font-medium transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Category pills */}
            <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1 scrollbar-none">
              <span className="text-xs font-semibold text-slate-500 shrink-0 mr-1">Categories:</span>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-teal-700 text-white font-semibold shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 font-medium'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </form>
        </div>

        {/* Opportunities List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
            <p className="mt-3 text-sm text-slate-500 font-medium">Loading volunteer opportunities...</p>
          </div>
        ) : opportunities.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 mb-4">
              <HeartHandshake className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No Volunteer Opportunities Found</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto mt-1 mb-6">
              {searchTerm || selectedCategory !== 'All' || locationFilter || dateFilter
                ? 'Try broadening your search filters or clearing the date parameter.'
                : 'There are currently no active volunteer opportunities open. Check back soon!'}
            </p>
            {(searchTerm || selectedCategory !== 'All' || locationFilter || dateFilter) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setLocationFilter('');
                  setDateFilter('');
                  setSelectedCategory('All');
                }}
                className="px-4 py-2 bg-teal-600 text-white text-xs font-semibold rounded-xl hover:bg-teal-700 transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {opportunities.map((opp) => {
              const spotsLeft = Math.max(0, (opp.volunteerCapacity || 0) - (opp.volunteersAccepted || 0));
              const isFull = spotsLeft === 0;

              return (
                <div
                  key={opp._id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                >
                  <div>
                    {/* Header */}
                    <div className="p-5 pb-3 border-b border-slate-100">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100">
                          {opp.category}
                        </span>
                        <VolunteerStatusBadge status={opp.status} size="sm" />
                      </div>
                      <h2 className="text-base font-bold text-slate-800 group-hover:text-teal-700 transition-colors line-clamp-2">
                        <Link to={`/volunteer-opportunities/${opp._id}`}>{opp.title}</Link>
                      </h2>
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-700 truncate">
                          {opp.homeId?.name || 'Care Facility'}
                        </span>
                      </div>
                    </div>

                    {/* Details Body */}
                    <div className="p-5 space-y-3 text-xs text-slate-600">
                      <p className="line-clamp-3 text-slate-600 leading-relaxed">
                        {opp.description}
                      </p>

                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span>
                            Event: {new Date(opp.taskDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>

                        {opp.startTime && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            <span>
                              {opp.startTime} {opp.endTime ? `- ${opp.endTime}` : ''}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span className="truncate">{opp.location}</span>
                        </div>
                      </div>

                      {/* Required skills tags */}
                      {opp.requiredSkills && opp.requiredSkills.length > 0 && (
                        <div className="pt-2 flex flex-wrap gap-1">
                          {opp.requiredSkills.slice(0, 3).map((skill, i) => (
                            <span
                              key={i}
                              className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded"
                            >
                              {skill}
                            </span>
                          ))}
                          {opp.requiredSkills.length > 3 && (
                            <span className="text-[10px] text-slate-400 px-1 py-0.5">
                              +{opp.requiredSkills.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                        <Users className="w-3.5 h-3.5 text-teal-600" />
                        <span>
                          {opp.volunteersAccepted || 0} / {opp.volunteerCapacity}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {isFull ? (
                          <span className="text-rose-600 font-medium">Capacity full</span>
                        ) : (
                          <span>{spotsLeft} spot{spotsLeft === 1 ? '' : 's'} left</span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/volunteer-opportunities/${opp._id}`}
                        className="p-2 text-slate-500 hover:text-teal-700 hover:bg-white rounded-lg border border-slate-200/80 text-xs font-medium transition-colors"
                        title="View details"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>

                      <button
                        onClick={() => handleApplyClick(opp)}
                        disabled={isFull || opp.status !== 'OPEN'}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <HeartHandshake className="w-3.5 h-3.5" />
                        Apply Now
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Application Modal */}
      <ApplyOpportunityModal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        opportunity={selectedOpportunity}
        onApplicationSubmitted={handleApplicationSuccess}
      />
    </div>
  );
};

export default VolunteerOpportunities;
