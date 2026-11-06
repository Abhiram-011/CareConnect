import api from './api.js';

export const donationService = {
  // Create a new donation request (Donor)
  createDonation: async (donationData) => {
    const response = await api.post('/donations', donationData);
    return response.data;
  },

  // Get logged-in donor's donations with stats & filters
  getMyDonations: async (params = {}) => {
    const response = await api.get('/donations/my', { params });
    return response.data;
  },

  // Get logged-in home's donation requests with stats & filters
  getHomeDonations: async (params = {}) => {
    const response = await api.get('/donations/home/requests', { params });
    return response.data;
  },

  // Get a single donation by ID
  getDonationById: async (id) => {
    const response = await api.get(`/donations/${id}`);
    return response.data;
  },

  // Update donation details (Donor while PENDING)
  updateDonation: async (id, data) => {
    const response = await api.put(`/donations/${id}`, data);
    return response.data;
  },

  // Cancel donation request (Donor)
  cancelDonation: async (id, data = {}) => {
    const response = await api.patch(`/donations/${id}/cancel`, data);
    return response.data;
  },

  // Accept donation request (Home)
  acceptDonation: async (id, data = {}) => {
    const response = await api.patch(`/donations/${id}/accept`, data);
    return response.data;
  },

  // Reject donation request (Home)
  rejectDonation: async (id, data = {}) => {
    const response = await api.patch(`/donations/${id}/reject`, data);
    return response.data;
  },

  // Schedule delivery (Home or Donor)
  scheduleDonation: async (id, data) => {
    const response = await api.patch(`/donations/${id}/schedule`, data);
    return response.data;
  },

  // Mark items as delivered (Donor)
  markDelivered: async (id, data = {}) => {
    const response = await api.patch(`/donations/${id}/mark-delivered`, data);
    return response.data;
  },

  // Confirm receipt and complete (Home)
  completeDonation: async (id, data = {}) => {
    const response = await api.patch(`/donations/${id}/complete`, data);
    return response.data;
  }
};

export default donationService;
