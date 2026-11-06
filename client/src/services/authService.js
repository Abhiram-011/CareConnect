import api from './api.js';

export const authService = {
  // Register new user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Login existing user
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Verify OTP code
  verifyOTP: async (payload) => {
    const response = await api.post('/auth/verify-otp', payload);
    return response.data;
  },

  // Resend OTP code
  resendOTP: async (payload) => {
    const response = await api.post('/auth/resend-otp', payload);
    return response.data;
  },

  // Forgot password - send OTP
  forgotPassword: async (payload) => {
    const response = await api.post('/auth/forgot-password', payload);
    return response.data;
  },

  // Reset password with OTP
  resetPassword: async (payload) => {
    const response = await api.post('/auth/reset-password', payload);
    return response.data;
  },

  // Get current logged-in user profile
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Update profile
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },

  // Role validation test endpoints
  testDonorRole: async () => {
    const response = await api.get('/auth/donor-check');
    return response.data;
  },

  testAdminRole: async () => {
    const response = await api.get('/auth/admin-check');
    return response.data;
  }
};

export default authService;
