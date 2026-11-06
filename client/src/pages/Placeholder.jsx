import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Layers,
  Home,
  Users,
  ShieldAlert,
  Bell,
  ArrowRight,
  Info,
  Clock
} from 'lucide-react';

export const Placeholder = ({ title, moduleNumber, moduleName, description, icon: IconComponent }) => {
  const { currentUser } = useAuth();
  const location = useLocation();

  const getPageInfo = () => {
    const path = location.pathname;
    if (path.includes('/home/dashboard')) {
      return {
        title: 'Old-Age Home Management Portal',
        moduleNumber: 'Module 2',
        moduleName: 'Old-Age Home Management',
        description: 'This portal will allow registered elderly homes to manage facility profiles, resident needs, and verify incoming requests.',
        icon: Home,
        badge: 'Old-Age Home Role'
      };
    }
    if (path.includes('/volunteer/dashboard')) {
      return {
        title: 'Volunteer Operations Portal',
        moduleNumber: 'Module 4',
        moduleName: 'Volunteer Management',
        description: 'This portal will allow volunteers to sign up for home visits, coordinate assistance tasks, and record community hours.',
        icon: Users,
        badge: 'Volunteer Role'
      };
    }
    if (path.includes('/admin/dashboard')) {
      return {
        title: 'Administrative Control Console',
        moduleNumber: 'Module 7',
        moduleName: 'Admin & Verification Management',
        description: 'System administration console for verifying elder home licenses, managing user roles, and monitoring platform analytics.',
        icon: ShieldAlert,
        badge: 'System Admin Role'
      };
    }
    if (path.includes('/notifications')) {
      return {
        title: 'Notification Center',
        moduleNumber: 'Upcoming Module',
        moduleName: 'Real-Time Notifications',
        description: 'Stay updated on pledge status, verified needs updates, and community alerts.',
        icon: Bell,
        badge: 'All Roles'
      };
    }

    return {
      title: title || 'Module Under Construction',
      moduleNumber: moduleNumber || 'Next Phase',
      moduleName: moduleName || 'Feature Roadmap',
      description: description || 'This module will be activated in upcoming project milestones.',
      icon: IconComponent || Layers,
      badge: 'In Development'
    };
  };

  const info = getPageInfo();
  const Icon = info.icon;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-8 sm:p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center mx-auto mb-6 shadow-xs">
          <Icon className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-3">
          <Clock className="w-3.5 h-3.5 text-teal-600" />
          {info.moduleNumber} &bull; {info.badge}
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
          {info.title}
        </h1>

        <p className="text-slate-600 text-base max-w-xl mx-auto mb-8 leading-relaxed">
          {info.description}
        </p>

        <div className="bg-teal-50/70 border border-teal-200/70 rounded-2xl p-4 max-w-lg mx-auto mb-8 text-left flex items-start gap-3">
          <Info className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
          <div className="text-xs text-teal-950">
            <p className="font-bold mb-0.5">Module 1 Active</p>
            <p className="text-teal-900 leading-relaxed">
              User & Donor Management is fully operational. Authentication, session persistence, role-based protection, and user profile management are functioning.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {currentUser?.role === 'donor' ? (
            <Link
              to="/donor/dashboard"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-all shadow-teal-600/20"
            >
              Open Donor Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              to="/profile"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-all shadow-teal-600/20"
            >
              View Your Profile
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-all"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Placeholder;
