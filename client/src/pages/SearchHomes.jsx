import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  MapPin,
  Building2,
  Phone,
  Mail,
  Filter,
  RotateCcw,
  ShieldCheck,
  Heart,
  Users,
  ChevronLeft,
  ChevronRight,
  Eye,
  X
} from 'lucide-react';
import { searchHomes } from '../services/searchService.js';
import { VerificationBadge } from '../components/VerificationBadge.jsx';

export const SearchHomes = () => {
  const [homes, setHomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters & Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');
  const [facilityFilter, setFacilityFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, limit: 9 });

  // Selected home for details modal
  const [selectedHome, setSelectedHome] = useState(null);

  const fetchHomes = async (targetPage = page) => {
    try {
      setLoading(true);
      setError('');
      const params = {
        page: targetPage,
        limit: 9,
        sortBy
      };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (cityFilter.trim()) params.city = cityFilter.trim();
      if (stateFilter.trim()) params.state = stateFilter.trim();
      if (verificationFilter) params.verificationStatus = verificationFilter;
      if (facilityFilter.trim()) params.facility = facilityFilter.trim();

      const res = await searchHomes(params);
      if (res.success) {
        setHomes(res.data.homes || []);
        setPagination(res.data.pagination || { total: 0, pages: 1, limit: 9, page: targetPage });
      }
    } catch (err) {
      console.error('Error fetching homes:', err);
      setError('Unable to load old-age homes. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomes(1);
  }, [verificationFilter, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchHomes(1);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setCityFilter('');
    setStateFilter('');
    setVerificationFilter('');
    setFacilityFilter('');
    setSortBy('newest');
    setPage(1);
    setTimeout(() => {
      searchHomes({ page: 1, limit: 9, sortBy: 'newest' }).then((res) => {
        if (res.success) {
          setHomes(res.data.homes || []);
          setPagination(res.data.pagination);
        }
      });
    }, 50);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPage(newPage);
      fetchHomes(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <Building2 className="w-8 h-8 text-teal-600" />
              Find Old-Age Homes
            </h1>
            <p className="mt-1 text-slate-600 text-sm max-w-2xl">
              Explore registered elderly care facilities, verify their certification status, and extend your heartfelt support through donations and volunteering.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/search/donations"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
            >
              <Heart className="w-4 h-4 text-rose-500" />
              Browse Donation Needs
            </Link>
            <Link
              to="/volunteer/opportunities"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 shadow-xs transition-colors"
            >
              <Users className="w-4 h-4" />
              Volunteer Opportunities
            </Link>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs mb-8">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative md:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by home or organization name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            {/* City */}
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="City (e.g. Pune, Mumbai)..."
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            {/* State */}
            <div>
              <input
                type="text"
                placeholder="State (e.g. Maharashtra)..."
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 border-t border-slate-100">
            {/* Verification Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Verification Status
              </label>
              <select
                value={verificationFilter}
                onChange={(e) => setVerificationFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              >
                <option value="">All Verification Statuses</option>
                <option value="VERIFIED">🟢 Verified Care Homes</option>
                <option value="PENDING">🟡 Verification Pending</option>
                <option value="UNDER_REVIEW">🔵 Under Review</option>
              </select>
            </div>

            {/* Facilities / Care Types */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Facility / Care Type
              </label>
              <input
                type="text"
                placeholder="e.g. Medical, Dementia, Nursing"
                value={facilityFilter}
                onChange={(e) => setFacilityFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              >
                <option value="newest">Newest Registration</option>
                <option value="name_asc">Name (A &rarr; Z)</option>
                <option value="name_desc">Name (Z &rarr; A)</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="flex-1 py-2 px-4 rounded-xl text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-xs"
              >
                Apply Filters
              </button>
              <button
                type="button"
                onClick={handleResetFilters}
                title="Reset filters"
                className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Results Section */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl mb-6 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 animate-pulse space-y-4"
            >
              <div className="h-6 bg-slate-200 rounded w-2/3"></div>
              <div className="h-4 bg-slate-100 rounded w-1/2"></div>
              <div className="h-16 bg-slate-100 rounded"></div>
              <div className="h-8 bg-slate-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : homes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No Old-Age Homes Found</h3>
          <p className="text-sm text-slate-500 mt-1 mb-5">
            We couldn't find any care homes matching your current filter criteria.
          </p>
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-xs"
          >
            <RotateCcw className="w-4 h-4" />
            Clear All Filters
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4 text-xs text-slate-500 px-1">
            <span>
              Showing <strong className="text-slate-800">{homes.length}</strong> of{' '}
              <strong className="text-slate-800">{pagination.total}</strong> registered organizations
            </span>
            <span>
              Page <strong className="text-slate-800">{pagination.page}</strong> of{' '}
              <strong className="text-slate-800">{pagination.pages || 1}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {homes.map((home) => (
              <div
                key={home._id}
                className="bg-white rounded-2xl border border-slate-200/80 hover:border-teal-300 hover:shadow-md transition-all flex flex-col overflow-hidden"
              >
                <div className="p-6 flex-1 flex flex-col">
                  {/* Top Header: Badge & Status */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <h2 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-1">
                        {home.name}
                      </h2>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span className="truncate">
                          {[home.city, home.state].filter(Boolean).join(', ') || 'Location on file'}
                        </span>
                      </div>
                    </div>
                    <VerificationBadge organization={home} showInfoButton={false} size="sm" />
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                    {home.description ||
                      'Dedicated to providing compassionate care, security, and a supportive community for senior citizens.'}
                  </p>

                  {/* Facilities / Care Types */}
                  {home.careTypes && home.careTypes.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1.5">
                        {home.careTypes.slice(0, 3).map((type, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700"
                          >
                            {type}
                          </span>
                        ))}
                        {home.careTypes.length > 3 && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-50 text-slate-500">
                            +{home.careTypes.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Public Contact Details */}
                  <div className="mt-auto pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                    {home.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{home.phone}</span>
                      </div>
                    )}
                    {home.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{home.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="bg-slate-50/70 px-6 py-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedHome(home)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-teal-700 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Details
                  </button>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/donations/create?homeId=${home._id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                    >
                      <Heart className="w-3.5 h-3.5" />
                      Donate
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.pages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`w-9 h-9 rounded-xl text-xs font-semibold transition-colors ${
                    p === page
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= pagination.pages}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Details Modal */}
      {selectedHome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-extrabold text-slate-900">{selectedHome.name}</h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" />
                  <span>
                    {[selectedHome.address, selectedHome.city, selectedHome.state, selectedHome.pincode]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedHome(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {/* Verification & Trust */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-semibold text-slate-700">Official Certification</span>
                <VerificationBadge organization={selectedHome} showInfoButton={false} size="sm" />
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  About the Facility
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {selectedHome.description ||
                    'Dedicated to elderly care, resident well-being, nutritious food, and secure accommodation.'}
                </p>
              </div>

              {/* Care Types & Facilities */}
              {selectedHome.careTypes && selectedHome.careTypes.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Care Types &amp; Facilities
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedHome.careTypes.map((type, idx) => (
                      <span
                        key={idx}
                        className="text-xs font-medium px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-100"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Public Contact Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block mb-0.5">Phone Number</span>
                    <span className="font-semibold text-slate-800">{selectedHome.phone || 'N/A'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block mb-0.5">Email Address</span>
                    <span className="font-semibold text-slate-800">{selectedHome.email || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedHome(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
              <Link
                to={`/donations/create?homeId=${selectedHome._id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-xs"
              >
                <Heart className="w-3.5 h-3.5" />
                Pledge Donation
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchHomes;

