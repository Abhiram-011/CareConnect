import api from './api.js';

export const volunteerService = {
  // ----------------------------------------------------
  // Volunteer Profile
  // ----------------------------------------------------
  getProfile: async () => {
    const response = await api.get('/volunteers/profile');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/volunteers/profile', profileData);
    return response.data;
  },

  // ----------------------------------------------------
  // Volunteer Opportunities (Public / Volunteer)
  // ----------------------------------------------------
  getOpportunities: async (params = {}) => {
    const response = await api.get('/volunteer-opportunities', { params });
    return response.data;
  },

  getOpportunityById: async (id) => {
    const response = await api.get(`/volunteer-opportunities/${id}`);
    return response.data;
  },

  // ----------------------------------------------------
  // Volunteer Applications (Volunteer)
  // ----------------------------------------------------
  applyForOpportunity: async (id, applicationData) => {
    const response = await api.post(`/volunteer-opportunities/${id}/apply`, applicationData);
    return response.data;
  },

  getMyApplications: async (params = {}) => {
    const response = await api.get('/volunteer-applications/my', { params });
    return response.data;
  },

  withdrawApplication: async (id, data = {}) => {
    const response = await api.patch(`/volunteer-applications/${id}/withdraw`, data);
    return response.data;
  },

  // ----------------------------------------------------
  // Home Opportunity & Application Management (Home)
  // ----------------------------------------------------
  getHomeOpportunities: async () => {
    const response = await api.get('/homes/volunteer-opportunities');
    return response.data;
  },

  createOpportunity: async (opportunityData) => {
    const response = await api.post('/volunteer-opportunities', opportunityData);
    return response.data;
  },

  updateOpportunity: async (id, opportunityData) => {
    const response = await api.put(`/volunteer-opportunities/${id}`, opportunityData);
    return response.data;
  },

  updateOpportunityStatus: async (id, status) => {
    const response = await api.patch(`/volunteer-opportunities/${id}/status`, { status });
    return response.data;
  },

  getOpportunityApplications: async (id) => {
    const response = await api.get(`/volunteer-opportunities/${id}/applications`);
    return response.data;
  },

  acceptApplication: async (id, data = {}) => {
    const response = await api.patch(`/volunteer-applications/${id}/accept`, data);
    return response.data;
  },

  rejectApplication: async (id, data = {}) => {
    const response = await api.patch(`/volunteer-applications/${id}/reject`, data);
    return response.data;
  },

  completeApplication: async (id, data = {}) => {
    const response = await api.patch(`/volunteer-applications/${id}/complete`, data);
    return response.data;
  }
};

export default volunteerService;
