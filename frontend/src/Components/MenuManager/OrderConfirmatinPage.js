// frontend/src/Components/MenuManager/OrderConfirmationPage.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "./CartContext";
import OrderConfirmation from "./OrderConfirmation";
import "./ProductManager.css";

export default function OrderConfirmationPage() {
  const navigate = useNavigate();
  const { 
    confirmedOrder, 
    orderMessage, 
  } = useCart();

  // Redirect to home if no confirmed order
  useEffect(() => {
    if (!confirmedOrder.orderId) {
      navigate('/');
    }
  }, [confirmedOrder.orderId, navigate]);

  const handleBackToMenu = () => {
    navigate('/');
  };


  // Don't render if no confirmed order (will redirect)
  if (!confirmedOrder.orderId) {
    return null;
  }

  return (
    <div className="electronics-store-system">
      <main className="main-content">
        <OrderConfirmation
          orderId={confirmedOrder.orderId}
          cart={confirmedOrder.cart}
          deliveryAddress={confirmedOrder.deliveryAddress}
          totalAmount={confirmedOrder.totalAmount}
          onBackToMenu={handleBackToMenu}
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