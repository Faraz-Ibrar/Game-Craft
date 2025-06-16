// src/services/api.js
import axios from 'axios';

// Create axios instance with base configuration
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await API.post('/auth/refresh-token', {
            refreshToken: refreshToken
          });
          
          const { token } = response.data;
          localStorage.setItem('authToken', token);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return API(originalRequest);
        }
      } catch (refreshError) {
        // Redirect to login if refresh fails
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userData');
        window.location.href = '/';
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  // Regular login
  login: async (credentials) => {
    const response = await API.post('/auth/login', credentials);
    return response.data;
  },

  // Register new user
  register: async (userData) => {
    const response = await API.post('/user/register', userData);
    return response.data;
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    const response = await API.post('/auth/refresh-token', { refreshToken });
    return response.data;
  },

  // Google OAuth - redirect to backend
  googleLogin: () => {
    window.location.href = `${API.defaults.baseURL}/auth/google`;
  },

  // Get user profile
  getProfile: async () => {
    const response = await API.get('/api/users');
    return response.data;
  },

  // Logout (if you have a logout endpoint)
  logout: async () => {
    try {
      await API.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userData');
    }
  }
};

// Cart API calls
export const cartAPI = {
  getCart: async (userId) => {
    const response = await API.get(`/api/cart/${userId}`);
    return response.data;
  },

  addToCart: async (userId, productData) => {
    const response = await API.post(`/api/cart/${userId}`, productData);
    return response.data;
  },

  updateCartItem: async (userId, productId, quantity) => {
    const response = await API.put(`/api/cart/${userId}/${productId}`, { quantity });
    return response.data;
  },

  removeFromCart: async (userId, productId) => {
    const response = await API.delete(`/api/cart/${userId}/${productId}`);
    return response.data;
  },

  clearCart: async (userId) => {
    const response = await API.delete(`/api/cart/${userId}`);
    return response.data;
  }
};

// Product API calls
export const productAPI = {
  getAllProducts: async () => {
    const response = await API.get('/api/products');
    return response.data;
  },

  getProduct: async (productId) => {
    const response = await API.get(`/api/products/${productId}`);
    return response.data;
  },

  searchProducts: async (query) => {
    const response = await API.get(`/api/products/search?q=${query}`);
    return response.data;
  }
};

// Checkout API calls
export const checkoutAPI = {
  createOrder: async (orderData) => {
    const response = await API.post('/api/checkout', orderData);
    return response.data;
  },

  getOrder: async (orderId) => {
    const response = await API.get(`/api/checkout/${orderId}`);
    return response.data;
  },

  getUserOrders: async (userId) => {
    const response = await API.get(`/api/checkout/user/${userId}`);
    return response.data;
  }
};

export default API;