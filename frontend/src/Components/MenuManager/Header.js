import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import "./Header.css"

export default function Header({
  cartCount,
  totalAmount,
  onCartClick,
  showCartLoading,
  currentPage
}) {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    loginWithGoogle,
    logout,
    clearError
  } = useAuth();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });
  const userMenuRef = useRef(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear error when modal closes
  useEffect(() => {
    if (!showAuthModal && error) {
      clearError();
    }
  }, [showAuthModal, error, clearError]);

  const handleLogoClick = () => {
    navigate('/');
  };

  const getPageTitle = () => {
    switch (currentPage) {
      case 'cart':
        return 'Shopping Cart';
      case 'checkout':
        return 'Checkout';
      case 'order-confirmation':
        return 'Order Confirmed';
      default:
        return '🔌 Electronics Store';
    }
  };

  const showCartIcon = currentPage !== 'order-confirmation';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) clearError();
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    const result = await login({
      email: formData.email,
      password: formData.password
    });

    if (result.success) {
      setShowAuthModal(false);
      setFormData({ email: '', password: '', name: '', confirmPassword: '' });
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      // You could add a local error state for this, or handle it in AuthContext
      alert('Passwords do not match');
      return;
    }

    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password
    });

    if (result.success) {
      setShowAuthModal(false);
      setFormData({ email: '', password: '', name: '', confirmPassword: '' });
    }
  };

  const handleGoogleLogin = () => {
    loginWithGoogle();
  };

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    navigate('/');
  };

  const openAuthModal = (mode) => {
    setAuthMode(mode);
    setShowAuthModal(true);
    clearError();
    setFormData({ email: '', password: '', name: '', confirmPassword: '' });
  };

  return (
    <>
      <header className="app-header">
        {/* Logo */}
        <div className="navbar-logo">
          <span
            className="logo-text"
            onClick={handleLogoClick}
            style={{ cursor: 'pointer' }}
          >
            GAME <span className="logo-highlight">CRAFT</span>
          </span>
        </div>

        {/* Header Actions */}
        <div className="header-actions">
          {/* Authentication Section */}
          {!isAuthenticated ? (
            <div className="auth-buttons">
              <button
                className="auth-btn login-btn"
                onClick={() => openAuthModal('login')}
                disabled={loading}
              >
                <span className="auth-icon">🔑</span>
                {loading ? 'Loading...' : 'Login'}
              </button>
              <button
                className="auth-btn signup-btn"
                onClick={() => openAuthModal('signup')}
                disabled={loading}
              >
                <span className="auth-icon">✨</span>
                {loading ? 'Loading...' : 'Sign Up'}
              </button>
            </div>
          ) : (
            <div className="user-section" ref={userMenuRef}>
              <div
                className="user-profile"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="user-avatar">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span className="user-name">{user?.name}</span>
                <span className="dropdown-arrow">▼</span>
              </div>

              {showUserMenu && (
                <div className="user-dropdown">
                  <div className="user-info">
                    <div className="user-details">
                      <strong>{user?.name}</strong>
                      <small>{user?.email}</small>
                    </div>
                  </div>
                  <hr className="dropdown-divider" />
                  <button
                    className="dropdown-item"
                    style={{ color: 'white' }}
                  >
                    <span className="item-icon">📋</span>
                    My Orders
                  </button>

                  <button
                    className="dropdown-item"
                    style={{ color: 'white' }}
                  >
                    <span className="item-icon" >👤</span>
                    Profile
                  </button>

                  <button
                    className="dropdown-item"
                    style={{ color: 'white' }}
                  >
                    <span className="item-icon">⚙️</span>
                    Settings
                  </button>

                  <hr
                    className="dropdown-divider"
                    style={{ borderColor: '#dee2e6'}}
                  />

                  <button
                    className="dropdown-item logout-item"
                    onClick={handleLogout}
                    disabled={loading}
                    style={{
                      color: loading ? '#6c757d' : '#dc3545',
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <span className="item-icon" style={{ color: '#dc3545' }}>🚪</span>
                    {loading ? 'Logging out...' : 'Logout'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Cart Section */}
          {showCartIcon && (
            <>
              <div className="cart-summary">
                <span className="total-amount">Total: Rs. {totalAmount.toLocaleString()}</span>
              </div>
              <div
                className={`cart-icon ${cartCount > 0 ? 'has-items' : ''}`}
                onClick={onCartClick}
                style={{ cursor: 'pointer' }}
              >
                🛒 Cart ({cartCount})
                {showCartLoading && <span className="loading-indicator">...</span>}
              </div>
            </>
          )}
        </div>
      </header>

      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="auth-modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{authMode === 'login' ? '🔑 Welcome Back!' : '✨ Join Game Craft'}</h2>
              <button
                className="modal-close"
                onClick={() => setShowAuthModal(false)}
                disabled={loading}
              >
                ×
              </button>
            </div>

            {error && (
              <div className="error-message" style={{
                color: '#dc3545',
                backgroundColor: '#f8d7da',
                border: '1px solid #f5c6cb',
                padding: '10px',
                borderRadius: '4px',
                marginBottom: '15px'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={authMode === 'login' ? handleLogin : handleSignup}>
              {authMode === 'signup' && (
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                  />
                </div>
              )}

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>

              {authMode === 'signup' && (
                <div className="form-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                  />
                </div>
              )}

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? (
                  <>
                    <span className="loading-spinner">⏳</span>
                    {authMode === 'login' ? 'Logging in...' : 'Creating Account...'}
                  </>
                ) : (
                  authMode === 'login' ? '🚀 Login' : '🎯 Create Account'
                )}
              </button>
            </form>

            <div className="modal-divider">
              <span>OR</span>
            </div>

            <button
              className="google-btn"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <span className="google-icon">🌐</span>
              Continue with Google
            </button>

            <div className="modal-footer">
              {authMode === 'login' ? (
                <p>
                  Don't have an account?
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => setAuthMode('signup')}
                    disabled={loading}
                  >
                    Sign Up
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => setAuthMode('login')}
                    disabled={loading}
                  >
                    Login
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}