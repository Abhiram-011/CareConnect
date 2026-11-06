import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import adminService from '../services/adminService.js';
import VerificationBadge from '../components/VerificationBadge.jsx';
import DonationStatusBadge from '../components/DonationStatusBadge.jsx';
import VolunteerStatusBadge from '../components/VolunteerStatusBadge.jsx';
import {
  ShieldAlert,
  Users,
  Building2,
  HeartHandshake,
  CalendarCheck,
  Layers,
  Flag,
  History,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Eye,
  RefreshCw,
  UserCheck,
  UserX,
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Clock,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Package,
  Info,
  CheckSquare,
  Square,
  AlertCircle,
  Menu,
  X,
  FileCheck
} from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Dashboard Overview', icon: ShieldAlert },
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'homes', label: 'Home Verification', icon: Building2 },
  { id: 'donations', label: 'Donation Monitoring', icon: HeartHandshake },
  { id: 'volunteers', label: 'Volunteer Activities', icon: CalendarCheck },
  { id: 'categories', label: 'Donation Categories', icon: Layers },
  { id: 'reports', label: 'Moderation & Reports', icon: Flag },
  { id: 'audit', label: 'Audit Trail', icon: History }
];

export const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ----------------------------------------------------
  // 1. Overview State
  // ----------------------------------------------------
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    recentUsers: [],
    recentDonations: [],
    pendingVerifications: [],
    recentReports: [],
    recentActions: []
  });

  // ----------------------------------------------------
  // 2. Users State
  // ----------------------------------------------------
  const [usersLoading, setUsersLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [usersPagination, setUsersPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);

  // User suspend modal
  const [suspendModal, setSuspendModal] = useState({ isOpen: false, user: null, reason: '' });
  const [actionLoading, setActionLoading] = useState(false);

  // ----------------------------------------------------
  // 3. Homes Verification State
  // ----------------------------------------------------
  const [homesLoading, setHomesLoading] = useState(false);
  const [homes, setHomes] = useState([]);
  const [homesPagination, setHomesPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [homeStatusFilter, setHomeStatusFilter] = useState('All');
  const [homeSearch, setHomeSearch] = useState('');
  const [inspectHome, setInspectHome] = useState(null);

  // Verification Decision Modals
  const [verifyModal, setVerifyModal] = useState({ isOpen: false, home: null, notes: '' });
  const [rejectModal, setRejectModal] = useState({ isOpen: false, home: null, reason: '', notes: '' });
  const [reqInfoModal, setReqInfoModal] = useState({ isOpen: false, home: null, notes: '' });

  // ----------------------------------------------------
  // 4. Donations State
  // ----------------------------------------------------
  const [donationsLoading, setDonationsLoading] = useState(false);
  const [donations, setDonations] = useState([]);
  const [donationsPagination, setDonationsPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [donationCategoryFilter, setDonationCategoryFilter] = useState('All');
  const [donationStatusFilter, setDonationStatusFilter] = useState('All');
  const [donationSearch, setDonationSearch] = useState('');
  const [selectedDonation, setSelectedDonation] = useState(null);

  // ----------------------------------------------------
  // 5. Volunteers State
  // ----------------------------------------------------
  const [volunteerSubtab, setVolunteerSubtab] = useState('volunteers'); // 'volunteers' | 'opportunities' | 'applications'
  const [volunteersLoading, setVolunteersLoading] = useState(false);
  const [volunteersList, setVolunteersList] = useState([]);
  const [opportunitiesList, setOpportunitiesList] = useState([]);
  const [applicationsList, setApplicationsList] = useState([]);
  const [volunteerSearch, setVolunteerSearch] = useState('');

  // ----------------------------------------------------
  // 6. Categories State
  // ----------------------------------------------------
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoryModal, setCategoryModal] = useState({
    isOpen: false,
    isEdit: false,
    id: null,
    name: '',
    description: '',
    isActive: true
  });

  // ----------------------------------------------------
  // 7. Reports State
  // ----------------------------------------------------
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [reportStatusFilter, setReportStatusFilter] = useState('All');
  const [reportCategoryFilter, setReportCategoryFilter] = useState('All');
  const [inspectReport, setInspectReport] = useState(null);
  const [reportResolution, setReportResolution] = useState({ status: 'RESOLVED', adminNotes: '' });

  // ----------------------------------------------------
  // 8. Audit Trail State
  // ----------------------------------------------------
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditActions, setAuditActions] = useState([]);

  // Fetch data on activeTab change
  useEffect(() => {
    if (activeTab === 'overview') fetchOverview();
    else if (activeTab === 'users') fetchUsers(1);
    else if (activeTab === 'homes') fetchHomes(1);
    else if (activeTab === 'donations') fetchDonations(1);
    else if (activeTab === 'volunteers') fetchVolunteers();
    else if (activeTab === 'categories') fetchCategories();
    else if (activeTab === 'reports') fetchReports();
    else if (activeTab === 'audit') fetchAudit();
  }, [activeTab]);

  // ----------------------------------------------------
  // Handlers & API Calls
  // ----------------------------------------------------
  const fetchOverview = async () => {
    try {
      setOverviewLoading(true);
      const res = await adminService.getDashboard();
      if (res.success && res.data) {
        setDashboardData(res.data);
      }
    } catch (err) {
      showToast(err.customMessage || 'Failed to load platform statistics.', 'error');
    } finally {
      setOverviewLoading(false);
    }
  };

  const fetchUsers = async (page = 1) => {
    try {
      setUsersLoading(true);
      const res = await adminService.getUsers({
        page,
        role: userRoleFilter,
        status: userStatusFilter,
        search: userSearch
      });
      if (res.success && res.data) {
        setUsers(res.data.users);
        setUsersPagination(res.data.pagination);
      }
    } catch (err) {
      showToast(err.customMessage || 'Failed to load users list.', 'error');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleSuspendUser = async () => {
    if (!suspendModal.reason.trim()) {
      showToast('A reason is required to suspend this account.', 'error');
      return;
    }
    try {
      setActionLoading(true);
      const res = await adminService.suspendUser(suspendModal.user._id, suspendModal.reason);
      if (res.success) {
        showToast(`User account '${suspendModal.user.name}' suspended.`, 'success');
        setSuspendModal({ isOpen: false, user: null, reason: '' });
        fetchUsers(usersPagination.page);
        if (selectedUserDetail) setSelectedUserDetail(null);
      }
    } catch (err) {
      showToast(err.customMessage || 'Failed to suspend account.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivateUser = async (user) => {
    try {
      setActionLoading(true);
      const res = await adminService.reactivateUser(user._id, 'Reactivated by administrator.');
      if (res.success) {
        showToast(`User account '${user.name}' reactivated successfully.`, 'success');
        fetchUsers(usersPagination.page);
        if (selectedUserDetail) setSelectedUserDetail(null);
      }
    } catch (err) {
      showToast(err.customMessage || 'Failed to reactivate account.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const fetchHomes = async (page = 1) => {
    try {
      setHomesLoading(true);
      const res = await adminService.getHomes({
        page,
        status: homeStatusFilter,
        search: homeSearch
      });
      if (res.success && res.data) {
        setHomes(res.data.homes);
        setHomesPagination(res.data.pagination);
      }
    } catch (err) {
      showToast(err.customMessage || 'Failed to load old-age homes list.', 'error');
    } finally {
      setHomesLoading(false);
    }
  };

  const handleVerifyHome = async () => {
    try {
      setActionLoading(true);
      const res = await adminService.verifyHome(verifyModal.home._id, { notes: verifyModal.notes });
      if (res.success) {
        showToast(`Organization '${verifyModal.home.name}' verified successfully!`, 'success');
        setVerifyModal({ isOpen: false, home: null, notes: '' });
        fetchHomes(homesPagination.page);
        if (inspectHome) setInspectHome(null);
      }
    } catch (err) {
      showToast(err.customMessage || 'Failed to verify organization.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectHome = async () => {
    if (!rejectModal.reason.trim()) {
      showToast('A rejection reason is mandatory.', 'error');
      return;
    }
    try {
      setActionLoading(true);
      const res = await adminService.rejectHome(rejectModal.home._id, {
        reason: rejectModal.reason,
        notes: rejectModal.notes
      });
      if (res.success) {
        showToast(`Organization '${rejectModal.home.name}' verification rejected.`, 'success');
        setRejectModal({ isOpen: false, home: null, reason: '', notes: '' });
        fetchHomes(homesPagination.page);
        if (inspectHome) setInspectHome(null);
      }
    } catch (err) {
      showToast(err.customMessage || 'Failed to reject organization.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestInformation = async () => {
    if (!reqInfoModal.notes.trim()) {
      showToast('Please specify the required information or documents.', 'error');
      return;
    }
    try {
      setActionLoading(true);
      const res = await adminService.requestInformation(reqInfoModal.home._id, { notes: reqInfoModal.notes });
      if (res.success) {
        showToast(`Information request sent to '${reqInfoModal.home.name}'. Status: NEEDS_INFORMATION.`, 'success');
        setReqInfoModal({ isOpen: false, home: null, notes: '' });
        fetchHomes(homesPagination.page);
        if (inspectHome) setInspectHome(null);
      }
    } catch (err) {
      showToast(err.customMessage || 'Failed to request information.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const fetchDonations = async (page = 1) => {
    try {
      setDonationsLoading(true);
      const res = await adminService.getDonations({
        page,
        status: donationStatusFilter,
        category: donationCategoryFilter,
        search: donationSearch
      });
      if (res.success && res.data) {
        setDonations(res.data.donations);
        setDonationsPagination(res.data.pagination);
      }
    } catch (err) {
      showToast(err.customMessage || 'Failed to load donations.', 'error');
    } finally {
      setDonationsLoading(false);
    }
  };

  const fetchVolunteers = async () => {
    try {
      setVolunteersLoading(true);
      if (volunteerSubtab === 'volunteers') {
        const res = await adminService.getVolunteers({ search: volunteerSearch });
        if (res.success && res.data) setVolunteersList(res.data.volunteers);
      } else if (volunteerSubtab === 'opportunities') {
        const res = await adminService.getVolunteerOpportunities({ search: volunteerSearch });
        if (res.success && res.data) setOpportunitiesList(res.data.opportunities);
      } else {
        const res = await adminService.getVolunteerApplications({ search: volunteerSearch });
        if (res.success && res.data) setApplicationsList(res.data.applications);
      }
    } catch (err) {
      showToast(err.customMessage || 'Failed to load volunteer data.', 'error');
    } finally {
      setVolunteersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'volunteers') fetchVolunteers();
  }, [volunteerSubtab]);

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const res = await adminService.getCategories();
      if (res.success && res.data) {
        setCategories(res.data.categories);
      }
    } catch (err) {
      showToast(err.customMessage || 'Failed to load categories.', 'error');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryModal.name.trim()) {
      showToast('Category name is required.', 'error');
      return;
    }
    try {
      setActionLoading(true);
      if (categoryModal.isEdit) {
        const res = await adminService.updateCategory(categoryModal.id, {
          name: categoryModal.name,
          description: categoryModal.description
        });
        if (res.success) {
          showToast(`Category '${categoryModal.name}' updated!`, 'success');
        }
      } else {
        const res = await adminService.createCategory({
          name: categoryModal.name,
          description: categoryModal.description,
          isActive: categoryModal.isActive
        });
        if (res.success) {
          showToast(`Category '${categoryModal.name}' created!`, 'success');
        }
      }
      setCategoryModal({ isOpen: false, isEdit: false, id: null, name: '', description: '', isActive: true });
      fetchCategories();
    } catch (err) {
      showToast(err.customMessage || 'Failed to save category.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleCategory = async (cat) => {
    try {
      const res = await adminService.toggleCategoryStatus(cat._id, !cat.isActive);
      if (res.success) {
        showToast(`Category '${cat.name}' is now ${!cat.isActive ? 'active' : 'inactive'}.`, 'success');
        fetchCategories();
      }
    } catch (err) {
      showToast(err.customMessage || 'Failed to toggle category status.', 'error');
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (!window.confirm(`Are you sure you want to remove '${cat.name}'?`)) return;
    try {
      const res = await adminService.deleteCategory(cat._id);
      if (res.success) {
        showToast(`Category '${cat.name}' removed.`, 'success');
        fetchCategories();
      }
    } catch (err) {
      showToast(err.customMessage || 'Failed to delete category.', 'error');
    }
  };

  const fetchReports = async () => {
    try {
      setReportsLoading(true);
      const res = await adminService.getReports({
        status: reportStatusFilter,
        category: reportCategoryFilter
      });
      if (res.success && res.data) {
        setReports(res.data.reports);
      }
    } catch (err) {
      showToast(err.customMessage || 'Failed to load reports.', 'error');
    } finally {
      setReportsLoading(false);
    }
  };

  const handleUpdateReport = async (reportId) => {
    try {
      setActionLoading(true);
      const res = await adminService.updateReportStatus(reportId, {
        status: reportResolution.status,
        adminNotes: reportResolution.adminNotes
      });
      if (res.success) {
        showToast(`Report updated to ${reportResolution.status}.`, 'success');
        setInspectReport(null);
        fetchReports();
      }
    } catch (err) {
      showToast(err.customMessage || 'Failed to update report.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const fetchAudit = async () => {
    try {
      setAuditLoading(true);
      const res = await adminService.getAuditActions();
      if (res.success && res.data) {
        setAuditActions(res.data.actions);
      }
    } catch (err) {
      showToast(err.customMessage || 'Failed to load audit trail.', 'error');
    } finally {
      setAuditLoading(false);
    }
  };

  // Helper status color classes
  const getVerificationStatusBadge = (status) => {
    switch (status) {
      case 'VERIFIED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'PENDING':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'UNDER_REVIEW':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'NEEDS_INFORMATION':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'REJECTED':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getReportStatusBadge = (status) => {
    switch (status) {
      case 'RESOLVED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'PENDING':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'UNDER_REVIEW':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'DISMISSED':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const stats = dashboardData.stats || {};

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Mobile Header Bar */}
      <div className="lg:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-16 z-30 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-indigo-400" />
          <span className="font-bold text-sm tracking-wide">CareConnect Admin</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-300 hover:text-white rounded-lg bg-white/10"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed lg:sticky top-16 z-20 h-[calc(100vh-4rem)] w-64 bg-slate-900 text-slate-200 flex flex-col shrink-0 border-r border-slate-800 transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-5 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-md">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white tracking-tight">Admin Console</h2>
              <p className="text-[11px] text-indigo-300 font-medium">Platform Trust &amp; Ops</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.id === 'homes' && (stats.pendingHomes || 0) > 0 && (
                  <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                    {stats.pendingHomes}
                  </span>
                )}
                {tab.id === 'reports' && (stats.pendingReports || 0) > 0 && (
                  <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                    {stats.pendingReports}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold border border-indigo-500/30">
              {currentUser?.name?.charAt(0) || 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{currentUser?.name}</p>
              <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> Administrator
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* ==================================================================== */}
        {/* TAB 1: DASHBOARD OVERVIEW                                            */}
        {/* ==================================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-indigo-300 text-xs font-semibold tracking-wide border border-white/10">
                    <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
                    CareConnect Administration &amp; Moderation
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    Platform Statistics &amp; Control Center
                  </h1>
                  <p className="text-slate-300 text-xs sm:text-sm max-w-2xl">
                    Live database metrics monitoring elderly welfare organizations, donors, donations, and volunteer activities.
                  </p>
                </div>
                <button
                  onClick={fetchOverview}
                  disabled={overviewLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors border border-white/20 self-start md:self-auto disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${overviewLoading ? 'animate-spin' : ''}`} /> Refresh
                </button>
              </div>
            </div>

            {/* Core Statistics Cards */}
            {overviewLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100 p-4" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* 1. Total Registered Users */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Registered Users</p>
                    <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats.totalUsers || 0}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">All platform roles</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                </div>

                {/* 2. Total Donors */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Total Donors</p>
                    <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats.totalDonors || 0}</p>
                    <p className="text-[11px] text-teal-600 font-semibold mt-0.5">Module 1 Active</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                </div>

                {/* 3. Total Volunteers */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Total Volunteers</p>
                    <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats.totalVolunteers || 0}</p>
                    <p className="text-[11px] text-blue-600 font-semibold mt-0.5">Module 4 Active</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <CalendarCheck className="w-5 h-5" />
                  </div>
                </div>

                {/* 4. Total Old-Age Homes */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Old-Age Homes</p>
                    <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats.totalHomes || 0}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Registered shelters</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>

                {/* 5. Pending Home Verifications */}
                <div
                  onClick={() => {
                    setHomeStatusFilter('PENDING');
                    setActiveTab('homes');
                  }}
                  className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200 shadow-xs flex items-center justify-between cursor-pointer hover:border-amber-400 transition-colors"
                >
                  <div>
                    <p className="text-xs font-medium text-amber-700 font-semibold">Pending Verifications</p>
                    <p className="text-2xl font-extrabold text-amber-900 mt-1">{stats.pendingHomes || 0}</p>
                    <p className="text-[11px] text-amber-600 mt-0.5">Needs admin action &rarr;</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>

                {/* 6. Approved Old-Age Homes */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Approved Homes</p>
                    <p className="text-2xl font-extrabold text-emerald-600 mt-1">{stats.approvedHomes || 0}</p>
                    <p className="text-[11px] text-emerald-600 mt-0.5">Verified trust badge</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>

                {/* 7. Rejected Old-Age Homes */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Rejected Homes</p>
                    <p className="text-2xl font-extrabold text-rose-600 mt-1">{stats.rejectedHomes || 0}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">With reasons logged</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <XCircle className="w-5 h-5" />
                  </div>
                </div>

                {/* 8. Total Donation Requests */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Donation Requests</p>
                    <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats.totalDonationRequests || 0}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Completed: <span className="text-emerald-600 font-bold">{stats.completedDonations || 0}</span>
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Package className="w-5 h-5" />
                  </div>
                </div>

                {/* 9. Volunteer Opportunities */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Volunteer Opportunities</p>
                    <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats.totalVolunteerOpportunities || 0}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Across elderly homes</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                </div>

                {/* 10. Volunteer Applications */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Volunteer Applications</p>
                    <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats.totalVolunteerApplications || 0}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Completed: <span className="text-emerald-600 font-bold">{stats.completedApplications || 0}</span>
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                    <FileCheck className="w-5 h-5" />
                  </div>
                </div>

                {/* 11. Platform Reports */}
                <div
                  onClick={() => setActiveTab('reports')}
                  className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-200 shadow-xs flex items-center justify-between cursor-pointer hover:border-rose-400 transition-colors"
                >
                  <div>
                    <p className="text-xs font-medium text-rose-700 font-semibold">Reported Accounts</p>
                    <p className="text-2xl font-extrabold text-rose-900 mt-1">{stats.totalReports || 0}</p>
                    <p className="text-[11px] text-rose-600 mt-0.5">
                      Pending: <span className="font-bold">{stats.pendingReports || 0}</span> &rarr;
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
                    <Flag className="w-5 h-5" />
                  </div>
                </div>

                {/* 12. Pending Donations */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Pending Donations</p>
                    <p className="text-2xl font-extrabold text-amber-600 mt-1">{stats.pendingDonations || 0}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Awaiting home review</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
              </div>
            )}

            {/* Dashboard Sub-sections: Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 1. Pending Home Verification Requests */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-600" />
                    <h3 className="text-sm font-bold text-slate-900">Pending Home Verifications</h3>
                  </div>
                  <button
                    onClick={() => {
                      setHomeStatusFilter('PENDING');
                      setActiveTab('homes');
                    }}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                  >
                    View All <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {dashboardData.pendingVerifications?.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No pending verification requests at this time.</p>
                ) : (
                  <div className="space-y-2.5">
                    {dashboardData.pendingVerifications?.map((home) => (
                      <div
                        key={home._id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3"
                      >
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-slate-900 truncate">{home.name}</p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {home.city}, {home.state} &bull; Reg: {home.registrationNumber}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getVerificationStatusBadge(home.verificationStatus)}`}>
                            {home.verificationStatus}
                          </span>
                          <button
                            onClick={() => {
                              setInspectHome(home);
                              setActiveTab('homes');
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                          >
                            Review
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Recent User Registrations */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">Recent User Registrations</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('users')}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                  >
                    Manage Users <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {dashboardData.recentUsers?.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No recent user registrations found.</p>
                ) : (
                  <div className="space-y-2.5">
                    {dashboardData.recentUsers?.map((u) => (
                      <div
                        key={u._id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3"
                      >
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-slate-900 truncate">{u.name}</p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {u.email} &bull; {u.location || 'Location not set'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-200 text-slate-700">
                            {u.role}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.status === 'SUSPENDED' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {u.status || 'ACTIVE'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Recent Donation Activities */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4 text-teal-600" />
                    <h3 className="text-sm font-bold text-slate-900">Recent Donation Activities</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('donations')}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                  >
                    Monitor All <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {dashboardData.recentDonations?.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No donations recorded yet.</p>
                ) : (
                  <div className="space-y-2.5">
                    {dashboardData.recentDonations?.map((d) => (
                      <div
                        key={d._id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3"
                      >
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-slate-900 truncate">{d.itemName} ({d.quantity} {d.unit})</p>
                          <p className="text-[11px] text-slate-500 truncate">
                            From: {d.donorId?.name || 'Donor'} &rarr; To: {d.homeId?.name || 'Home'}
                          </p>
                        </div>
                        <div className="shrink-0">
                          <DonationStatusBadge status={d.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Recent Reports & Moderation Flags */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flag className="w-4 h-4 text-rose-600" />
                    <h3 className="text-sm font-bold text-slate-900">Recent Reports &amp; Moderation</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('reports')}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                  >
                    Moderate <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {dashboardData.recentReports?.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No reports filed. Everything running clean!</p>
                ) : (
                  <div className="space-y-2.5">
                    {dashboardData.recentReports?.map((r) => (
                      <div
                        key={r._id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3"
                      >
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-slate-900 truncate">{r.category}</p>
                          <p className="text-[11px] text-slate-500 truncate">
                            Target: {r.reportedEntityType} &bull; Reporter: {r.reporterId?.name || 'User'}
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getReportStatusBadge(r.status)}`}>
                          {r.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: USER MANAGEMENT                                               */}
        {/* ==================================================================== */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">User Management</h2>
                <p className="text-xs text-slate-500">
                  Search, review roles, view detailed profiles, suspend, or reactivate platform accounts.
                </p>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search name, email, phone..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchUsers(1)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <select
                  value={userRoleFilter}
                  onChange={(e) => {
                    setUserRoleFilter(e.target.value);
                    setTimeout(() => fetchUsers(1), 0);
                  }}
                  className="px-3 py-2 rounded-xl text-xs border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Roles</option>
                  <option value="donor">Donors</option>
                  <option value="home">Old-Age Homes</option>
                  <option value="volunteer">Volunteers</option>
                  <option value="admin">Administrators</option>
                </select>

                <select
                  value={userStatusFilter}
                  onChange={(e) => {
                    setUserStatusFilter(e.target.value);
                    setTimeout(() => fetchUsers(1), 0);
                  }}
                  className="px-3 py-2 rounded-xl text-xs border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>

                <button
                  onClick={() => fetchUsers(1)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shrink-0"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              {usersLoading ? (
                <div className="p-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                  <p className="text-xs">Loading user directory...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <p className="text-sm font-semibold">No users matching search or filter criteria.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Contact</th>
                        <th className="py-3 px-4">Registered Date</th>
                        <th className="py-3 px-4">Account Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map((u) => {
                        const isSelf = currentUser?._id === u._id;
                        return (
                          <tr key={u._id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{u.name}</div>
                              <div className="text-[11px] text-slate-400">{u.email}</div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                                {u.role}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              <div>{u.phone || 'N/A'}</div>
                              <div className="text-[11px] text-slate-400">{u.location || 'No location'}</div>
                            </td>
                            <td className="py-3 px-4 text-slate-500">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  u.status === 'SUSPENDED'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                }`}
                              >
                                {u.status || 'ACTIVE'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right space-x-2">
                              <button
                                onClick={async () => {
                                  try {
                                    const res = await adminService.getUserById(u._id);
                                    if (res.success) setSelectedUserDetail(res.data);
                                  } catch (e) {
                                    showToast('Could not load user details.', 'error');
                                  }
                                }}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                              >
                                View
                              </button>

                              {!isSelf && (
                                <>
                                  {u.status === 'SUSPENDED' ? (
                                    <button
                                      onClick={() => handleReactivateUser(u)}
                                      disabled={actionLoading}
                                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                                    >
                                      Reactivate
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => setSuspendModal({ isOpen: true, user: u, reason: '' })}
                                      disabled={actionLoading}
                                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                                    >
                                      Suspend
                                    </button>
                                  )}
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {usersPagination.pages > 1 && (
                <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Showing page {usersPagination.page} of {usersPagination.pages} ({usersPagination.total} total users)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fetchUsers(usersPagination.page - 1)}
                      disabled={usersPagination.page <= 1}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => fetchUsers(usersPagination.page + 1)}
                      disabled={usersPagination.page >= usersPagination.pages}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 3: HOME VERIFICATION & TRUST CONSOLE                             */}
        {/* ==================================================================== */}
        {activeTab === 'homes' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Old-Age Home Verification Console</h2>
                <p className="text-xs text-slate-500">
                  Inspect legal registration documents, verify identities, reject fraudulent applications with guidance, or grant Verified Organization status.
                </p>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap gap-2 items-center justify-between">
              <div className="flex items-center gap-1.5 flex-wrap">
                {['All', 'PENDING', 'UNDER_REVIEW', 'VERIFIED', 'NEEDS_INFORMATION', 'REJECTED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setHomeStatusFilter(st);
                      setTimeout(() => fetchHomes(1), 0);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      homeStatusFilter === st
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'All' ? 'All Homes' : st}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search home name, city..."
                  value={homeSearch}
                  onChange={(e) => setHomeSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchHomes(1)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Homes List */}
            {homesLoading ? (
              <div className="p-12 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                <p className="text-xs">Loading elderly organizations...</p>
              </div>
            ) : homes.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 space-y-2">
                <Building2 className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">No organizations found under this filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {homes.map((h) => (
                  <div
                    key={h._id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getVerificationStatusBadge(h.verificationStatus)}`}>
                          {h.verificationStatus}
                        </span>
                        {h.verificationStatus === 'VERIFIED' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Verified Org
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="text-base font-bold text-slate-900">{h.name}</h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {h.city}, {h.state} &bull; PIN: {h.pincode}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 text-[11px] text-slate-600 space-y-1">
                        <p>
                          <span className="font-semibold text-slate-700">Reg #:</span> {h.registrationNumber}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-700">In-charge:</span> {h.responsiblePerson}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-700">Phone:</span> {h.phone}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-700">Uploaded Docs:</span> {h.documents?.length || 0} file(s)
                        </p>
                      </div>

                      {h.rejectionReason && (
                        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                          <span className="font-bold">Rejection reason:</span> {h.rejectionReason}
                        </div>
                      )}

                      {h.verificationNotes && (
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                          <span className="font-bold">Admin note:</span> {h.verificationNotes}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={async () => {
                          try {
                            const res = await adminService.getHomeById(h._id);
                            if (res.success) setInspectHome(res.data.home);
                          } catch (e) {
                            setInspectHome(h);
                          }
                        }}
                        className="w-full py-2 rounded-xl text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" /> Full Inspection
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 4: DONATION MONITORING (READ-ONLY)                                */}
        {/* ==================================================================== */}
        {activeTab === 'donations' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Donation Requests Monitoring</h2>
                <p className="text-xs text-slate-500">
                  Read-only administrative observation of supplies, delivery timelines, fulfillment statuses, and potential fraudulent requests.
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search item, donation ID..."
                  value={donationSearch}
                  onChange={(e) => setDonationSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchDonations(1)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <select
                  value={donationStatusFilter}
                  onChange={(e) => {
                    setDonationStatusFilter(e.target.value);
                    setTimeout(() => fetchDonations(1), 0);
                  }}
                  className="px-3 py-2 rounded-xl text-xs border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="All">All Statuses</option>
                  <option value="PENDING">PENDING</option>
                  <option value="ACCEPTED">ACCEPTED</option>
                  <option value="SCHEDULED">SCHEDULED</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>

                <select
                  value={donationCategoryFilter}
                  onChange={(e) => {
                    setDonationCategoryFilter(e.target.value);
                    setTimeout(() => fetchDonations(1), 0);
                  }}
                  className="px-3 py-2 rounded-xl text-xs border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="All">All Categories</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => fetchDonations(1)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shrink-0"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              {donationsLoading ? (
                <div className="p-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                  <p className="text-xs">Loading donation records...</p>
                </div>
              ) : donations.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <p className="text-sm font-semibold">No donations matching your query.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Donation Details</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Donor</th>
                        <th className="py-3 px-4">Destination Home</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Inspection</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {donations.map((d) => (
                        <tr key={d._id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              {d.itemName}
                              {d.isReported && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500 text-white flex items-center gap-0.5">
                                  <AlertCircle className="w-2.5 h-2.5" /> Reported
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Qty: {d.quantity} {d.unit} &bull; ID: #{d._id.slice(-6).toUpperCase()}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-medium">{d.category}</td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-900">{d.donorId?.name || 'Unknown Donor'}</div>
                            <div className="text-[11px] text-slate-400">{d.donorId?.email}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-900">{d.homeId?.name || 'Unknown Home'}</div>
                            <div className="text-[11px] text-slate-400">{d.homeId?.city}, {d.homeId?.state}</div>
                          </td>
                          <td className="py-3 px-4">
                            <DonationStatusBadge status={d.status} />
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setSelectedDonation(d)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {donationsPagination.pages > 1 && (
                <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Page {donationsPagination.page} of {donationsPagination.pages} ({donationsPagination.total} donations)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fetchDonations(donationsPagination.page - 1)}
                      disabled={donationsPagination.page <= 1}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => fetchDonations(donationsPagination.page + 1)}
                      disabled={donationsPagination.page >= donationsPagination.pages}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 5: VOLUNTEER ACTIVITY MONITORING                                 */}
        {/* ==================================================================== */}
        {activeTab === 'volunteers' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Volunteer Activities Monitoring</h2>
                <p className="text-xs text-slate-500">
                  Observe community engagement, review opportunities posted by old-age homes, and audit application acceptances.
                </p>
              </div>

              {/* Sub-tabs */}
              <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 self-start">
                <button
                  onClick={() => setVolunteerSubtab('volunteers')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    volunteerSubtab === 'volunteers' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Volunteers
                </button>
                <button
                  onClick={() => setVolunteerSubtab('opportunities')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    volunteerSubtab === 'opportunities' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Opportunities
                </button>
                <button
                  onClick={() => setVolunteerSubtab('applications')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    volunteerSubtab === 'applications' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Applications
                </button>
              </div>
            </div>

            {/* Sub-tab 1: Registered Volunteers */}
            {volunteerSubtab === 'volunteers' && (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                {volunteersLoading ? (
                  <div className="p-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    <p className="text-xs">Loading volunteer roster...</p>
                  </div>
                ) : volunteersList.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">No volunteers registered yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Volunteer</th>
                          <th className="py-3 px-4">Contact</th>
                          <th className="py-3 px-4">Skills &amp; Interests</th>
                          <th className="py-3 px-4">Availability</th>
                          <th className="py-3 px-4">Applications</th>
                          <th className="py-3 px-4">Completed Tasks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {volunteersList.map((v) => (
                          <tr key={v._id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{v.name}</div>
                              <div className="text-[11px] text-slate-400">{v.email}</div>
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              <div>{v.phone || 'N/A'}</div>
                              <div className="text-[11px] text-slate-400">{v.location || 'Location not set'}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {(v.profile?.skills || ['General Assistance']).map((s, i) => (
                                  <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {v.profile?.availability || 'Flexible'}
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-800">{v.applicationsCount || 0}</td>
                            <td className="py-3 px-4 font-bold text-emerald-600">
                              {v.profile?.completedTasksCount || 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Sub-tab 2: Volunteer Opportunities */}
            {volunteerSubtab === 'opportunities' && (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                {volunteersLoading ? (
                  <div className="p-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    <p className="text-xs">Loading opportunities...</p>
                  </div>
                ) : opportunitiesList.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">No opportunities created yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Opportunity</th>
                          <th className="py-3 px-4">Old-Age Home</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Event Date</th>
                          <th className="py-3 px-4">Capacity</th>
                          <th className="py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {opportunitiesList.map((opp) => (
                          <tr key={opp._id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{opp.title}</div>
                              <div className="text-[11px] text-slate-400">{opp.location}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-800">{opp.homeId?.name || 'Home'}</div>
                              <div className="text-[11px] text-slate-400">{opp.homeId?.city}</div>
                            </td>
                            <td className="py-3 px-4 text-slate-600">{opp.category}</td>
                            <td className="py-3 px-4 text-slate-600">
                              {opp.eventDate ? new Date(opp.eventDate).toLocaleDateString() : 'Ongoing'}
                            </td>
                            <td className="py-3 px-4 text-slate-800 font-medium">
                              {opp.assignedCount || 0} / {opp.volunteerCapacity}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  opp.status === 'Open'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : opp.status === 'Closed'
                                    ? 'bg-slate-200 text-slate-700'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {opp.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Sub-tab 3: Applications */}
            {volunteerSubtab === 'applications' && (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                {volunteersLoading ? (
                  <div className="p-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    <p className="text-xs">Loading applications...</p>
                  </div>
                ) : applicationsList.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">No applications recorded yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Volunteer</th>
                          <th className="py-3 px-4">Applied Opportunity</th>
                          <th className="py-3 px-4">Home</th>
                          <th className="py-3 px-4">Applied Date</th>
                          <th className="py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {applicationsList.map((app) => (
                          <tr key={app._id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{app.volunteerId?.name}</div>
                              <div className="text-[11px] text-slate-400">{app.volunteerId?.email}</div>
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-800">
                              {app.opportunityId?.title || 'Opportunity'}
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {app.opportunityId?.homeId?.name || 'Home'}
                            </td>
                            <td className="py-3 px-4 text-slate-500">
                              {new Date(app.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              <VolunteerStatusBadge status={app.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 6: DONATION CATEGORY MANAGEMENT                                  */}
        {/* ==================================================================== */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Donation Category Management</h2>
                <p className="text-xs text-slate-500">
                  Manage active donation categories displayed to donors in Module 3. Active categories appear during donation creation.
                </p>
              </div>

              <button
                onClick={() =>
                  setCategoryModal({
                    isOpen: true,
                    isEdit: false,
                    id: null,
                    name: '',
                    description: '',
                    isActive: true
                  })
                }
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Category
              </button>
            </div>

            {/* Categories Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              {categoriesLoading ? (
                <div className="p-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                  <p className="text-xs">Loading categories...</p>
                </div>
              ) : categories.length === 0 ? (
                <div className="p-12 text-center text-slate-400">No categories found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Category Name</th>
                        <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-4">Donations Count</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {categories.map((cat) => (
                        <tr key={cat._id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900">{cat.name}</td>
                          <td className="py-3.5 px-4 text-slate-600 max-w-md">{cat.description || '—'}</td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                              {cat.donationCount || 0} donations
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => handleToggleCategory(cat)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                                cat.isActive
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                              }`}
                            >
                              {cat.isActive ? <ToggleRight className="w-3.5 h-3.5 text-emerald-600" /> : <ToggleLeft className="w-3.5 h-3.5 text-slate-400" />}
                              {cat.isActive ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button
                              onClick={() =>
                                setCategoryModal({
                                  isOpen: true,
                                  isEdit: true,
                                  id: cat._id,
                                  name: cat.name,
                                  description: cat.description || '',
                                  isActive: cat.isActive
                                })
                              }
                              className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 7: REPORTED ACCOUNTS & MODERATION                                */}
        {/* ==================================================================== */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Reports &amp; Moderation Console</h2>
                <p className="text-xs text-slate-500">
                  Review reported old-age homes, misleading donation requests, or suspicious user accounts. Add internal notes and resolve issues.
                </p>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap gap-2 items-center justify-between">
              <div className="flex items-center gap-1.5">
                {['All', 'PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setReportStatusFilter(st);
                      setTimeout(fetchReports, 0);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      reportStatusFilter === st
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'All' ? 'All Reports' : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Reports List */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              {reportsLoading ? (
                <div className="p-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                  <p className="text-xs">Loading incident reports...</p>
                </div>
              ) : reports.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">No reports found under this filter.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Report Details</th>
                        <th className="py-3 px-4">Entity Type</th>
                        <th className="py-3 px-4">Reporter</th>
                        <th className="py-3 px-4">Submitted</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Moderation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reports.map((r) => (
                        <tr key={r._id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{r.category}</div>
                            <div className="text-[11px] text-slate-500 max-w-sm truncate">{r.description}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                              {r.reportedEntityType}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-900">{r.reporterId?.name || 'User'}</div>
                            <div className="text-[11px] text-slate-400">{r.reporterId?.email}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getReportStatusBadge(r.status)}`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={async () => {
                                try {
                                  const res = await adminService.getReportById(r._id);
                                  if (res.success) {
                                    setInspectReport(res.data);
                                    setReportResolution({
                                      status: res.data.report.status || 'RESOLVED',
                                      adminNotes: res.data.report.adminNotes || ''
                                    });
                                  }
                                } catch (e) {
                                  setInspectReport({ report: r });
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700"
                            >
                              Review
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 8: AUDIT TRAIL LOG                                               */}
        {/* ==================================================================== */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Administrative Audit Trail</h2>
                <p className="text-xs text-slate-500">
                  Immutable record of all verification approvals, rejections, user suspensions, and category updates.
                </p>
              </div>
              <button
                onClick={fetchAudit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-white bg-slate-100"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh Log
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              {auditLoading ? (
                <div className="p-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                  <p className="text-xs">Loading audit actions...</p>
                </div>
              ) : auditActions.length === 0 ? (
                <div className="p-12 text-center text-slate-400">No actions recorded yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Action</th>
                        <th className="py-3 px-4">Administrator</th>
                        <th className="py-3 px-4">Target Entity</th>
                        <th className="py-3 px-4">Reason / Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {auditActions.map((a) => (
                        <tr key={a._id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {new Date(a.createdAt).toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded font-sans font-bold text-[10px] bg-slate-900 text-white">
                              {a.actionType}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-sans">
                            <span className="font-bold text-slate-900">{a.adminId?.name || 'Admin'}</span>
                            <span className="text-slate-400 text-[10px] block">{a.adminId?.email}</span>
                          </td>
                          <td className="py-3 px-4 font-sans text-slate-700">
                            <span className="font-semibold">{a.targetType}:</span> {String(a.targetId).slice(-8)}
                          </td>
                          <td className="py-3 px-4 font-sans text-slate-600 max-w-sm truncate">
                            {a.reason || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ==================================================================== */}
      {/* MODALS & INSPECTION OVERLAYS                                          */}
      {/* ==================================================================== */}

      {/* 1. Suspend User Modal */}
      {suspendModal.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Suspend User Account</h3>
                <p className="text-xs text-slate-500">User: {suspendModal.user?.name} ({suspendModal.user?.email})</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mandatory Suspension Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={suspendModal.reason}
                onChange={(e) => setSuspendModal({ ...suspendModal, reason: e.target.value })}
                placeholder="Specify the reason for suspension (will be recorded in audit log and shown to user)..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="p-3 rounded-xl bg-amber-50 text-xs text-amber-900 border border-amber-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>Suspended accounts are locked out from logging in or using platform features.</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSuspendModal({ isOpen: false, user: null, reason: '' })}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspendUser}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50"
              >
                {actionLoading ? 'Suspending...' : 'Confirm Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. User Detail Modal */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  {selectedUserDetail.user?.name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedUserDetail.user?.name}</h3>
                  <p className="text-xs text-slate-500">{selectedUserDetail.user?.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Role</span>
                <span className="font-bold text-slate-800 uppercase">{selectedUserDetail.user?.role}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Account Status</span>
                <span className={`font-bold ${selectedUserDetail.user?.status === 'SUSPENDED' ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {selectedUserDetail.user?.status || 'ACTIVE'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Phone</span>
                <span className="font-medium text-slate-700">{selectedUserDetail.user?.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Registered</span>
                <span className="font-medium text-slate-700">
                  {new Date(selectedUserDetail.user?.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {selectedUserDetail.user?.suspensionReason && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                <span className="font-bold">Suspension reason:</span> {selectedUserDetail.user.suspensionReason}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Old-Age Home Full Inspection Modal */}
      {inspectHome && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getVerificationStatusBadge(inspectHome.verificationStatus)}`}>
                    {inspectHome.verificationStatus}
                  </span>
                  <span className="text-xs text-slate-400">ID: #{inspectHome._id.slice(-6).toUpperCase()}</span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">{inspectHome.name}</h3>
                <p className="text-xs text-slate-500">
                  {inspectHome.address}, {inspectHome.city}, {inspectHome.state} &bull; PIN: {inspectHome.pincode}
                </p>
              </div>
              <button
                onClick={() => setInspectHome(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Registration & Legal Details */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Registration Number</span>
                <span className="font-bold text-slate-800">{inspectHome.registrationNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Org Type</span>
                <span className="font-bold text-slate-800">{inspectHome.organizationType || 'Trust'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Responsible Person</span>
                <span className="font-bold text-slate-800">{inspectHome.responsiblePerson}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Contact Email</span>
                <span className="font-medium text-slate-700">{inspectHome.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Phone</span>
                <span className="font-medium text-slate-700">{inspectHome.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Capacity / Residents</span>
                <span className="font-medium text-slate-700">
                  {inspectHome.capacity || 0} beds ({inspectHome.residentsCount || 0} residents)
                </span>
              </div>
            </div>

            {/* Submitted Verification Documents */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Uploaded Verification Documents ({inspectHome.documents?.length || 0})
              </h4>
              {inspectHome.documents?.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No legal documents uploaded yet.</p>
              ) : (
                <div className="space-y-2">
                  {inspectHome.documents?.map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                        <div className="overflow-hidden">
                          <p className="font-bold text-slate-800 truncate">{doc.originalName || doc.fileName}</p>
                          <p className="text-[10px] text-slate-400">
                            Type: {doc.documentType} &bull; Size: {(doc.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <a
                        href={`/api/organizations/admin/document/${doc.fileName}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Securely
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Verification History Log */}
            {inspectHome.verificationHistory?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Verification History</h4>
                <div className="space-y-1.5 text-xs max-h-32 overflow-y-auto">
                  {inspectHome.verificationHistory.map((vh, i) => (
                    <div key={i} className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800">{vh.status}</span> by {vh.reviewedByName || 'Administrator'}
                        {vh.notes && <p className="text-slate-500 text-[11px]">{vh.notes}</p>}
                        {vh.rejectionReason && <p className="text-rose-600 text-[11px] font-semibold">Reason: {vh.rejectionReason}</p>}
                      </div>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {new Date(vh.reviewedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Decision Action Buttons */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2.5">
              <button
                onClick={() => setReqInfoModal({ isOpen: true, home: inspectHome, notes: '' })}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200"
              >
                Request Info
              </button>
              <button
                onClick={() => setRejectModal({ isOpen: true, home: inspectHome, reason: '', notes: '' })}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
              >
                Reject with Reason
              </button>
              <button
                onClick={() => setVerifyModal({ isOpen: true, home: inspectHome, notes: '' })}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm"
              >
                Approve &amp; Verify Home
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Approve Organization Dialog */}
      {verifyModal.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Approve Old-Age Home</h3>
                <p className="text-xs text-slate-500">{verifyModal.home?.name}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Verification Review Notes (Optional)
              </label>
              <textarea
                rows={3}
                value={verifyModal.notes}
                onChange={(e) => setVerifyModal({ ...verifyModal, notes: e.target.value })}
                placeholder="e.g. Legal deed verified, registration number matched in public trust registry..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setVerifyModal({ isOpen: false, home: null, notes: '' })}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyHome}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
              >
                {actionLoading ? 'Approving...' : 'Confirm Verification'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Reject Organization Dialog */}
      {rejectModal.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Reject Old-Age Home</h3>
                <p className="text-xs text-slate-500">{rejectModal.home?.name}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mandatory Rejection Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={rejectModal.reason}
                onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                placeholder="Explain clearly to the home why verification was rejected so they can rectify..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModal({ isOpen: false, home: null, reason: '', notes: '' })}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectHome}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Request Information Dialog */}
      {reqInfoModal.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Request Additional Information</h3>
                <p className="text-xs text-slate-500">{reqInfoModal.home?.name}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Information or Documents Required <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={reqInfoModal.notes}
                onChange={(e) => setReqInfoModal({ ...reqInfoModal, notes: e.target.value })}
                placeholder="e.g. Please provide official letterhead address proof or recent facility photos..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setReqInfoModal({ isOpen: false, home: null, notes: '' })}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestInformation}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
              >
                {actionLoading ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Donation Inspection Modal */}
      {selectedDonation && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400">DONATION ID: #{selectedDonation._id}</span>
                <h3 className="text-lg font-bold text-slate-900">{selectedDonation.itemName}</h3>
                <p className="text-xs text-slate-500">
                  Qty: {selectedDonation.quantity} {selectedDonation.unit} &bull; Category: {selectedDonation.category}
                </p>
              </div>
              <button onClick={() => setSelectedDonation(null)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-2">
              <div>
                <span className="font-bold text-slate-700">Donor:</span> {selectedDonation.donorId?.name} ({selectedDonation.donorId?.email})
              </div>
              <div>
                <span className="font-bold text-slate-700">Destination:</span> {selectedDonation.homeId?.name} ({selectedDonation.homeId?.city}, {selectedDonation.homeId?.state})
              </div>
              <div>
                <span className="font-bold text-slate-700">Preferred Delivery:</span>{' '}
                {new Date(selectedDonation.preferredDeliveryDate).toLocaleDateString()}
              </div>
              {selectedDonation.notes && (
                <div>
                  <span className="font-bold text-slate-700">Donor Notes:</span> {selectedDonation.notes}
                </div>
              )}
            </div>

            {selectedDonation.statusHistory?.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-900 uppercase">Status Lifecycle History</h4>
                <div className="space-y-1 text-xs max-h-32 overflow-y-auto">
                  {selectedDonation.statusHistory.map((sh, idx) => (
                    <div key={idx} className="p-2 bg-slate-50 rounded-lg flex items-center justify-between text-[11px]">
                      <span>{sh.newStatus} {sh.actorRole ? `(by ${sh.actorRole})` : ''}</span>
                      <span className="text-slate-400">{new Date(sh.timestamp).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedDonation(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Category Create / Edit Modal */}
      {categoryModal.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {categoryModal.isEdit ? 'Edit Donation Category' : 'Add New Donation Category'}
              </h3>
              <button
                onClick={() => setCategoryModal({ isOpen: false, isEdit: false, id: null, name: '', description: '', isActive: true })}
                className="p-1.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={categoryModal.name}
                  onChange={(e) => setCategoryModal({ ...categoryModal, name: e.target.value })}
                  placeholder="e.g. Blankets & Bedding"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={categoryModal.description}
                  onChange={(e) => setCategoryModal({ ...categoryModal, description: e.target.value })}
                  placeholder="Describe suitable supply items under this category..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCategoryModal({ isOpen: false, isEdit: false, id: null, name: '', description: '', isActive: true })}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. Report Inspection & Moderation Modal */}
      {inspectReport && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getReportStatusBadge(inspectReport.report?.status)}`}>
                  {inspectReport.report?.status}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{inspectReport.report?.category}</h3>
                <p className="text-xs text-slate-500">
                  Reported Entity: <span className="font-semibold uppercase">{inspectReport.report?.reportedEntityType}</span> &bull; ID: {inspectReport.report?.reportedEntityId}
                </p>
              </div>
              <button onClick={() => setInspectReport(null)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1.5">
              <span className="font-bold text-slate-700 block">User Description:</span>
              <p className="text-slate-600 whitespace-pre-wrap">{inspectReport.report?.description}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Update Moderation Status
              </label>
              <select
                value={reportResolution.status}
                onChange={(e) => setReportResolution({ ...reportResolution, status: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
              >
                <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="DISMISSED">DISMISSED</option>
              </select>

              <label className="block text-xs font-bold text-slate-700 mb-1">
                Internal Administrator Notes (Confidential)
              </label>
              <textarea
                rows={3}
                value={reportResolution.adminNotes}
                onChange={(e) => setReportResolution({ ...reportResolution, adminNotes: e.target.value })}
                placeholder="Record actions taken, investigation outcome, or justification..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setInspectReport(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
              <button
                onClick={() => handleUpdateReport(inspectReport.report?._id)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {actionLoading ? 'Updating...' : 'Save Moderation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
