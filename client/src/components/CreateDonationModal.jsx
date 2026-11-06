import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import donationService from '../services/donationService.js';
import organizationService from '../services/organizationService.js';
import VerificationBadge from './VerificationBadge.jsx';
import {
  X,
  Heart,
  Building2,
  Calendar,
  Package,
  Layers,
  FileText,
  MessageSquare,
  AlertCircle,
  Loader2,
  Info,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

const CATEGORIES = [
  'Food and groceries',
  'Clothes',
  'Medicines and medical supplies',
  'Furniture',
  'Books and educational materials',
  'Personal-care products',
  'Financial support',
  'Other'
];

export const CreateDonationModal = ({
  isOpen,
  onClose,
  preselectedHomeId = '',
  onSuccess
}) => {
  const { showToast } = useToast();

  const [homes, setHomes] = useState([]);
  const [categoriesList, setCategoriesList] = useState(CATEGORIES);
  const [loadingHomes, setLoadingHomes] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    homeId: preselectedHomeId || '',
    category: 'Food and groceries',
    itemName: '',
    description: '',
    quantity: 1,
    unit: 'units',
    message: '',
    preferredDeliveryDate: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [confirmationDonation, setConfirmationDonation] = useState(null);

  // Today's date string in YYYY-MM-DD for min date validation
  const todayStr = new Date().toISOString().split('T')[0];

  // Fetch verified old-age homes and active categories on modal open
  useEffect(() => {
    if (isOpen) {
      setConfirmationDonation(null);
      setErrors({});
      loadHomes();
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    try {
      const res = await api.get('/categories');
      if (res.data?.success && Array.isArray(res.data?.data?.categories)) {
        const catNames = res.data.data.categories.map((c) => c.name);
        if (catNames.length > 0) {
          setCategoriesList(catNames);
          // If current category not in active list, switch to first active
          if (!catNames.includes(formData.category)) {
            setFormData((prev) => ({ ...prev, category: catNames[0] }));
          }
        }
      }
    } catch (e) {
      // Fallback to static CATEGORIES
    }
  };

  useEffect(() => {
    if (preselectedHomeId) {
      setFormData((prev) => ({ ...prev, homeId: preselectedHomeId }));
    }
  }, [preselectedHomeId]);

  const loadHomes = async () => {
    try {
      setLoadingHomes(true);
      const res = await organizationService.getPublicOrganizations();
      if (res.success && res.data?.organizations) {
        setHomes(res.data.organizations);
        // Default to first home if none selected
        if (!formData.homeId && res.data.organizations.length > 0) {
          setFormData((prev) => ({
            ...prev,
            homeId: preselectedHomeId || res.data.organizations[0]._id
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load homes:', err);
      showToast('Could not load old-age homes list.', 'error');
    } finally {
      setLoadingHomes(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.homeId) {
      errs.homeId = 'Please select an old-age home destination.';
    }

    if (!formData.category) {
      errs.category = 'Please choose a donation category.';
    }

    if (formData.category === 'Financial support') {
      errs.category =
        'Financial support online gateway is coming soon. Please choose a physical supply category or contact the home directly.';
    }

    if (!formData.itemName || !formData.itemName.trim()) {
      errs.itemName = 'Please provide an item or donation title.';
    } else if (formData.itemName.trim().length > 200) {
      errs.itemName = 'Title must be 200 characters or less.';
    }

    const numQty = Number(formData.quantity);
    if (!formData.quantity || isNaN(numQty) || numQty <= 0) {
      errs.quantity = 'Quantity must be at least 1.';
    }

    if (!formData.unit || !formData.unit.trim()) {
      errs.unit = 'Please specify the measurement unit.';
    }

    if (!formData.preferredDeliveryDate) {
      errs.preferredDeliveryDate = 'Please select a preferred delivery date.';
    } else {
      const selected = new Date(formData.preferredDeliveryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected < today) {
        errs.preferredDeliveryDate = 'Preferred delivery date cannot be in the past.';
      }
    }

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showToast('Please fix the errors in the form.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await donationService.createDonation(formData);
      if (res.success && res.data?.donation) {
        setConfirmationDonation(res.data.donation);
        showToast(res.message || 'Donation request submitted!', 'success', 5000);
        if (onSuccess) {
          onSuccess(res.data.donation);
        }
      } else {
        showToast(res.message || 'Submission failed.', 'error');
      }
    } catch (err) {
      showToast(err.customMessage || 'Failed to submit donation request.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl my-8 overflow-hidden transform transition-all">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-700 to-emerald-700 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">New Donation Request</h3>
              <p className="text-xs text-teal-100">
                Pledge items or supplies to an elderly care home
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        {confirmationDonation ? (
          /* Confirmation Screen */
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
                Donation ID: #{confirmationDonation._id.slice(-6).toUpperCase()}
              </span>
              <h4 className="text-2xl font-extrabold text-slate-900">
                Donation Request Created!
              </h4>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Thank you! Your donation request for{' '}
                <span className="font-bold text-slate-800">
                  {confirmationDonation.itemName}
                </span>{' '}
                has been submitted to{' '}
                <span className="font-bold text-slate-800">
                  {confirmationDonation.homeId?.name || 'the elderly home'}
                </span>
                . The home administration will review and confirm shortly.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left max-w-md mx-auto text-xs space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Item:</span>
                <span className="font-bold text-slate-800">{confirmationDonation.itemName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Quantity:</span>
                <span className="font-bold text-slate-800">
                  {confirmationDonation.quantity} {confirmationDonation.unit}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Category:</span>
                <span className="font-medium text-slate-800">{confirmationDonation.category}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Preferred Delivery:</span>
                <span className="font-medium text-slate-800">
                  {new Date(confirmationDonation.preferredDeliveryDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md transition-colors"
              >
                Done &amp; View Dashboard
              </button>
            </div>
          </div>
        ) : (
          /* Input Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* 1. Select Home */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-teal-600" />
                Select Old-Age Home <span className="text-rose-500">*</span>
              </label>
              {loadingHomes ? (
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl text-xs text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                  Loading verified elderly care communities...
                </div>
              ) : homes.length > 0 ? (
                <select
                  name="homeId"
                  value={formData.homeId}
                  onChange={handleChange}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    errors.homeId ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                  }`}
                >
                  <option value="">-- Choose an Elderly Home --</option>
                  {homes.map((home) => (
                    <option key={home._id} value={home._id}>
                      {home.name} ({home.city}, {home.state}){' '}
                      {home.verificationStatus === 'VERIFIED' ? '✓ Verified' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                  No verified old-age homes are currently available in the database.
                </div>
              )}
              {errors.homeId && <p className="text-xs text-rose-500">{errors.homeId}</p>}
            </div>

            {/* 2. Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-teal-600" />
                Donation Category <span className="text-rose-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm border bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.category ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                }`}
              >
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat} {cat === 'Financial support' ? '(Coming Soon)' : ''}
                  </option>
                ))}
              </select>
              {formData.category === 'Financial support' && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2 text-xs text-amber-800">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Direct online financial donation is currently coming soon. For monetary contributions,
                    please reach out to the elderly home trust directly.
                  </span>
                </div>
              )}
              {errors.category && <p className="text-xs text-rose-500">{errors.category}</p>}
            </div>

            {/* 3. Item Name & Details */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-teal-600" />
                Item or Donation Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="itemName"
                value={formData.itemName}
                onChange={handleChange}
                placeholder="e.g., 25 kg Basmati Rice &amp; Cooking Oil, Blood Pressure Monitor, Winter Blankets"
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm border bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.itemName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                }`}
              />
              {errors.itemName && <p className="text-xs text-rose-500">{errors.itemName}</p>}
            </div>

            {/* 4. Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-teal-600" />
                Description / Specifications <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                name="description"
                rows={2}
                value={formData.description}
                onChange={handleChange}
                placeholder="Provide brand, condition (new/unused), expiration date, or item specifications..."
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* 5. Quantity & Unit Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Quantity <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  name="quantity"
                  min="1"
                  step="1"
                  value={formData.quantity}
                  onChange={handleChange}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    errors.quantity ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                  }`}
                />
                {errors.quantity && <p className="text-xs text-rose-500">{errors.quantity}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Unit of Measurement <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  placeholder="e.g. units, kg, boxes, packets, pairs"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    errors.unit ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                  }`}
                />
                {errors.unit && <p className="text-xs text-rose-500">{errors.unit}</p>}
              </div>
            </div>

            {/* 6. Preferred Delivery Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                Preferred Delivery Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="preferredDeliveryDate"
                min={todayStr}
                value={formData.preferredDeliveryDate}
                onChange={handleChange}
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm border bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.preferredDeliveryDate ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                }`}
              />
              <p className="text-[11px] text-slate-500">
                Please pick today or an upcoming date when you anticipate dispatching or delivering the items.
              </p>
              {errors.preferredDeliveryDate && (
                <p className="text-xs text-rose-500">{errors.preferredDeliveryDate}</p>
              )}
            </div>

            {/* 7. Message to the Home (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
                Message to the Home <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                name="message"
                rows={2}
                value={formData.message}
                onChange={handleChange}
                placeholder="Share warm wishes, reasons for donating, or note personal delivery intentions..."
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* 8. Delivery Notes / Special Instructions (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Delivery Notes / Logistics Info <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="e.g. Courier via BlueDart, Will drop off personally on Saturday afternoon"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || homes.length === 0}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4" />
                    Submit Donation Request
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateDonationModal;
