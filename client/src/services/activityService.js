import api from './api';

export const getActivityHistory = async (params = {}) => {
  const response = await api.get('/activity/history', { params });
  return response.data;
};

export default {
  getActivityHistory
};

