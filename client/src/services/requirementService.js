import api from './api.js';

export const requirementService = {
  // Get all requirements of currently logged in home
  getMyRequirements: async (params = {}) => {
    const response = await api.get('/requirements/my-requirements', { params });
    return response.data;
  },

  // Create new requirement (Home)
  createRequirement: async (data) => {
    const response = await api.post('/requirements', data);
    return response.data;
  },

  // Update requirement (Home/Admin)
  updateRequirement: async (id, data) => {
    const response = await api.put(`/requirements/${id}`, data);
    return response.data;
  },

  // Delete requirement (Home/Admin)
  deleteRequirement: async (id) => {
    const response = await api.delete(`/requirements/${id}`);
    return response.data;
  },

  // Get requirement by ID
  getRequirementById: async (id) => {
    const response = await api.get(`/requirements/${id}`);
    return response.data;
  },

  // Get public requirements for donors
  getPublicRequirements: async (params = {}) => {
    const response = await api.get('/requirements/public', { params });
    return response.data;
  }
};

export default requirementService;
