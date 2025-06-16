// frontend/src/Components/MenuManager/CartPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "./CartContext";
import Cart from "./Cart";
import "./ProductManager.css";

export default function CartPage() {
  const navigate = useNavigate();
  const { 
    cart, 
    orderMessage, 
    totalAmount, 
    removeFromCart, 
    updateCartItemQuantity, 
    clearCart, 
  } = useCart();

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert("Your cart is empty. Add some products first!");
      return;
    }
    navigate('/checkout');
  };

  const handleContinueShopping = () => {
    navigate('/');
  };

  return (
    <div className="electronics-store-system">
      <main className="main-content">
        <Cart
          cart={cart}
          onRemoveFromCart={removeFromCart}
          onUpdateQuantity={updateCartItemQuantity}
          onCheckout={handleCheckout}
          onContinueShopping={handleContinueShopping}
          totalAmount={totalAmount}
          onClearCart={clearCart}
          itemType="product"
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