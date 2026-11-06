import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Check,
  Loader2,
  Lock,
  Sparkles,
  AlertCircle
} from 'lucide-react';

export const Profile = () => {
  const { currentUser, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');

  // Editable fields
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    location: currentUser?.location || '',
    profileImage: currentUser?.profileImage || ''
  });

  const [formErrors, setFormErrors] = useState({});

  // Preset avatar choices for quick convenience
  const presetAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80'
  ];

  // Sync form when currentUser is loaded
  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        phone: currentUser.phone || '',
        location: currentUser.location || '',
        profileImage: currentUser.profileImage || ''
      });
    }
  }, [currentUser]);

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Please enter your name.';
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Please enter your phone number.';
    }
    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (serverError) {
      setServerError('');
    }
  };

  const handleSelectPresetAvatar = (url) => {
    setFormData((prev) => ({ ...prev, profileImage: url }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    setSaving(true);

    try {
      const response = await updateProfile(formData);
      if (response.success) {
        showToast('Profile updated successfully.', 'success');
        setIsEditing(false);
      } else {
        setServerError(response.message || 'Failed to update profile.');
        showToast(response.message || 'Failed to update profile.', 'error');
      }
    } catch (err) {
      const msg = err.customMessage || 'Something went wrong while updating profile.';
      setServerError(msg);
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        phone: currentUser.phone || '',
        location: currentUser.location || '',
        profileImage: currentUser.profileImage || ''
      });
    }
    setFormErrors({});
    setServerError('');
    setIsEditing(false);
  };

  // Format account creation date
  const formattedCreationDate = currentUser?.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Recently';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            User Profile
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Manage your personal details and view your account information.
          </p>
        </div>

        {!isEditing ? (
          <button
            type="button"
            id="edit-profile-btn"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-all shadow-teal-600/20"
          >
            Edit Profile
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl transition-all disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              id="save-profile-btn"
              onClick={handleSubmit}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-all disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating profile...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {serverError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm font-medium">{serverError}</div>
        </div>
      )}

      {/* Main Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 relative">
          <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-semibold flex items-center gap-1.5 border border-white/20">
            <Sparkles className="w-3.5 h-3.5" />
            CareConnect Member
          </div>
        </div>

        {/* Profile Header Content */}
        <div className="px-6 sm:px-10 pb-8 pt-0 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 -mt-16 mb-6">
            {/* Avatar */}
            <div className="relative group">
              {formData.profileImage ? (
                <img
                  src={formData.profileImage}
                  alt={currentUser?.name}
                  className="w-28 h-28 rounded-2xl object-cover ring-4 ring-white shadow-md bg-white"
                />
              ) : (
                <div className="w-28 h-28 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-600 text-white font-extrabold text-4xl flex items-center justify-center ring-4 ring-white shadow-md">
                  {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mb-1">
                <h2 className="text-2xl font-bold text-slate-900">{currentUser?.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-100 text-teal-800 border border-teal-200">
                  {currentUser?.role || 'donor'}
                </span>
              </div>
              <p className="text-sm text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {currentUser?.email}
              </p>
            </div>
          </div>

          {/* Preset Avatar Selection when Editing */}
          {isEditing && (
            <div className="mb-8 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Choose an Avatar or Paste an Image URL
              </label>
              <div className="flex flex-wrap gap-2.5 mb-3">
                {presetAvatars.map((url, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectPresetAvatar(url)}
                    className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${
                      formData.profileImage === url
                        ? 'border-teal-600 ring-2 ring-teal-500/20 scale-105'
                        : 'border-transparent hover:border-slate-300'
                    }`}
                  >
                    <img src={url} alt={`Avatar ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              <div className="relative">
                <input
                  type="url"
                  name="profileImage"
                  id="profile-image-input"
                  placeholder="Or enter custom image URL (e.g. https://...)"
                  value={formData.profileImage}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                />
              </div>
            </div>
          )}

          {/* Profile Form Details */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Full Name (Editable) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name {isEditing && <span className="text-rose-500">*</span>}
                </label>
                {isEditing ? (
                  <div>
                    <input
                      type="text"
                      name="name"
                      id="profile-name-input"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                        formErrors.name
                          ? 'border-rose-300 bg-rose-50/20 focus:ring-rose-500/20'
                          : 'border-slate-300 bg-white focus:border-teal-600 focus:ring-teal-600/20'
                      }`}
                    />
                    {formErrors.name && (
                      <p className="text-xs text-rose-600 mt-1">{formErrors.name}</p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-sm text-slate-800 font-medium">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>{currentUser?.name}</span>
                  </div>
                )}
              </div>

              {/* Phone Number (Editable) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Phone Number {isEditing && <span className="text-rose-500">*</span>}
                </label>
                {isEditing ? (
                  <div>
                    <input
                      type="tel"
                      name="phone"
                      id="profile-phone-input"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                        formErrors.phone
                          ? 'border-rose-300 bg-rose-50/20 focus:ring-rose-500/20'
                          : 'border-slate-300 bg-white focus:border-teal-600 focus:ring-teal-600/20'
                      }`}
                    />
                    {formErrors.phone && (
                      <p className="text-xs text-rose-600 mt-1">{formErrors.phone}</p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-sm text-slate-800 font-medium">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{currentUser?.phone || 'Not provided'}</span>
                  </div>
                )}
              </div>

              {/* Email Address (Immutable - Read Only) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Email Address
                  </label>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" />
                    Verified / Immutable
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100/80 border border-slate-200/80 text-sm text-slate-600">
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="font-mono text-xs">{currentUser?.email}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                    Fixed
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Email change requires verification and is secured against direct edits.
                </p>
              </div>

              {/* Role (Immutable - Read Only) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    System Role
                  </label>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-slate-400" />
                    Protected
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100/80 border border-slate-200/80 text-sm text-slate-600">
                  <div className="flex items-center gap-2.5">
                    <Shield className="w-4 h-4 text-teal-600" />
                    <span className="font-semibold text-slate-800 capitalize">
                      {currentUser?.role}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 px-2 py-0.5 rounded">
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Roles cannot be changed once created for account integrity.
                </p>
              </div>

              {/* Location (Editable) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  City / Location
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="location"
                    id="profile-location-input"
                    placeholder="e.g. Bangalore, Karnataka"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                  />
                ) : (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-sm text-slate-800 font-medium">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{currentUser?.location || 'Not specified'}</span>
                  </div>
                )}
              </div>

              {/* Account Creation Date (Read-Only) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Account Created
                </label>
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-sm text-slate-800 font-medium">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>{formattedCreationDate}</span>
                </div>
              </div>
            </div>

            {/* Mobile save button */}
            {isEditing && (
              <div className="pt-4 flex sm:hidden flex-col gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 bg-teal-600 text-white font-bold text-sm rounded-xl shadow-xs"
                >
                  {saving ? 'Updating profile...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full py-2.5 border border-slate-300 text-slate-700 font-semibold text-sm rounded-xl"
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
