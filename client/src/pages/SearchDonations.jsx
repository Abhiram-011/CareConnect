import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Heart,
  MapPin,
  Building2,
  Filter,
  RotateCcw,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Package,
  CheckCircle2
} from 'lucide-react';
import { searchDonations } from '../services/searchService.js';
import { VerificationBadge } from '../components/VerificationBadge.jsx';

export const SearchDonations = () => {
  const [needs, setNeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, limit: 9 });

  const fetchNeeds = async (targetPage = page) => {
    try {
      setLoading(true);
      setError('');
      const params = {
        page: targetPage,
        limit: 9
      };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (categoryFilter) params.category = categoryFilter;
      if (urgencyFilter) params.urgency = urgencyFilter;
      if (cityFilter.trim()) params.city = cityFilter.trim();

      const res = await searchDonations(params);
      if (res.success) {
        setNeeds(res.data.needs || []);
        setPagination(res.data.pagination || { total: 0, pages: 1, limit: 9, page: targetPage });
      }
    } catch (err) {
      console.error('Error fetching donation needs:', err);
      setError('Unable to load donation requirements. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNeeds(1);
  }, [categoryFilter, urgencyFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchNeeds(1);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setUrgencyFilter('');
    setCityFilter('');
    setPage(1);
    setTimeout(() => {
      searchDonations({ page: 1, limit: 9 }).then((res) => {
        if (res.success) {
          setNeeds(res.data.needs || []);
          setPagination(res.data.pagination);
        }
      });
    }, 50);
  };

  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case 'CRITICAL':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'HIGH':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'LOW':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <Heart className="w-8 h-8 text-rose-500" />
              Donation Needs &amp; Opportunities
            </h1>
            <p className="mt-1 text-slate-600 text-sm max-w-2xl">
              Browse real-time essential requirements posted by verified old-age homes and pledge support for groceries, medical supplies, and living necessities.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/donations/create"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-xs transition-colors"
            >
              <Heart className="w-4 h-4" />
              Pledge a Custom Donation
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
                placeholder="Search requirements (e.g. Rice, Blanket, BP monitor)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            {/* City */}
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="City (e.g. Pune, Delhi)..."
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            {/* Category */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              >
                <option value="">All Categories</option>
                <option value="Groceries">Groceries &amp; Food</option>
                <option value="Medicines">Medicines &amp; Healthcare</option>
                <option value="Hygiene">Hygiene &amp; Toiletries</option>
                <option value="Utilities">Utilities &amp; Home Essentials</option>
                <option value="Clothing">Clothing &amp; Bedding</option>
                <option value="Other">Other Necessities</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 border-t border-slate-100">
            {/* Urgency */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Urgency Level
              </label>
              <select
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              >
                <option value="">All Urgency Levels</option>
                <option value="CRITICAL">🔴 Critical Urgency</option>
                <option value="HIGH">🟠 High Urgency</option>
                <option value="MEDIUM">🟡 Medium Urgency</option>
                <option value="LOW">🟢 Standard / Low</option>
              </select>
            </div>

            <div className="sm:col-span-1 lg:col-span-2"></div>

            {/* Action Buttons */}
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="flex-1 py-2 px-4 rounded-xl text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-xs"
              >
                Search Needs
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
      ) : needs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No Open Donation Needs Found</h3>
          <p className="text-sm text-slate-500 mt-1 mb-5">
            There are currently no active requirements matching your filters. You can still make a direct donation pledge to any old-age home!
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Reset Filters
            </button>
            <Link
              to="/donations/create"
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-xs"
            >
              Pledge Donation
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4 text-xs text-slate-500 px-1">
            <span>
              Showing <strong className="text-slate-800">{needs.length}</strong> of{' '}
              <strong className="text-slate-800">{pagination.total}</strong> active donation needs
            </span>
            <span>
              Page <strong className="text-slate-800">{pagination.page}</strong> of{' '}
              <strong className="text-slate-800">{pagination.pages || 1}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {needs.map((need) => {
              const reqQty = Number(need.quantityRequired) || 1;
              const fulQty = Number(need.quantityFulfilled) || 0;
              const percentFulfilled = Math.min(100, Math.round((fulQty / reqQty) * 100));

              return (
                <div
                  key={need._id}
                  className="bg-white rounded-2xl border border-slate-200/80 hover:border-rose-300 hover:shadow-md transition-all flex flex-col overflow-hidden"
                >
                  <div className="p-6 flex-1 flex flex-col">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">
                        {need.category || 'General Donation'}
                      </span>
                      {need.urgency && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getUrgencyBadge(
                            need.urgency
                          )}`}
                        >
                          {need.urgency}
                        </span>
                      )}
                    </div>

                    <h2 className="text-base font-bold text-slate-900 line-clamp-1 mb-1">
                      {need.title}
                    </h2>

                    {/* Organization info */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                      <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span className="font-semibold text-slate-700 truncate">
                        {need.organization?.name || 'Registered Old-Age Home'}
                      </span>
                      {need.organization?.city && (
                        <span className="text-slate-400">({need.organization.city})</span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                      {need.description || 'Essential supplies required for elderly residents.'}
                    </p>

                    {/* Fulfillment Progress */}
                    <div className="mt-auto space-y-1.5 pt-2 border-t border-slate-100">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>
                          Required: {reqQty} {need.unit || 'units'}
                        </span>
                        <span className="text-slate-500">{percentFulfilled}% fulfilled</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-300"
                          style={{ width: `${percentFulfilled}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Card Action */}
                  <div className="bg-slate-50/70 px-6 py-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-500">
                      Remaining:{' '}
                      <strong className="text-slate-800">
                        {Math.max(0, reqQty - fulQty)} {need.unit || 'units'}
                      </strong>
                    </span>

                    <Link
                      to={`/donations/create?homeId=${need.organization?._id || ''}&category=${encodeURIComponent(
                        need.category || ''
                      )}&item=${encodeURIComponent(need.title || '')}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-xs"
                    >
                      <Heart className="w-3.5 h-3.5" />
                      Pledge Item
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setPage(p);
                    fetchNeeds(p);
                  }}
                  className={`w-9 h-9 rounded-xl text-xs font-semibold transition-colors ${
                    p === page
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page >= pagination.pages}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SearchDonations;

