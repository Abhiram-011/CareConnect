import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import {
  HeartHandshake,
  Heart,
  LayoutDashboard,
  User,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  Building2,
  PackageCheck,
  History,
  Users
} from 'lucide-react';
import { getUnreadCount } from '../services/notificationService.js';

export const Navbar = () => {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchCount = async () => {
      if (isAuthenticated) {
        try {
          const res = await getUnreadCount();
          if (isMounted && res.success) {
            setUnreadNotifications(res.data.unreadCount || 0);
          }
        } catch (err) {
          // silently handle
        }
      } else {
        if (isMounted) setUnreadNotifications(0);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully.', 'info');
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate('/login');
  };

  // Helper for role dashboard route
  const getDashboardRoute = () => {
    switch (currentUser?.role) {
      case 'home':
        return '/home/dashboard';
      case 'volunteer':
        return '/volunteer/dashboard';
      case 'admin':
        return '/admin/dashboard';
      case 'donor':
      default:
        return '/donor/dashboard';
    }
  };

  const navLinkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'text-teal-700 bg-teal-50 font-semibold'
        : 'text-slate-600 hover:text-teal-700 hover:bg-slate-50'
    }`;

  return (
    <nav className="bg-white/90 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand Logo & Title */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group transition-transform active:scale-95"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:shadow-teal-500/30 transition-shadow">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 bg-clip-text text-transparent">
                  CareConnect
                </span>
                <span className="text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-800">
                  Care
                </span>
              </div>
              <p className="text-[11px] text-slate-500 -mt-1 hidden sm:block">
                Bridging Hearts &amp; Elderly Homes
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            <NavLink to="/" className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/search/homes" className={navLinkClass}>
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                Find Homes
              </span>
            </NavLink>
            <NavLink to="/search/donations" className={navLinkClass}>
              <span className="flex items-center gap-1.5">
                <Heart className="w-4 h-4" />
                Donation Needs
              </span>
            </NavLink>
            <NavLink to="/volunteer/opportunities" className={navLinkClass}>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                Volunteer
              </span>
            </NavLink>

            {isAuthenticated ? (
              <>
                <NavLink to={getDashboardRoute()} className={navLinkClass}>
                  <span className="flex items-center gap-1.5">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </span>
                </NavLink>

                {currentUser?.role === 'donor' && (
                  <NavLink to="/tracking/donations" className={navLinkClass}>
                    <span className="flex items-center gap-1.5">
                      <PackageCheck className="w-4 h-4" />
                      Track Donations
                    </span>
                  </NavLink>
                )}

                {currentUser?.role === 'volunteer' && (
                  <NavLink to="/tracking/volunteer-applications" className={navLinkClass}>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      My Applications
                    </span>
                  </NavLink>
                )}

                <NavLink to="/notifications" className={navLinkClass}>
                  <span className="flex items-center gap-1.5 relative">
                    <Bell className="w-4 h-4" />
                    Notifications
                    {unreadNotifications > 0 && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white leading-tight">
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </span>
                    )}
                  </span>
                </NavLink>
              </>
            ) : null}
          </div>

          {/* Desktop Right Actions (Auth / User Profile Dropdown) */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 pl-3 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100/80 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-800 leading-none truncate max-w-[120px]">
                      {currentUser?.name || 'User'}
                    </p>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-teal-700 bg-teal-50 px-1 rounded inline-block mt-0.5">
                      {currentUser?.role || 'donor'}
                    </span>
                  </div>
                  {currentUser?.profileImage ? (
                    <img
                      src={currentUser.profileImage}
                      alt={currentUser.name}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-teal-500/30"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                      {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 mr-1" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-100 mb-1">
                      <p className="text-xs text-slate-500">Signed in as</p>
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {currentUser?.email}
                      </p>
                    </div>

                    <Link
                      to={getDashboardRoute()}
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-teal-700 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-slate-400" />
                      Dashboard
                    </Link>

                    {currentUser?.role === 'donor' && (
                      <>
                        <Link
                          to="/donations/create"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-teal-700 transition-colors"
                        >
                          <Heart className="w-4 h-4 text-rose-500" />
                          Pledge Donation
                        </Link>
                        <Link
                          to="/tracking/donations"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-teal-700 transition-colors"
                        >
                          <PackageCheck className="w-4 h-4 text-slate-400" />
                          Track Donations
                        </Link>
                      </>
                    )}

                    {currentUser?.role === 'volunteer' && (
                      <Link
                        to="/tracking/volunteer-applications"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-teal-700 transition-colors"
                      >
                        <Users className="w-4 h-4 text-teal-600" />
                        My Applications
                      </Link>
                    )}

                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-teal-700 transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      View Profile
                    </Link>

                    <Link
                      to="/activity"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-teal-700 transition-colors"
                    >
                      <History className="w-4 h-4 text-slate-400" />
                      Activity History
                    </Link>

                    <Link
                      to="/notifications"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center justify-between px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-teal-700 transition-colors"
                    >
                      <span className="flex items-center gap-2.5">
                        <Bell className="w-4 h-4 text-slate-400" />
                        Notifications
                      </span>
                      {unreadNotifications > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                          {unreadNotifications}
                        </span>
                      )}
                    </Link>

                    <div className="border-t border-slate-100 my-1"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors text-left font-medium"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-teal-700 transition-colors rounded-xl hover:bg-slate-100"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 rounded-xl shadow-sm shadow-teal-600/20 hover:shadow-teal-600/30 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  Join CareConnect
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            {isAuthenticated && (
              <Link to="/notifications" className="relative p-2 text-slate-600">
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500"></span>
                )}
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-md px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top duration-200">
          <NavLink
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-xl text-base font-medium ${
                isActive ? 'bg-teal-50 text-teal-800 font-semibold' : 'text-slate-700 hover:bg-slate-50'
              }`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/search/homes"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-xl text-base font-medium ${
                isActive ? 'bg-teal-50 text-teal-800 font-semibold' : 'text-slate-700 hover:bg-slate-50'
              }`
            }
          >
            <Building2 className="w-4 h-4 text-teal-600" />
            Find Homes
          </NavLink>
          <NavLink
            to="/search/donations"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-xl text-base font-medium ${
                isActive ? 'bg-teal-50 text-teal-800 font-semibold' : 'text-slate-700 hover:bg-slate-50'
              }`
            }
          >
            <Heart className="w-4 h-4 text-rose-500" />
            Donation Needs
          </NavLink>
          <NavLink
            to="/volunteer/opportunities"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-xl text-base font-medium ${
                isActive ? 'bg-teal-50 text-teal-800 font-semibold' : 'text-slate-700 hover:bg-slate-50'
              }`
            }
          >
            <Users className="w-4 h-4 text-teal-600" />
            Volunteer Opportunities
          </NavLink>

          {isAuthenticated ? (
            <>
              <div className="border-t border-slate-100 my-2 pt-2"></div>
              <NavLink
                to={getDashboardRoute()}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-xl text-base font-medium ${
                    isActive ? 'bg-teal-50 text-teal-800 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                  }`
                }
              >
                <LayoutDashboard className="w-5 h-5 text-teal-600" />
                Dashboard ({currentUser?.role})
              </NavLink>
              {currentUser?.role === 'donor' && (
                <NavLink
                  to="/tracking/donations"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-xl text-base font-medium ${
                      isActive ? 'bg-teal-50 text-teal-800 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  <PackageCheck className="w-5 h-5 text-teal-600" />
                  Track Donations
                </NavLink>
              )}
              {currentUser?.role === 'volunteer' && (
                <NavLink
                  to="/tracking/volunteer-applications"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-xl text-base font-medium ${
                      isActive ? 'bg-teal-50 text-teal-800 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  <Users className="w-5 h-5 text-teal-600" />
                  My Applications
                </NavLink>
              )}
              <NavLink
                to="/activity"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-xl text-base font-medium ${
                    isActive ? 'bg-teal-50 text-teal-800 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                  }`
                }
              >
                <History className="w-5 h-5 text-teal-600" />
                Activity History
              </NavLink>
              <NavLink
                to="/notifications"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-xl text-base font-medium ${
                    isActive ? 'bg-teal-50 text-teal-800 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                  }`
                }
              >
                <span className="flex items-center gap-2.5">
                  <Bell className="w-5 h-5 text-teal-600" />
                  Notifications
                </span>
                {unreadNotifications > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white">
                    {unreadNotifications}
                  </span>
                )}
              </NavLink>

              <div className="border-t border-slate-100 my-2 pt-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-base font-semibold text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="w-5 h-5" />
                  Logout ({currentUser?.name})
                </button>
              </div>
            </>
          ) : (
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 px-4 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 font-semibold text-white shadow-sm shadow-teal-600/30"
              >
                Register Account
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
