import api from './api';

export const getDonationsTracking = async (params = {}) => {
  const response = await api.get('/tracking/donations', { params });
  return response.data;
};

export const getDonationTrackingById = async (id) => {
  const response = await api.get(`/tracking/donations/${id}`);
  return response.data;
};

export const getVolunteerApplicationsTracking = async (params = {}) => {
  const response = await api.get('/tracking/volunteer-applications', { params });
  return response.data;
};

export const getVolunteerApplicationTrackingById = async (id) => {
  const response = await api.get(`/tracking/volunteer-applications/${id}`);
  return response.data;
};

export default {
  getDonationsTracking,
  getDonationTrackingById,
  getVolunteerApplicationsTracking,
  getVolunteerApplicationTrackingById
};

