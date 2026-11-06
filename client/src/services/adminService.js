import api from './api.js';

const adminService = {
  // Dashboard platform statistics
  getDashboard: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  // User management
  getUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  getUserById: async (id) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  suspendUser: async (id, reason) => {
    const response = await api.patch(`/admin/users/${id}/suspend`, { reason });
    return response.data;
  },

  reactivateUser: async (id, reason) => {
    const response = await api.patch(`/admin/users/${id}/reactivate`, { reason });
    return response.data;
  },

  // Home verification
  getHomes: async (params = {}) => {
    const response = await api.get('/admin/homes', { params });
    return response.data;
  },

  getPendingHomes: async () => {
    const response = await api.get('/admin/homes/pending');
    return response.data;
  },

  getHomeById: async (id) => {
    const response = await api.get(`/admin/homes/${id}`);
    return response.data;
  },

  verifyHome: async (id, data = {}) => {
    const response = await api.patch(`/admin/homes/${id}/verify`, data);
    return response.data;
  },

  rejectHome: async (id, data = {}) => {
    const response = await api.patch(`/admin/homes/${id}/reject`, data);
    return response.data;
  },

  requestInformation: async (id, data = {}) => {
    const response = await api.patch(`/admin/homes/${id}/request-information`, data);
    return response.data;
  },

  // Donation monitoring
  getDonations: async (params = {}) => {
    const response = await api.get('/admin/donations', { params });
    return response.data;
  },

  // Volunteer monitoring
  getVolunteers: async (params = {}) => {
    const response = await api.get('/admin/volunteers', { params });
    return response.data;
  },

  getVolunteerOpportunities: async (params = {}) => {
    const response = await api.get('/admin/volunteer-opportunities', { params });
    return response.data;
  },

  getVolunteerApplications: async (params = {}) => {
    const response = await api.get('/admin/volunteer-applications', { params });
    return response.data;
  },

  // Donation categories
  getCategories: async () => {
    const response = await api.get('/admin/categories');
    return response.data;
  },

  createCategory: async (data) => {
    const response = await api.post('/admin/categories', data);
    return response.data;
  },

  updateCategory: async (id, data) => {
    const response = await api.put(`/admin/categories/${id}`, data);
    return response.data;
  },

  toggleCategoryStatus: async (id, isActive) => {
    const response = await api.patch(`/admin/categories/${id}/status`, { isActive });
    return response.data;
  },

  deleteCategory: async (id) => {
    const response = await api.delete(`/admin/categories/${id}`);
    return response.data;
  },

  // Reports & moderation
  getReports: async (params = {}) => {
    const response = await api.get('/admin/reports', { params });
    return response.data;
  },

  getReportById: async (id) => {
    const response = await api.get(`/admin/reports/${id}`);
    return response.data;
  },

  updateReportStatus: async (id, data) => {
    const response = await api.patch(`/admin/reports/${id}/status`, data);
    return response.data;
  },

  // Audit trail
  getAuditActions: async (params = {}) => {
    const response = await api.get('/admin/actions', { params });
    return response.data;
  }
};

export default adminService;

