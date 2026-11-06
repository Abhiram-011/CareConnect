import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('careconnect_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize and verify authentication state on mount
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('careconnect_token');
      if (storedToken) {
        try {
          const res = await authService.getMe();
          if (isMounted) {
            if (res.success && res.data?.user) {
              setCurrentUser(res.data.user);
              setToken(storedToken);
            } else {
              localStorage.removeItem('careconnect_token');
              setCurrentUser(null);
              setToken(null);
            }
          }
        } catch (error) {
          console.error('[AuthContext] Session validation failed:', error);
          if (isMounted) {
            localStorage.removeItem('careconnect_token');
            setCurrentUser(null);
            setToken(null);
          }
        }
      } else {
        if (isMounted) {
          setCurrentUser(null);
          setToken(null);
        }
      }
      if (isMounted) {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // Login handler
  const login = async (email, password) => {
    const response = await authService.login({ email, password });
    if (response.success && response.token) {
      localStorage.setItem('careconnect_token', response.token);
      setToken(response.token);
      setCurrentUser(response.data.user);
    }
    return response;
  };

  // Register handler
  const register = async (userData) => {
    const response = await authService.register(userData);
    if (response.success && response.token) {
      localStorage.setItem('careconnect_token', response.token);
      setToken(response.token);
      setCurrentUser(response.data.user);
    }
    return response;
  };

  // Verify OTP handler
  const verifyOTP = async (email, otp) => {
    const response = await authService.verifyOTP({ email, otp });
    if (response.success && response.token) {
      localStorage.setItem('careconnect_token', response.token);
      setToken(response.token);
      setCurrentUser(response.data?.user || null);
    }
    return response;
  };

  // Resend OTP handler
  const resendOTP = async (email, purpose = 'verification') => {
    return await authService.resendOTP({ email, purpose });
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('careconnect_token');
    setToken(null);
    setCurrentUser(null);
  };

  // Update profile handler
  const updateProfile = async (profileData) => {
    const response = await authService.updateProfile(profileData);
    if (response.success && response.data?.user) {
      setCurrentUser(response.data.user);
    }
    return response;
  };

  const value = {
    currentUser,
    token,
    isAuthenticated: !!currentUser && !!token,
    loading,
    login,
    register,
    verifyOTP,
    resendOTP,
    logout,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
