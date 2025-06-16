import React, { useState } from "react";
import { useCart } from "./CartContext";
import "./Cart.css";

export default function Cart({ onCheckout, onContinueShopping, itemType = "product" }) {
  const {
    cart,
    totalAmount,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    cartLoading,
    cartError
  } = useCart();

  const [loadingItems, setLoadingItems] = useState({});

  if (cart.length === 0) {
    return (
      <div className="empty-cart">
        <div className="empty-cart-icon">🛒</div>
        <h3>Your cart is empty</h3>
        <p>Browse our electronics and add some items to get started!</p>
        {onContinueShopping && (
          <button 
            className="continue-shopping-btn empty-cart-btn"
            onClick={onContinueShopping}
          >
            Continue Shopping
          </button>
        )}
      </div>
    );
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + (item.quantity || 0), 0);
  };

  const handleIncrement = async (itemId, currentQuantity) => {
    setLoadingItems(prev => ({ ...prev, [itemId]: true }));
    try {
      await updateCartItemQuantity(itemId, currentQuantity + 1);
    } catch (error) {
      console.error("Failed to increment quantity:", error);
    } finally {
      setLoadingItems(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const handleDecrement = async (itemId, currentQuantity) => {
    if (currentQuantity <= 1) return;
    
    setLoadingItems(prev => ({ ...prev, [itemId]: true }));
    try {
      await updateCartItemQuantity(itemId, currentQuantity - 1);
    } catch (error) {
      console.error("Failed to decrement quantity:", error);
    } finally {
      setLoadingItems(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const handleQuantityChange = async (itemId, newQuantity) => {
    const parsedQuantity = Math.max(1, parseInt(newQuantity) || 1);
    setLoadingItems(prev => ({ ...prev, [itemId]: true }));
    try {
      await updateCartItemQuantity(itemId, parsedQuantity);
    } catch (error) {
      console.error("Failed to update quantity:", error);
    } finally {
      setLoadingItems(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const handleRemoveItem = async (itemId) => {
    setLoadingItems(prev => ({ ...prev, [itemId]: true }));
    try {
      await removeFromCart(itemId);
    } catch (error) {
      console.error("Failed to remove item:", error);
    } finally {
      setLoadingItems(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
    } catch (error) {
      console.error("Failed to clear cart:", error);
    }
  };

  const getItemTotal = (item) => {
    if (item.totalPrice !== undefined && item.totalPrice !== null) {
      return item.totalPrice;
    }
    const price = item.price || 0;
    const quantity = item.quantity || 0;
    return price * quantity;
  };

  return (
    <div className="cart-container">
      {cartError && (
        <div className="cart-error-message">
          Error: {cartError}
        </div>
      )}

      <div className="cart-header">
        <h2>Shopping Cart</h2>
        <div className="cart-stats">
          <span className="item-count">{getTotalItems()} items</span>
          <button 
            className="clear-cart-btn" 
            onClick={handleClearCart}
            disabled={cartLoading}
          >
            {cartLoading ? 'Clearing...' : 'Clear Cart'}
          </button>
        </div>
      </div>

      <div className="cart-items">
        {cart.map(item => {
          const itemId = item.id || item.productId;
          const isLoading = loadingItems[itemId] || false;
          
          return (
            <div key={itemId} className="cart-item">
              <div className="cart-item-image">
                <img
                  src={item.image || '/placeholder-product.jpg'}
                  alt={item.name || 'Product'}
                  onError={(e) => {
                    e.target.src = '/placeholder-product.jpg';
                  }}
                />
              </div>
              
              <div className="cart-item-details">
                <h4>{item.name || 'Unnamed Product'}</h4>
                {item.brand && (
                  <p className="item-brand">Brand: {item.brand}</p>
                )}
                {item.specifications && (
                  <p className="item-specs">
                    Specs: {item.specifications.length > 50 
                      ? `${item.specifications.substring(0, 50)}...` 
                      : item.specifications}
                  </p>
                )}
                <p className="item-price">Unit Price: Rs. {(item.price || 0).toLocaleString()}</p>
              </div>

              <div className="cart-item-controls">
                <div className="quantity-controls">
                  <label>Quantity:</label>
                  <div className="quantity-input-group">
                    <button
                      className="qty-btn"
                      onClick={() => handleDecrement(itemId, item.quantity || 1)}
                      disabled={isLoading || (item.quantity || 1) <= 1}
                    >
                      {isLoading ? '...' : '-'}
                    </button>
                    <input
                      type="number"
                      value={item.quantity || 1}
                      onChange={(e) => handleQuantityChange(itemId, e.target.value)}
                      min="1"
                      className="qty-input"
                      disabled={isLoading}
                    />
                    <button
                      className="qty-btn"
                      onClick={() => handleIncrement(itemId, item.quantity || 1)}
                      disabled={isLoading}
                    >
                      {isLoading ? '...' : '+'}
                    </button>
                  </div>
                </div>
                
                <div className="cart-item-total">
                  <p className="subtotal">Subtotal: Rs. {getItemTotal(item).toLocaleString()}</p>
                  <button
                    className="remove-btn"
                    onClick={() => handleRemoveItem(itemId)}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="cart-summary">
        <div className="summary-details">
          <div className="summary-row">
            <span>Total Items:</span>
            <span>{getTotalItems()}</span>
          </div>
          <div className="summary-row">
            <span>Subtotal:</span>
            <span>Rs. {(totalAmount || 0).toLocaleString()}</span>
          </div>
          <div className="summary-row total-row">
            <span>Total Amount:</span>
            <span>Rs. {(totalAmount || 0).toLocaleString()}</span>
          </div>
        </div>
        
        <div className="checkout-actions">
          {onContinueShopping && (
            <button 
              className="continue-shopping-btn" 
              onClick={onContinueShopping}
              disabled={cartLoading}
            >
              Continue Shopping
            </button>
          )}
          <button 
            className="checkout-btn" 
            onClick={onCheckout}
            disabled={cartLoading || cart.length === 0}
          >
            {cartLoading ? 'Processing...' : 'Proceed to Checkout'}
          </button>
        </div>
      </div>
    </div>
  );
}