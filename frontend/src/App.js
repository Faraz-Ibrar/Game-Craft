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
import { AuthProvider } from './Components/AuthContext';
import "./App.css";

// Auth Success Component to handle Google OAuth callback
function AuthSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');

    if (token) {
      // Token will be handled by Header component's useEffect
      // Just redirect to home page
      navigate('/', { replace: true });
    } else if (error) {
      // Handle error case
      console.error('Auth error:', error);
      navigate('/', { replace: true });
    } else {
      // No token or error, redirect to home
      navigate('/', { replace: true });
    }
  }, [navigate]);

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

function AppWithHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    getTotalItemsInCart,
    totalAmount
  } = useCart();

  const handleCartClick = () => {
    navigate('/cart');
  };

  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/': return 'Products';
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
      />
      <Routes>
        <Route path="/" element={<ProductsPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
        <Route path="/auth/success" element={<AuthSuccess />} />
      </Routes>

      <Footer></Footer>
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