import axios from 'axios';

// Create configured Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach JWT Token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('careconnect_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Format error messages consistently
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Extract server message or fallback
    const message =
      error.response?.data?.message ||
      (error.message === 'Network Error'
        ? 'Unable to connect to server. Please check your internet connection.'
        : 'An unexpected error occurred. Please try again.');

    error.customMessage = message;
    return Promise.reject(error);
  }
);

export default api;
