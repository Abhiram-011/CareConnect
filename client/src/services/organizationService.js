import api from './api.js';

export const organizationService = {
  // Submit verification request with documents
  submitVerification: async (formData) => {
    const response = await api.post('/organizations/verification', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Get current logged-in old-age home's organization & verification status
  getMyOrganization: async () => {
    const response = await api.get('/organizations/my-organization');
    return response.data;
  },

  // Get public organizations listing with search and status filters
  getPublicOrganizations: async (params = {}) => {
    const response = await api.get('/organizations/public', { params });
    return response.data;
  },

  // Get public organization profile by ID
  getPublicOrganizationById: async (id) => {
    const response = await api.get(`/organizations/public/${id}`);
    return response.data;
  },

  // Admin: Get all verification requests
  getAdminVerifications: async (params = {}) => {
    const response = await api.get('/organizations/admin/list', { params });
    return response.data;
  },

  // Admin: Get verification summary metrics
  getAdminVerificationStats: async () => {
    const response = await api.get('/organizations/admin/stats');
    return response.data;
  },

  // Admin: Get single verification request for deep review
  getAdminVerificationById: async (id) => {
    const response = await api.get(`/organizations/admin/review/${id}`);
    return response.data;
  },

  // Admin: Approve verification
  approveVerification: async (id, data) => {
    const response = await api.patch(`/organizations/admin/approve/${id}`, data);
    return response.data;
  },

  // Admin: Reject verification with reason
  rejectVerification: async (id, data) => {
    const response = await api.patch(`/organizations/admin/reject/${id}`, data);
    return response.data;
  }
};

export default organizationService;
