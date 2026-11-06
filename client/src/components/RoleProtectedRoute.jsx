import React from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ShieldAlert, ArrowLeft, Home as HomeIcon } from 'lucide-react';

export const RoleProtectedRoute = ({ allowedRoles = [] }) => {
  const { currentUser, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Checking authorization permissions...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = currentUser?.role?.toLowerCase();
  const isAuthorized = allowedRoles.map((r) => r.toLowerCase()).includes(userRole);

  if (!isAuthorized) {
    // Determine the user's correct home/dashboard link based on their role
    const roleDashboardMap = {
      donor: '/donor/dashboard',
      home: '/home/dashboard',
      volunteer: '/volunteer/dashboard',
      admin: '/admin/dashboard'
    };
    const userDashboard = roleDashboardMap[userRole] || '/';

    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-5 ring-8 ring-rose-50/50">
            <ShieldAlert className="w-9 h-9" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Restricted</h2>
          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
            You are logged in as <span className="font-semibold text-slate-800 capitalize">{currentUser?.role}</span>, which does not have permission to view this section.
          </p>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 mb-6 text-xs text-slate-500 text-left">
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="font-medium">Required Role(s):</span>
              <span className="font-semibold text-slate-700 capitalize">{allowedRoles.join(', ')}</span>
            </div>
            <div className="flex justify-between py-1 pt-2">
              <span className="font-medium">Your Current Role:</span>
              <span className="font-semibold text-rose-600 capitalize">{currentUser?.role}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to={userDashboard}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all shadow-teal-600/20"
            >
              <ArrowLeft className="w-4 h-4" /> Go to My Dashboard
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-all"
            >
              <HomeIcon className="w-4 h-4" /> Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default RoleProtectedRoute;
