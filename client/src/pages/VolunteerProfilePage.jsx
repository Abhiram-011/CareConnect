import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import volunteerService from '../services/volunteerService.js';
import {
  User,
  HeartHandshake,
  MapPin,
  Mail,
  Phone,
  Briefcase,
  CheckCircle2,
  Sparkles,
  Loader2,
  Save,
  Clock,
  Award
} from 'lucide-react';

const COMMON_SKILLS = [
  'Elder Care',
  'Companionship',
  'Storytelling',
  'Singing & Music',
  'Art & Craft',
  'First Aid & Nursing',
  'Physical Exercise / Yoga',
  'Reading & Writing Help',
  'Cooking & Meal Distribution',
  'Event Coordination',
  'Digital Literacy for Seniors'
];

const AVAILABILITY_OPTIONS = [
  'Weekdays Morning',
  'Weekdays Afternoon',
  'Weekdays Evening',
  'Weekends Morning',
  'Weekends Afternoon',
  'Weekends Evening',
  'Flexible'
];

const WORK_TYPES = [
  'Companionship and social activities',
  'Food and essential-supply distribution',
  'Educational or recreational activities',
  'Event assistance',
  'General support'
];

export const VolunteerProfilePage = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    bio: '',
    skills: [],
    interests: [],
    availability: ['Flexible'],
    preferredLocation: '',
    preferredWorkTypes: [],
    experience: ''
  });

  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await volunteerService.getProfile();
      if (res.data?.profile) {
        const p = res.data.profile;
        setFormData({
          bio: p.bio || '',
          skills: p.skills || [],
          interests: p.interests || [],
          availability: p.availability && p.availability.length ? p.availability : ['Flexible'],
          preferredLocation: p.preferredLocation || currentUser?.location || '',
          preferredWorkTypes: p.preferredWorkTypes || [],
          experience: p.experience || ''
        });
      }
    } catch (err) {
      showToast(err.customMessage || 'Failed to load volunteer profile.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleArrayItem = (field, item) => {
    setFormData((prev) => {
      const currentList = prev[field] || [];
      if (currentList.includes(item)) {
        return { ...prev, [field]: currentList.filter((x) => x !== item) };
      } else {
        return { ...prev, [field]: [...currentList, item] };
      }
    });
  };

  const handleAddCustomSkill = (e) => {
    e.preventDefault();
    if (!skillInput.trim()) return;
    const trimmed = skillInput.trim();
    if (!formData.skills.includes(trimmed)) {
      setFormData((prev) => ({ ...prev, skills: [...prev.skills, trimmed] }));
    }
    setSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await volunteerService.updateProfile(formData);
      showToast(res.message || 'Volunteer profile updated successfully!', 'success');
    } catch (err) {
      showToast(err.customMessage || 'Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        <p className="mt-3 text-sm text-slate-500 font-medium">Loading volunteer profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {currentUser?.profileImage ? (
              <img
                src={currentUser.profileImage}
                alt={currentUser.name}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/20 shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-teal-600/60 border border-white/20 flex items-center justify-center text-white font-extrabold text-2xl shadow-md">
                {currentUser?.name?.charAt(0).toUpperCase() || 'V'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold">{currentUser?.name}</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-200 border border-teal-400/30 px-2 py-0.5 rounded-full">
                  Volunteer
                </span>
              </div>
              <p className="text-xs text-teal-100 flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  {currentUser?.email}
                </span>
                {currentUser?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {currentUser.phone}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800">
                Volunteer Preferences &amp; Skills
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Keep your details updated so old-age homes can understand your background when reviewing applications.
              </p>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Profile
            </button>
          </div>

          {/* Short Bio */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Introduction or Biography
            </label>
            <textarea
              name="bio"
              rows={3}
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell old-age homes a little about yourself, your passion for senior welfare, and what brings you to volunteer..."
              maxLength={1000}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 resize-none transition-all"
            />
            <p className="text-[11px] text-slate-400 text-right mt-1">
              {formData.bio.length}/1000 characters
            </p>
          </div>

          {/* Preferred Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preferred Service Location / City
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  name="preferredLocation"
                  value={formData.preferredLocation}
                  onChange={handleChange}
                  placeholder="e.g. Indiranagar, Bengaluru or Remote"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Relevant Experience (Years or Past Projects)
              </label>
              <input
                type="text"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                placeholder="e.g. 2 years at community center, storytelling workshops"
                maxLength={1500}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              />
            </div>
          </div>

          {/* Skills & Areas of Interest */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Skills &amp; Capabilities
            </label>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {COMMON_SKILLS.map((skill) => {
                const selected = formData.skills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleArrayItem('skills', skill)}
                    className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${
                      selected
                        ? 'bg-teal-50 border-teal-300 text-teal-800 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>

            {/* Custom Skill Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="Add other skill (e.g. Physiotherapy, Guitar)..."
                className="text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 flex-1 transition-all"
              />
              <button
                type="button"
                onClick={handleAddCustomSkill}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Add Skill
              </button>
            </div>

            {/* Selected Skills Chips */}
            {formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-slate-500 self-center mr-1">
                  Selected skills:
                </span>
                {formData.skills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 text-xs bg-teal-100/70 text-teal-800 px-2.5 py-1 rounded-lg"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(s)}
                      className="hover:text-rose-600 ml-1 font-bold"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Preferred Types of Volunteer Work */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Preferred Types of Volunteer Work
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {WORK_TYPES.map((type) => {
                const checked = formData.preferredWorkTypes.includes(type);
                return (
                  <label
                    key={type}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      checked
                        ? 'bg-teal-50/60 border-teal-300 text-teal-900 font-medium'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleArrayItem('preferredWorkTypes', type)}
                      className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                    />
                    <span className="text-xs">{type}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Availability */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Availability
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABILITY_OPTIONS.map((slot) => {
                const selected = formData.availability.includes(slot);
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => toggleArrayItem('availability', slot)}
                    className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${
                      selected
                        ? 'bg-teal-700 text-white font-semibold shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-teal-600/20 hover:shadow-teal-600/30 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save All Profile Details
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VolunteerProfilePage;
