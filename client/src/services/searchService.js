import api from './api';

export const searchHomes = async (params = {}) => {
  const response = await api.get('/search/homes', { params });
  return response.data;
};

export const getPublicHomeDetails = async (id) => {
  const response = await api.get(`/search/homes/${id}`);
  return response.data;
};

export const searchDonations = async (params = {}) => {
  const response = await api.get('/search/donations', { params });
  return response.data;
};

export const searchVolunteerOpportunities = async (params = {}) => {
  const response = await api.get('/search/volunteer-opportunities', { params });
  return response.data;
};

export default {
  searchHomes,
  getPublicHomeDetails,
  searchDonations,
  searchVolunteerOpportunities
};

