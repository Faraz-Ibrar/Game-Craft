// frontend/src/Components/MenuManager/CheckoutPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "./CartContext";
import Checkout from "./Checkout";
import "./ProductManager.css";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [deliveryAddress, setDeliveryAddress] = useState("");
  
  const { 
    cart, 
    orderMessage, 
    totalAmount, 
    handlePlaceOrder, 
  } = useCart();

  // Redirect to cart if cart is empty
  useEffect(() => {
    if (cart.length === 0) {
      navigate('/cart');
    }
  }, [cart.length, navigate]);

  const handlePlaceOrderWrapper = async (orderData) => {
    try {
      const orderId = await handlePlaceOrder(orderData);
      if (orderId) {
        // Navigate to order confirmation page
        navigate('/order-confirmation');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      // Error handling is done in CartContext
    }
  };

  const handleBack = () => {
    navigate('/cart');
  };

  // Don't render if cart is empty (will redirect)
  if (cart.length === 0) {
    return null;
  }

  return (
    <div className="electronics-store-system">
      <main className="main-content">
        <Checkout
          cart={cart}
          deliveryAddress={deliveryAddress}
          setDeliveryAddress={setDeliveryAddress}
          totalAmount={totalAmount}
          onPlaceOrder={handlePlaceOrderWrapper}
          onBack={handleBack}
          orderType="electronics"
        />
      </main>

      {orderMessage && (
        <div className={`order-message ${orderMessage.startsWith("✅") ? "success" :
            orderMessage.startsWith("❌") ? "error" :
              "info"
          }`}>
          {orderMessage}
        </div>
      )}
    </div>
  );
}