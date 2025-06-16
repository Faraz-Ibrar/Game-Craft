// frontend/src/Components/AuthContext.js
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';

const AuthContext = createContext();
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Centralized error logger
  const logError = (action, error) => {
    console.error(`${action} failed:`, error);
  };

  // ✅ NEW: Centralized token management
  const getAuthToken = useCallback(() => {
    return localStorage.getItem('authToken') || localStorage.getItem('token');
  }, []);

  const setAuthToken = useCallback((token) => {
    localStorage.setItem('authToken', token);
    // Keep legacy token for backward compatibility
    localStorage.setItem('token', token);
  }, []);

  const removeAuthToken = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }, []);

  // JWT expiration checker
  const isTokenExpired = (token) => {
    try {
      const { exp } = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= exp * 1000;
    } catch (e) {
      return true;
    }
  };

  const clearAuthData = useCallback(() => {
    console.log('🧹 Clearing authentication data...');
    
    // Clear all auth-related data
    localStorage.removeItem('userData');
    removeAuthToken();
    
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    
    console.log('✅ Authentication data cleared');
  }, [removeAuthToken]);

  const apiCall = async (endpoint, options = {}) => {
    const token = getAuthToken();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (response.status === 401) {
      clearAuthData(); // auto-logout
      throw new Error('Unauthorized. Please log in again.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return response.json();
  };

  const verifyToken = async (token) => {
    if (isTokenExpired(token)) return false;
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const userData = await response.json();
        return { valid: true, userData };
      }
      return { valid: false };
    } catch (error) {
      logError('Token verification', error);
      return { valid: false };
    }
  };

  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('No refresh token');

      const response = await apiCall('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });

      setAuthToken(response.accessToken);
      if (response.refreshToken) localStorage.setItem('refreshToken', response.refreshToken);

      return response.accessToken;
    } catch (error) {
      logError('Token refresh', error);
      clearAuthData();
      throw error;
    }
  };

  // Check authentication status on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log('🔍 Checking authentication status...');
        
        const userData = localStorage.getItem('userData');
        const authToken = getAuthToken();

        console.log("userData:", userData ? 'Present ✅' : 'Missing ❌');
        console.log("authToken:", authToken ? 'Present ✅' : 'Missing ❌');

        if (userData && authToken) {
          const parsedUser = JSON.parse(userData);
          const verification = await verifyToken(authToken);

          if (verification.valid) {
            // Use userData from verification if available, otherwise use stored data
            const finalUserData = verification.userData || parsedUser;
            setUser(finalUserData);
            setIsAuthenticated(true);
            console.log('✅ User authenticated successfully');
          } else {
            try {
              const newToken = await refreshAccessToken();
              if (newToken) {
                setUser(parsedUser);
                setIsAuthenticated(true);
                console.log('✅ Token refreshed successfully');
              }
            } catch (refreshError) {
              clearAuthData();
            }
          }
        } else {
          clearAuthData();
        }
      } catch (err) {
        console.error("Auth Check Error:", err);
        clearAuthData();
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, [clearAuthData, getAuthToken]);

  // Handle URL parameters for OAuth (Google, etc.)
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const error = urlParams.get('error');

      if (token) {
        console.log('🌐 OAuth token found in URL');
        try {
          const verification = await verifyToken(token);
          
          if (verification.valid && verification.userData) {
            console.log('✅ OAuth verification successful');
            
            // Store authentication data
            setAuthToken(token);
            localStorage.setItem('userData', JSON.stringify(verification.userData));
            
            setUser(verification.userData);
            setIsAuthenticated(true);
            setError(null);
            
            console.log('🎉 OAuth authentication completed successfully!');
          } else {
            throw new Error('Invalid OAuth token');
          }
        } catch (oauthError) {
          console.error('❌ OAuth verification error:', oauthError);
          setError('OAuth authentication failed. Please try again.');
        }
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (error) {
        console.log('❌ OAuth error:', error);
        setError('OAuth authentication failed. Please try again.');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    handleOAuthCallback();
  }, [setAuthToken]);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);
    
    console.log('🔐 Attempting login...');
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      console.log('📡 Login response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Invalid credentials');
      }

      const result = await response.json();
      console.log('✅ Login successful');

      // Extract data from response
      const { user: userData, accessToken, refreshToken, token } = result;
      const finalToken = accessToken || token;
      const finalUserData = userData || { 
        name: result.name || credentials.email.split('@')[0], 
        email: credentials.email, 
        role: 'customer' 
      };

      if (finalUserData && finalToken) {
        // Store authentication data
        localStorage.setItem('userData', JSON.stringify(finalUserData));
        setAuthToken(finalToken);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);

        setUser(finalUserData);
        setIsAuthenticated(true);
        
        console.log('🎉 Login process completed successfully!');
        return { success: true, user: finalUserData };
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      logError('Login', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [setAuthToken]);

  const register = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    
    console.log('📝 Attempting registration...');
    
    try {
      const response = await fetch(`${API_BASE_URL}/user/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      console.log('📡 Registration response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const result = await response.json();
      console.log('✅ Registration successful');

      // Extract data from response
      const { user: newUser, accessToken, refreshToken, token } = result;
      const finalToken = accessToken || token;
      const finalUserData = newUser || { 
        name: userData.name, 
        email: userData.email, 
        role: 'customer' 
      };

      if (finalUserData && finalToken) {
        // Store authentication data
        localStorage.setItem('userData', JSON.stringify(finalUserData));
        setAuthToken(finalToken);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);

        setUser(finalUserData);
        setIsAuthenticated(true);
        
        console.log('🎉 Registration process completed successfully!');
        return { success: true, user: finalUserData };
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      logError('Register', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [setAuthToken]);

  const loginWithGoogle = useCallback(() => {
    console.log('🌐 Redirecting to Google OAuth...');
    window.location.href = `${API_BASE_URL}/auth/google`;
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    console.log('🚪 Logging out user...');
    
    try {
      const token = getAuthToken();
      if (token) {
        await apiCall('/auth/logout', { method: 'POST' });
      }
    } catch (error) {
      logError('Logout', error);
    } finally {
      clearAuthData();
      setLoading(false);
      console.log('✅ Logout completed successfully');
    }
  }, [clearAuthData, getAuthToken]);

  const updateUser = useCallback(async (updatedUserData) => {
    if (!user) return { success: false, error: 'No user to update' };

    setLoading(true);
    setError(null);
    try {
      const response = await apiCall('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(updatedUserData),
      });

      const updatedUser = response.user || { ...user, ...updatedUserData };
      localStorage.setItem('userData', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return { success: true, user: updatedUser };
    } catch (error) {
      logError('Update user', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [user]);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    setLoading(true);
    setError(null);
    try {
      await apiCall('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      return { success: true };
    } catch (error) {
      logError('Change password', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const forgotPassword = useCallback(async (email) => {
    setLoading(true);
    setError(null);
    try {
      await apiCall('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      return { success: true };
    } catch (error) {
      logError('Forgot password', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (token, newPassword) => {
    setLoading(true);
    setError(null);
    try {
      await apiCall('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
      });
      return { success: true };
    } catch (error) {
      logError('Reset password', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const hasRole = useCallback((role) => {
    return user?.roles?.includes(role) || user?.role === role;
  }, [user]);

  const hasPermission = useCallback((permission) => {
    return user?.permissions?.includes(permission);
  }, [user]);

  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    loginWithGoogle,
    logout,
    updateUser,
    changePassword,
    forgotPassword,
    resetPassword,
    clearError,
    hasRole,
    hasPermission,
    refreshAccessToken,
    // ✅ NEW: Expose token management helpers
    getAuthToken,
    setAuthToken,
    removeAuthToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

// Updated with `Navigate` for route protection
export const withAuth = (Component) => {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) return <div>Loading...</div>;
    if (!isAuthenticated) return <Navigate to="/login" />;

    return <Component {...props} />;
  };
};