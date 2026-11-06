import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';

// Components
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import RoleProtectedRoute from './components/RoleProtectedRoute.jsx';

// Pages — Module 1
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Profile from './pages/Profile.jsx';
import DonorDashboard from './pages/DonorDashboard.jsx';

// Pages — Module 2
import HomeDashboard from './pages/HomeDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminReview from './pages/AdminReview.jsx';

// Pages — Module 3: Donation Management
import CreateDonation from './pages/CreateDonation.jsx';
import DonationDetails from './pages/DonationDetails.jsx';

// Pages — Module 4: Volunteer Management
import VolunteerDashboard from './pages/VolunteerDashboard.jsx';
import VolunteerOpportunities from './pages/VolunteerOpportunities.jsx';
import VolunteerOpportunityDetails from './pages/VolunteerOpportunityDetails.jsx';
import VolunteerProfilePage from './pages/VolunteerProfilePage.jsx';

// Pages — Module 6: Search, Tracking & Notification
import SearchHomes from './pages/SearchHomes.jsx';
import SearchDonations from './pages/SearchDonations.jsx';
import DonationTracking from './pages/DonationTracking.jsx';
import VolunteerTracking from './pages/VolunteerTracking.jsx';
import NotificationCenter from './pages/NotificationCenter.jsx';
import ActivityHistory from './pages/ActivityHistory.jsx';

const CURRENT_YEAR = new Date().getFullYear();

export const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
            {/* Top Navigation Bar */}
            <Navbar />

            {/* Main Application Body */}
            <main className="flex-1">
              <Routes>
                {/* 1. Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Module 6: Public Discovery & Search */}
                <Route path="/search/homes" element={<SearchHomes />} />
                <Route path="/search/donations" element={<SearchDonations />} />

                {/* Module 4: Public Volunteer Opportunity Browsing */}
                <Route path="/volunteer/opportunities" element={<VolunteerOpportunities />} />
                <Route path="/volunteer/opportunities/:id" element={<VolunteerOpportunityDetails />} />

                {/* 2. Authenticated Protected Routes (Any logged-in user) */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/donations/:id" element={<DonationDetails />} />
                  
                  {/* Module 6: Tracking, Notifications & Activity */}
                  <Route path="/notifications" element={<NotificationCenter />} />
                  <Route path="/activity" element={<ActivityHistory />} />
                  <Route path="/tracking/donations" element={<DonationTracking />} />
                  <Route path="/tracking/donations/:id" element={<DonationTracking />} />
                  <Route path="/tracking/volunteer-applications" element={<VolunteerTracking />} />
                  <Route path="/tracking/volunteer-applications/:id" element={<VolunteerTracking />} />
                </Route>

                {/* 3. Role-Protected Routes */}

                {/* Donor Dashboard & Donation Management — Module 1 & 3 */}
                <Route element={<RoleProtectedRoute allowedRoles={['donor']} />}>
                  <Route path="/donor/dashboard" element={<DonorDashboard />} />
                  <Route path="/donations/create" element={<CreateDonation />} />
                </Route>

                {/* Old-Age Home Dashboard — Module 2 */}
                <Route element={<RoleProtectedRoute allowedRoles={['home']} />}>
                  <Route path="/home/dashboard" element={<HomeDashboard />} />
                </Route>

                {/* Volunteer Routes — Module 4 */}
                <Route element={<RoleProtectedRoute allowedRoles={['volunteer']} />}>
                  <Route path="/volunteer/dashboard" element={<VolunteerDashboard />} />
                  <Route path="/volunteer/profile" element={<VolunteerProfilePage />} />
                </Route>

                {/* Admin Routes — Module 5 & Verification */}
                <Route element={<RoleProtectedRoute allowedRoles={['admin']} />}>
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/review/:id" element={<AdminReview />} />
                </Route>

                {/* Fallback Catch-all: Redirect to Home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-200/80 py-8 px-4 sm:px-6 lg:px-8 mt-auto">
              <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                  <span className="font-extrabold text-slate-800 text-sm">CareConnect</span>
                  <span>&bull;</span>
                  <span>Connecting Donors, Elderly Care Homes &amp; Volunteers</span>
                </div>
                <div>
                  <p>&copy; {CURRENT_YEAR} CareConnect. All rights reserved.</p>
                </div>
              </div>
            </footer>
          </div>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
