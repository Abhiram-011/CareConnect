import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  PackageCheck,
  Search,
  Filter,
  Calendar,
  Building2,
  Clock,
  RotateCcw,
  Eye,
  X,
  Truck,
  CheckCircle2,
  AlertCircle,
  Heart
} from 'lucide-react';
import { getDonationsTracking, getDonationTrackingById } from '../services/trackingService.js';
import { DonationTimeline } from '../components/DonationTimeline.jsx';
import { DonationStatusBadge } from '../components/DonationStatusBadge.jsx';

export const DonationTracking = () => {
  const { id: paramId } = useParams();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected donation for detailed timeline modal
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await getDonationsTracking(params);
      if (res.success) {
        setDonations(res.data.donations || []);
      }
    } catch (err) {
      console.error('Error fetching tracking list:', err);
      setError('Unable to load donation tracking data.');
    } finally {
      setLoading(false);
    }
  };

  const openDetails = async (donationId) => {
    try {
      setLoadingDetails(true);
      const res = await getDonationTrackingById(donationId);
      if (res.success) {
        setSelectedDonation(res.data.donation);
      }
    } catch (err) {
      console.error('Error loading donation details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, [statusFilter]);

  // If navigated with :id parameter, load that donation directly
  useEffect(() => {
    if (paramId) {
      openDetails(paramId);
    }
  }, [paramId]);

  const filteredDonations = donations.filter((d) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (d._id && d._id.toLowerCase().includes(term)) ||
      (d.itemName && d.itemName.toLowerCase().includes(term)) ||
      (d.homeId?.name && d.homeId.name.toLowerCase().includes(term)) ||
      (d.category && d.category.toLowerCase().includes(term))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <PackageCheck className="w-8 h-8 text-teal-600" />
              Donation Tracking
            </h1>
            <p className="mt-1 text-slate-600 text-sm max-w-2xl">
              Track the live journey and fulfillment status of your donated goods from initial pledge through delivery and receipt confirmation.
            </p>
          </div>
          <Link
            to="/donations/create"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 shadow-xs transition-colors self-start md:self-auto"
          >
            <Heart className="w-4 h-4" />
            Pledge New Donation
          </Link>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Donation ID, item name, or old-age home..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">PENDING (Awaiting Review)</option>
              <option value="ACCEPTED">ACCEPTED (Approved)</option>
              <option value="SCHEDULED">SCHEDULED (Delivery Set)</option>
              <option value="DELIVERED">DELIVERED (In Transit / Delivered)</option>
              <option value="COMPLETED">COMPLETED (Confirmed)</option>
              <option value="REJECTED">REJECTED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Donations List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse h-28"></div>
          ))}
        </div>
      ) : filteredDonations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <PackageCheck className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No Donations Found</h3>
          <p className="text-sm text-slate-500 mt-1 mb-5">
            You don't have any donations matching the selected criteria.
          </p>
          <Link
            to="/donations/create"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-xs"
          >
            <Heart className="w-4 h-4" />
            Make a Donation
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDonations.map((donation) => (
            <div
              key={donation._id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 hover:border-teal-300 hover:shadow-xs transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-slate-400">
                    ID: #{donation._id.slice(-6).toUpperCase()}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {donation.category}
                  </span>
                  <DonationStatusBadge status={donation.status} size="sm" />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {donation.itemName} &times; {donation.quantity} {donation.unit || ''}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-teal-600" />
                      Recipient:{' '}
                      <strong className="text-slate-700">
                        {donation.homeId?.name || 'Care Facility'}
                      </strong>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                  <span>
                    Submitted: {new Date(donation.createdAt).toLocaleDateString([], { dateStyle: 'medium' })}
                  </span>
                  {donation.preferredDeliveryDate && (
                    <span>
                      Target Delivery: {new Date(donation.preferredDeliveryDate).toLocaleDateString([], { dateStyle: 'medium' })}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                <button
                  onClick={() => openDetails(donation._id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  View Timeline &amp; Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details & Timeline Modal */}
      {selectedDonation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-mono font-semibold text-slate-400">
                  DONATION TRACKING #{selectedDonation._id.toUpperCase()}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                  {selectedDonation.itemName} ({selectedDonation.quantity} {selectedDonation.unit || ''})
                </h3>
              </div>
              <button
                onClick={() => setSelectedDonation(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-6 space-y-6">
              {/* Visual Timeline Component */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Progress Progression
                </h4>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <DonationTimeline
                    currentStatus={selectedDonation.status}
                    statusHistory={selectedDonation.statusHistory || []}
                  />
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Old-Age Home</span>
                  <span className="font-semibold text-slate-800 text-sm">
                    {selectedDonation.homeId?.name || 'Registered Home'}
                  </span>
                  {selectedDonation.homeId?.address && (
                    <span className="text-slate-500 block mt-0.5">
                      {[selectedDonation.homeId.address, selectedDonation.homeId.city].filter(Boolean).join(', ')}
                    </span>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Donation Category</span>
                  <span className="font-semibold text-slate-800 text-sm">
                    {selectedDonation.category}
                  </span>
                  <span className="text-slate-500 block mt-0.5">
                    Quantity: {selectedDonation.quantity} {selectedDonation.unit || 'items'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Submission Date</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(selectedDonation.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Preferred Delivery Date</span>
                  <span className="font-semibold text-slate-800">
                    {selectedDonation.preferredDeliveryDate
                      ? new Date(selectedDonation.preferredDeliveryDate).toLocaleDateString([], { dateStyle: 'medium' })
                      : 'Flexible delivery'}
                  </span>
                </div>
              </div>

              {selectedDonation.notes && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <span className="text-slate-400 block mb-0.5">Donor's Message / Notes</span>
                  <p className="text-slate-700 italic">"{selectedDonation.notes}"</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <Link
                to={`/donations/${selectedDonation._id}`}
                className="text-xs font-semibold text-teal-700 hover:underline"
              >
                Go to Full Donation Page &rarr;
              </Link>
              <button
                onClick={() => setSelectedDonation(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationTracking;

