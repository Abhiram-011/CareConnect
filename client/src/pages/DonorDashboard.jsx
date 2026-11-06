import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import organizationService from '../services/organizationService.js';
import requirementService from '../services/requirementService.js';
import donationService from '../services/donationService.js';
import VerificationBadge from '../components/VerificationBadge.jsx';
import DonationStatusBadge from '../components/DonationStatusBadge.jsx';
import CreateDonationModal from '../components/CreateDonationModal.jsx';
import {
  Heart,
  Activity,
  CheckCircle2,
  PackageCheck,
  Search,
  MapPin,
  ShieldCheck,
  Sparkles,
  Home as HomeIcon,
  Clock,
  Inbox,
  Package,
  Flame,
  Loader2,
  Calendar,
  Plus,
  ExternalLink,
  Filter,
  CheckCheck,
  Truck,
  Ban,
  ArrowRight
} from 'lucide-react';

export const DonorDashboard = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  // Search & Browse state for old-age homes
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [cityFilter, setCityFilter] = useState('');

  // Live data states
  const [organizations, setOrganizations] = useState([]);
  const [publicRequirements, setPublicRequirements] = useState([]);
  const [loadingHomes, setLoadingHomes] = useState(true);
  const [loadingReqs, setLoadingReqs] = useState(true);

  // Active view tab: 'donations' vs 'homes' vs 'requirements'
  const [mainTab, setMainTab] = useState('donations');
  const [browseTab, setBrowseTab] = useState('homes');

  // Donation Management State (Module 3)
  const [donations, setDonations] = useState([]);
  const [donationStats, setDonationStats] = useState({
    total: 0,
    pending: 0,
    acceptedOrScheduled: 0,
    delivered: 0,
    completed: 0,
    rejected: 0,
    cancelled: 0
  });
  const [loadingDonations, setLoadingDonations] = useState(true);
  const [donationStatusFilter, setDonationStatusFilter] = useState('ALL');
  const [donationSearch, setDonationSearch] = useState('');
  const [donationPage, setDonationPage] = useState(1);
  const [donationPagination, setDonationPagination] = useState({
    totalRecords: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10
  });

  // Create Donation Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [preselectedHomeId, setPreselectedHomeId] = useState('');

  // Categories
  const categories = [
    'All',
    'Groceries & Food',
    'Medical & Healthcare',
    'Hygiene & Sanitation',
    'Bedding & Clothing',
    'Mobility & Assistive Devices',
    'Facility & Maintenance',
    'Recreational & Educational',
    'Other'
  ];

  // Fetch verified organizations and open requirements on mount
  useEffect(() => {
    loadOrganizationsAndReqs();
    loadDonorDonations();
  }, []);

  // Reload donations when status filter or page changes
  useEffect(() => {
    loadDonorDonations();
  }, [donationStatusFilter, donationPage]);

  const loadOrganizationsAndReqs = async () => {
    try {
      setLoadingHomes(true);
      const orgRes = await organizationService.getPublicOrganizations();
      if (orgRes.success && orgRes.data?.organizations) {
        setOrganizations(orgRes.data.organizations);
      }
    } catch (err) {
      console.error('Failed to load verified organizations:', err);
    } finally {
      setLoadingHomes(false);
    }

    try {
      setLoadingReqs(true);
      const reqRes = await requirementService.getPublicRequirements();
      if (reqRes.success && reqRes.data?.requirements) {
        setPublicRequirements(reqRes.data.requirements);
      }
    } catch (err) {
      console.error('Failed to load public requirements:', err);
    } finally {
      setLoadingReqs(false);
    }
  };

  const loadDonorDonations = async () => {
    try {
      setLoadingDonations(true);
      const params = {
        page: donationPage,
        limit: 10
      };
      if (donationStatusFilter !== 'ALL') {
        params.status = donationStatusFilter;
      }
      if (donationSearch && donationSearch.trim()) {
        params.search = donationSearch.trim();
      }

      const res = await donationService.getMyDonations(params);
      if (res.success && res.data) {
        setDonations(res.data.donations || []);
        if (res.data.stats) {
          setDonationStats(res.data.stats);
        }
        if (res.data.pagination) {
          setDonationPagination(res.data.pagination);
        }
      }
    } catch (err) {
      console.error('Failed to load donor donations:', err);
    } finally {
      setLoadingDonations(false);
    }
  };

  const handleSearchDonations = (e) => {
    e.preventDefault();
    setDonationPage(1);
    loadDonorDonations();
  };

  // Open create donation modal with an optional preselected home
  const handleOpenCreateDonation = (homeId = '') => {
    setPreselectedHomeId(homeId);
    setCreateModalOpen(true);
  };

  const handleDonationCreatedSuccess = () => {
    loadDonorDonations();
  };

  // Filter homes
  const filteredHomes = organizations.filter((home) => {
    const matchesSearch =
      home.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (home.description && home.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCity = !cityFilter || (home.city && home.city.toLowerCase().includes(cityFilter.toLowerCase()));
    return matchesSearch && matchesCity;
  });

  // Filter requirements
  const filteredRequirements = publicRequirements.filter((req) => {
    const matchesSearch =
      req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.description && req.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = selectedFilter === 'All' || req.category === selectedFilter;
    const matchesCity =
      !cityFilter || (req.organization?.city && req.organization.city.toLowerCase().includes(cityFilter.toLowerCase()));
    return matchesSearch && matchesCat && matchesCity;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Welcome Section Header */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-teal-900/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-teal-100 text-xs font-semibold tracking-wide border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-teal-200" />
              Verified Donor Portal
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Welcome back, {currentUser?.name || 'Valued Donor'}!
            </h1>
            <p className="text-teal-100/90 text-sm sm:text-base max-w-2xl">
              Support senior living communities with nutritious groceries, medicines, and daily supplies. Track every pledge from submission to delivery confirmation.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3.5 self-start md:self-auto">
            <div className="w-12 h-12 rounded-xl bg-white text-teal-800 font-bold flex items-center justify-center text-lg shadow-sm">
              {currentUser?.name?.charAt(0).toUpperCase() || 'D'}
            </div>
            <div>
              <p className="text-sm font-bold text-white">{currentUser?.name}</p>
              <p className="text-xs text-teal-200">{currentUser?.email}</p>
              <button
                type="button"
                onClick={() => handleOpenCreateDonation()}
                className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white text-teal-800 font-bold text-xs shadow-xs hover:bg-teal-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                New Donation
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Real-Time Database Statistics Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Donation Overview</h2>
            <p className="text-xs text-slate-500">
              Live metrics calculated directly from verified database records
            </p>
          </div>
          <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full">
            Live Synchronized
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Donations */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Donations
              </span>
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Heart className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{donationStats.total}</span>
              <span className="text-xs text-slate-400 font-medium">Pledges</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Lifetime Contributions</span>
              <span className="text-teal-700 font-semibold">{donationStats.total} total</span>
            </div>
          </div>

          {/* Card 2: Pending Review */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Pending Review
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{donationStats.pending}</span>
              <span className="text-xs text-slate-400 font-medium">Awaiting</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Under home review</span>
              <span className="text-amber-700 font-semibold">{donationStats.pending} pending</span>
            </div>
          </div>

          {/* Card 3: Accepted / Scheduled */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Accepted &amp; Scheduled
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {donationStats.acceptedOrScheduled}
              </span>
              <span className="text-xs text-slate-400 font-medium">In Transit</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Ready for delivery</span>
              <span className="text-blue-700 font-semibold">
                {donationStats.acceptedOrScheduled} active
              </span>
            </div>
          </div>

          {/* Card 4: Completed Donations */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Completed
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {donationStats.completed}
              </span>
              <span className="text-xs text-slate-400 font-medium">Confirmed</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Receipt verified</span>
              <span className="text-emerald-700 font-semibold">
                {donationStats.completed} verified
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs: 'My Donations' vs 'Browse Homes & Needs' */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-1">
        <button
          onClick={() => setMainTab('donations')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all ${
            mainTab === 'donations'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Heart className="w-4 h-4" />
          My Donations
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              mainTab === 'donations' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {donationStats.total}
          </span>
        </button>

        <button
          onClick={() => setMainTab('browse')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all ${
            mainTab === 'browse'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <HomeIcon className="w-4 h-4" />
          Browse Elderly Care Homes &amp; Needs
        </button>
      </div>

      {/* ======================================================== */}
      {/* SECTION A: DONATION MANAGEMENT (Module 3) */}
      {/* ======================================================== */}
      {mainTab === 'donations' && (
        <div className="space-y-6">
          {/* Top Bar with Filters and Create Button */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <Package className="w-6 h-6 text-teal-600" />
                  Donation Management
                </h2>
                <p className="text-slate-600 text-sm mt-0.5">
                  Track your pledged supplies, review home confirmations, and manage delivery schedules.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleOpenCreateDonation()}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition-all self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                Create Donation
              </button>
            </div>

            {/* Filter and Search Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 border-t border-slate-100">
              {/* Status Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none text-xs">
                {[
                  { key: 'ALL', label: 'All Requests' },
                  { key: 'PENDING', label: 'Pending Review' },
                  { key: 'ACCEPTED_OR_SCHEDULED', label: 'Accepted / Scheduled' },
                  { key: 'DELIVERED', label: 'Delivered' },
                  { key: 'COMPLETED', label: 'Completed' },
                  { key: 'CANCELLED', label: 'Cancelled' }
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => {
                      setDonationStatusFilter(f.key);
                      setDonationPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-colors ${
                      donationStatusFilter === f.key
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <form onSubmit={handleSearchDonations} className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={donationSearch}
                  onChange={(e) => setDonationSearch(e.target.value)}
                  placeholder="Search item title..."
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </form>
            </div>
          </div>

          {/* Donations List / Table */}
          {loadingDonations ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-slate-200/80">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              <p className="text-slate-500 text-sm">Loading your donations...</p>
            </div>
          ) : donations.length === 0 ? (
            /* Helpful Clean Empty State */
            <div className="py-16 px-6 text-center rounded-3xl bg-white border border-slate-200/80 flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Heart className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-lg font-bold text-slate-800">
                  {donationStatusFilter !== 'ALL'
                    ? `No ${donationStatusFilter.toLowerCase().replace('_', ' ')} donations found`
                    : 'You have not created any donation requests yet.'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  CareConnect connects you directly with verified elderly care homes. Pledge essential groceries, medicines, or supplies today to support residents in need.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleOpenCreateDonation()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                Create Your First Donation
              </button>
            </div>
          ) : (
            /* Cards / Table of Donations */
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {donations.map((item) => (
                  <div
                    key={item._id}
                    className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold shrink-0 shadow-xs">
                        <Package className="w-6 h-6" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            #{item._id.slice(-6).toUpperCase()}
                          </span>
                          <DonationStatusBadge status={item.status} size="sm" />
                          <span className="text-xs text-slate-400">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900">{item.itemName}</h3>

                        <p className="text-xs text-slate-600">
                          Destination:{' '}
                          <span className="font-semibold text-slate-800">
                            {item.homeId?.name || 'Old-Age Home'}
                          </span>{' '}
                          {item.homeId?.city && `(${item.homeId.city})`}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap pt-1">
                          <span>
                            Quantity:{' '}
                            <strong className="text-teal-700 font-bold">
                              {item.quantity} {item.unit}
                            </strong>
                          </span>
                          <span>&bull;</span>
                          <span>Category: {item.category}</span>
                          <span>&bull;</span>
                          <span>
                            Preferred Date:{' '}
                            {new Date(item.preferredDeliveryDate).toLocaleDateString()}
                          </span>
                          {item.scheduledDate && (
                            <>
                              <span>&bull;</span>
                              <span className="text-purple-700 font-semibold">
                                Scheduled:{' '}
                                {new Date(item.scheduledDate).toLocaleDateString()}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:self-center shrink-0">
                      <Link
                        to={`/donations/${item._id}`}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-700 font-bold text-xs transition-colors inline-flex items-center gap-1.5"
                      >
                        View Details &amp; Track
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {donationPagination.totalPages > 1 && (
                <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 text-xs text-slate-600">
                  <span>
                    Showing Page {donationPagination.currentPage} of {donationPagination.totalPages} (
                    {donationPagination.totalRecords} records)
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={donationPagination.currentPage <= 1}
                      onClick={() => setDonationPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      disabled={donationPagination.currentPage >= donationPagination.totalPages}
                      onClick={() => setDonationPage((p) => p + 1)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION B: BROWSE ELDERLY HOMES & COMMUNITY NEEDS */}
      {/* ======================================================== */}
      {mainTab === 'browse' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <HomeIcon className="w-6 h-6 text-teal-600" />
                Elderly Care Communities &amp; Needs
              </h2>
              <p className="text-slate-600 text-sm mt-0.5">
                Browse verified care homes and urgent requirements to direct your donations where they are needed most.
              </p>
            </div>

            {/* Toggle Switch between Homes and Direct Needs */}
            <div className="flex items-center p-1 bg-slate-100 rounded-2xl self-start sm:self-auto border border-slate-200">
              <button
                type="button"
                onClick={() => setBrowseTab('homes')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  browseTab === 'homes'
                    ? 'bg-white text-teal-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <HomeIcon className="w-3.5 h-3.5" />
                Elderly Homes ({organizations.length})
              </button>
              <button
                type="button"
                onClick={() => setBrowseTab('requirements')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  browseTab === 'requirements'
                    ? 'bg-white text-teal-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                Urgent Needs ({publicRequirements.length})
              </button>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by facility name, cause, supplies, or description..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="sm:w-44">
              <input
                type="text"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                placeholder="Filter by city..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Category Chips for Requirements tab */}
          {browseTab === 'requirements' && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedFilter(cat)}
                  className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-colors ${
                    selectedFilter === cat
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* ----------------- TAB 1: VERIFIED HOMES ----------------- */}
          {browseTab === 'homes' && (
            <div>
              {loadingHomes ? (
                <div className="py-12 flex justify-center items-center gap-2 text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                  <span>Loading care communities...</span>
                </div>
              ) : filteredHomes.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <HomeIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-700 font-semibold">No homes match your search</p>
                  <p className="text-xs text-slate-500 mt-1">Try adjusting keywords or clearing city filter.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                  {filteredHomes.map((home) => (
                    <div
                      key={home._id}
                      className="group bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-lg transition-all overflow-hidden flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative h-44 overflow-hidden bg-slate-100">
                          <img
                            src={
                              home.profileImage ||
                              'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=600&q=80'
                            }
                            alt={home.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-3 right-3">
                            <VerificationBadge organization={home} size="sm" />
                          </div>
                          <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-0.5 rounded-md text-xs font-medium text-white flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-rose-400" />
                            {home.city || 'India'}
                          </div>
                        </div>

                        <div className="p-5">
                          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                            <span className="font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                              {home.organizationType || 'Trust'}
                            </span>
                            <span>{home.residentsCount || home.residents || 30} Residents</span>
                          </div>

                          <h3 className="font-bold text-slate-900 text-lg group-hover:text-teal-700 transition-colors">
                            {home.name}
                          </h3>
                          <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                            {home.description ||
                              'Providing compassionate housing, nursing care, and comfort to elderly citizens.'}
                          </p>

                          <div className="mt-4 p-2.5 bg-slate-50 border border-slate-200/70 rounded-xl text-xs text-slate-700 flex items-center justify-between">
                            <span className="font-semibold text-slate-500">Capacity:</span>
                            <span className="font-bold text-slate-900">{home.capacity || 40} Beds</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 pt-0 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenCreateDonation(home._id)}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <Heart className="w-3.5 h-3.5" />
                          Donate to Home
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchTerm(home.name);
                            setBrowseTab('requirements');
                          }}
                          className="py-2.5 px-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors"
                        >
                          Needs
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ----------------- TAB 2: LIVE DIRECT REQUIREMENTS ----------------- */}
          {browseTab === 'requirements' && (
            <div>
              {loadingReqs ? (
                <div className="py-12 flex justify-center items-center gap-2 text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                  <span>Loading open requirements...</span>
                </div>
              ) : filteredRequirements.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <Package className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-700 font-semibold">No direct requirements found</p>
                  <p className="text-xs text-slate-500 mt-1">Try changing category or searching with different keywords.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                  {filteredRequirements.map((req) => {
                    const pct =
                      req.progressPercentage ||
                      Math.round(((req.quantityFulfilled || 0) / (req.quantityRequired || 1)) * 100);
                    const remaining =
                      req.remainingQuantity !== undefined
                        ? req.remainingQuantity
                        : Math.max(0, (req.quantityRequired || 0) - (req.quantityFulfilled || 0));

                    return (
                      <div
                        key={req._id}
                        className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700">
                              {req.category}
                            </span>

                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1 ${
                                req.urgency === 'High'
                                  ? 'bg-rose-100 text-rose-800'
                                  : req.urgency === 'Medium'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              <Flame className="w-3 h-3" />
                              {req.urgency}
                            </span>
                          </div>

                          <div>
                            <h3 className="font-bold text-slate-900 text-base">{req.title}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              By:{' '}
                              <span className="font-semibold text-slate-700">
                                {req.organization?.name || 'Elderly Home Care'}
                              </span>{' '}
                              {req.organization?.city && `(${req.organization.city})`}
                            </p>
                            {req.description && (
                              <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                                {req.description}
                              </p>
                            )}
                          </div>

                          {/* Progress and Numbers */}
                          <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-600">Remaining needed:</span>
                              <span className="font-black text-rose-700">
                                {remaining} {req.unit}
                              </span>
                            </div>

                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-teal-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                              ></div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-500">
                              <span>{pct}% Fulfilled</span>
                              <span>
                                Total: {req.quantityRequired} {req.unit}
                              </span>
                            </div>
                          </div>

                          {req.neededByDate && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>Needed by: {new Date(req.neededByDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => handleOpenCreateDonation(req.organization?._id)}
                            className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <Heart className="w-3.5 h-3.5" />
                            Pledge Donation for this Cause
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create Donation Modal */}
      <CreateDonationModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        preselectedHomeId={preselectedHomeId}
        onSuccess={handleDonationCreatedSuccess}
      />
    </div>
  );
};

export default DonorDashboard;
