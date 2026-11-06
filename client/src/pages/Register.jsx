import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Heart,
  Home,
  Users,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const Register = () => {
  const { register, verifyOTP, resendOTP } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'donor'
  });

  const [step, setStep] = useState(1); // 1: Registration Form, 2: OTP Verification
  const [otpCode, setOtpCode] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const roleOptions = [
    {
      id: 'donor',
      title: 'Donor',
      description: 'Support verified old-age homes with donations & essential supplies.',
      icon: Heart,
      badgeColor: 'border-rose-200 bg-rose-50/50 text-rose-700'
    },
    {
      id: 'home',
      title: 'Old-Age Home',
      description: 'List your elderly home, publish genuine needs & receive support.',
      icon: Home,
      badgeColor: 'border-blue-200 bg-blue-50/50 text-blue-700'
    },
    {
      id: 'volunteer',
      title: 'Volunteer',
      description: 'Offer time, companionship, healthcare assistance or logistics.',
      icon: Users,
      badgeColor: 'border-amber-200 bg-amber-50/50 text-amber-700'
    }
  ];

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Please enter your name.';
    }

    if (!formData.email.trim()) {
      errors.email = 'Please enter your email.';
    } else {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.email.trim())) {
        errors.email = 'Please enter a valid email.';
      }
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Please enter your phone number.';
    }

    if (!formData.password) {
      errors.password = 'Please enter a password.';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long.';
    }

    if (formData.confirmPassword !== formData.password) {
      errors.confirmPassword = 'Passwords do not match.';
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

  const handleRoleSelect = (roleId) => {
    setFormData((prev) => ({ ...prev, role: roleId }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    setSubmitting(true);

    try {
      const response = await register(formData);
      if (response.success && response.requiresOtp) {
        showToast('OTP verification code sent to your email!', 'success');
        setStep(2);
      } else if (response.success) {
        showToast('Account created successfully.', 'success');
        redirectUser(formData.role);
      } else {
        setServerError(response.message || 'Registration failed. Please try again.');
        showToast(response.message || 'Registration failed.', 'error');
      }
    } catch (err) {
      const message = err.customMessage || 'An account with this email already exists.';
      setServerError(message);
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      showToast('Please enter the 6-digit OTP code.', 'error');
      return;
    }

    setVerifyingOtp(true);
    try {
      const res = await verifyOTP(formData.email, otpCode.trim());
      if (res.success) {
        showToast('Email verified successfully! Welcome to CareConnect.', 'success');
        redirectUser(formData.role);
      } else {
        showToast(res.message || 'OTP verification failed.', 'error');
      }
    } catch (err) {
      showToast(err.customMessage || 'Invalid or expired OTP code.', 'error');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResend = async () => {
    setResendingOtp(true);
    try {
      const res = await resendOTP(formData.email, 'registration');
      if (res.success) {
        showToast('A fresh OTP code has been dispatched to your email.', 'success');
      }
    } catch (err) {
      showToast(err.customMessage || 'Failed to resend OTP.', 'error');
    } finally {
      setResendingOtp(false);
    }
  };

  const redirectUser = (role) => {
    if (role === 'donor') {
      navigate('/donor/dashboard');
    } else if (role === 'home') {
      navigate('/home/dashboard');
    } else if (role === 'volunteer') {
      navigate('/volunteer/dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center bg-gradient-to-b from-slate-50 via-teal-50/20 to-slate-100">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-6 sm:p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 text-teal-600 mb-4 shadow-xs">
            {step === 1 ? (
              <Heart className="w-7 h-7 fill-teal-600/20 text-teal-600" />
            ) : (
              <ShieldCheck className="w-7 h-7 text-teal-600" />
            )}
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {step === 1 ? 'Create Your Account' : 'Verify Your Email'}
          </h1>
          <p className="text-slate-600 mt-2 text-sm sm:text-base">
            {step === 1
              ? 'Join the CareConnect community to support or manage elderly care homes.'
              : `We sent a 6-digit security code to ${formData.email}. Please enter it below.`}
          </p>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-sm font-medium">{serverError}</div>
          </div>
        )}

        {/* STEP 2: OTP VERIFICATION VIEW */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtpSubmit} className="space-y-6">
            <div className="p-6 rounded-2xl bg-teal-50/50 border border-teal-100 text-center space-y-4">
              <label className="block text-sm font-bold text-slate-800">
                Enter 6-Digit OTP Code
              </label>
              <input
                type="text"
                maxLength={6}
                autoFocus
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-48 mx-auto text-center text-3xl font-extrabold tracking-widest px-4 py-3 rounded-2xl border-2 border-teal-600 bg-white text-teal-950 shadow-sm focus:outline-none focus:ring-4 focus:ring-teal-600/20"
              />
              <p className="text-xs text-slate-500">
                Code expires in 10 minutes. Check your inbox and spam folder.
              </p>
            </div>

            <button
              type="submit"
              disabled={verifyingOtp || otpCode.length !== 6}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-md shadow-teal-600/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {verifyingOtp ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verifying code...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Verify Identity & Enter Dashboard</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs text-slate-600 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-slate-500 hover:text-slate-800 font-medium"
              >
                &larr; Back to edit email
              </button>

              <button
                type="button"
                disabled={resendingOtp}
                onClick={handleResend}
                className="font-bold text-teal-700 hover:underline disabled:opacity-50"
              >
                {resendingOtp ? 'Sending code...' : 'Resend Code'}
              </button>
            </div>
          </form>
        )}

        {/* STEP 1: REGISTRATION FORM */}
        {step === 1 && (
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              Select Your Role <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {roleOptions.map((opt) => {
                const IconComponent = opt.icon;
                const isSelected = formData.role === opt.id;
                return (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => handleRoleSelect(opt.id)}
                    className={`relative p-4 rounded-2xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50/60 shadow-sm ring-2 ring-teal-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-teal-600" />
                      )}
                    </div>
                    <p className="font-bold text-slate-900 text-sm">{opt.title}</p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {opt.description}
                    </p>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              Administrative roles are provisioned internally by system security.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="name"
                  id="register-name"
                  placeholder="e.g. Abhiram Sharma"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                    formErrors.name
                      ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-500/20 text-slate-900'
                      : 'border-slate-300 bg-white focus:border-teal-600 focus:ring-teal-600/20 text-slate-900'
                  }`}
                />
              </div>
              {formErrors.name && (
                <p className="text-xs text-rose-600 mt-1">{formErrors.name}</p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  name="email"
                  id="register-email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                    formErrors.email
                      ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-500/20 text-slate-900'
                      : 'border-slate-300 bg-white focus:border-teal-600 focus:ring-teal-600/20 text-slate-900'
                  }`}
                />
              </div>
              {formErrors.email && (
                <p className="text-xs text-rose-600 mt-1">{formErrors.email}</p>
              )}
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Phone Number <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                name="phone"
                id="register-phone"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                  formErrors.phone
                    ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-500/20 text-slate-900'
                    : 'border-slate-300 bg-white focus:border-teal-600 focus:ring-teal-600/20 text-slate-900'
                }`}
              />
            </div>
            {formErrors.phone && (
              <p className="text-xs text-rose-600 mt-1">{formErrors.phone}</p>
            )}
          </div>

          {/* Passwords Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  id="register-password"
                  placeholder="Min. 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                    formErrors.password
                      ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-500/20 text-slate-900'
                      : 'border-slate-300 bg-white focus:border-teal-600 focus:ring-teal-600/20 text-slate-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                  aria-label="Toggle password view"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formErrors.password && (
                <p className="text-xs text-rose-600 mt-1">{formErrors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  id="register-confirm-password"
                  placeholder="Repeat your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                    formErrors.confirmPassword
                      ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-500/20 text-slate-900'
                      : 'border-slate-300 bg-white focus:border-teal-600 focus:ring-teal-600/20 text-slate-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                  aria-label="Toggle confirm password view"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formErrors.confirmPassword && (
                <p className="text-xs text-rose-600 mt-1">{formErrors.confirmPassword}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="register-submit-btn"
            disabled={submitting}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-md shadow-teal-600/25 transition-all transform active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creating account...</span>
              </>
            ) : (
              <span>Complete Registration</span>
            )}
          </button>

          {/* Login Link */}
          <div className="text-center pt-2">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-bold text-teal-700 hover:text-teal-800 hover:underline"
              >
                Log in here
              </Link>
            </p>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

export default Register;
