import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import ProductsPage from "./Components/MenuManager/ProductPage";
import CartPage from "./Components/MenuManager/CartPage";
import CheckoutPage from "./Components/MenuManager/CheckoutPage";
import OrderConfirmationPage from "./Components/MenuManager/OrderConfirmatinPage";
import { CartProvider } from "./Components/MenuManager/CartContext";
import Header from "./Components/MenuManager/Header";
import { useCart } from "./Components/MenuManager/CartContext";
import Footer from "./Components/MenuManager/Footer";
import { AuthProvider, useAuth } from './Components/AuthContext';
import AdminDashboard from "./Components/MenuManager/AdminDashboard";
import "./App.css";

// Auth Success Component
// Auth Success Component
function AuthSuccess() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');
    const userRole = urlParams.get('role'); // If your auth service sends role in URL

    if (token) {
      // Wait a moment for user context to be available
      setTimeout(() => {
        if (user?.role === 'admin' || userRole === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      }, 100);
    } else if (error) {
      console.error('Auth error:', error);
      navigate('/', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }, [navigate, user]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '50vh',
      flexDirection: 'column'
    }}>
      <div>🔄 Completing authentication...</div>
      <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
        Please wait while we log you in
      </div>
    </div>
  );
}
// Protected Route Component
function ProtectedRoute({ children, requiredRole = 'admin' }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || user.role !== requiredRole)) {
      navigate('/');
    }
  }, [user, loading, navigate, requiredRole]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '50vh'
      }}>
        Loading...
      </div>
    );
  }

  return user?.role === requiredRole ? children : null;
}

function AppWithHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const {
    getTotalItemsInCart,
    totalAmount
  } = useCart();

  const handleCartClick = () => {
    navigate('/cart');
  };

  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/admin': return 'Admin Dashboard';
      case '/cart': return 'Shopping Cart';
      case '/checkout': return 'Checkout';
      case '/order-confirmation': return 'Order Confirmation';
      case '/auth/success': return 'Authenticating';
      default: return 'Store';
    }
  };

  return (
    <div className="electronics-store-system">
      <Header
        cartCount={getTotalItemsInCart()}
        totalAmount={totalAmount}
        onCartClick={handleCartClick}
        showCartLoading={false}
        title={getPageTitle(location.pathname)}
        showAdminLink={user?.role === 'admin'}
      />
      <Routes>
        <Route path="/" element={<ProductsPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
        <Route path="/auth/success" element={<AuthSuccess />} />

        {/* Admin Route */}
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />
      </Routes>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router basename="/Order-Management-React">
          <div className="App">
            <AppWithHeader />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}