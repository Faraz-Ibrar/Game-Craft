// frontend/src/Components/ProductManager/OrderConfirmation.jsx
import React from "react";
import "./OrderConfirmation.css";
import { FaCheckCircle } from 'react-icons/fa';

export default function OrderConfirmation({
  orderId,
  cart,
  deliveryTime,
  deliveryAddress,
  totalAmount,
  onBackToMenu
}) {
  const formatOrderId = (id) => {
    return id ? `#${id.slice(-8).toUpperCase()}` : "#PENDING";
  };

  const formatDeliveryTime = (time) => {
    if (!time) return "Not specified";
    const [hours, minutes] = time.split(":");
    const hour12 = hours % 12 || 12;
    const ampm = hours >= 12 ? "PM" : "AM";
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getEstimatedDelivery = () => {
    const now = new Date();
    const deliveryDate = new Date(now);

    if (deliveryTime) {
      const [hours, minutes] = deliveryTime.split(":").map(Number);
      deliveryDate.setHours(hours, minutes, 0);

      if (deliveryDate <= now) {
        deliveryDate.setDate(deliveryDate.getDate() + 1);
      }
    } else {
      deliveryDate.setHours(deliveryDate.getHours() + 2);
    }

    return deliveryDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="order-confirmation">
      <div className="confirmation-container">
        {/* Success Header */}
        <div className="success-header">
          <div className="success-icon">
            <FaCheckCircle size={80} color="#ffdd00" />
          </div>
          <h1>Order Confirmed!</h1>
          <p className="success-message">
            Thank you for your purchase. Your order has been successfully placed.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="order-details-card">
          <div className="order-header">
            <div className="order-info">
              <h2>Order Details</h2>
              <p className="order-id">Order ID: {formatOrderId(orderId)}</p>
            </div>
            <div className="order-status">
              <span className="status-badge pending">Processing</span>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="delivery-info">
            <div className="info-section">
              <h3>📍 Delivery Address</h3>
              <p>{deliveryAddress || "Address not provided"}</p>
            </div>

            <div className="info-section">
              <h3>🕒 Delivery Details</h3>
              <p><strong>Time:</strong> {formatDeliveryTime(deliveryTime)}</p>
              <p><strong>Date:</strong> {getEstimatedDelivery()}</p>
            </div>
          </div>

          {/* Order Items */}
          <div className="order-items">
            <h3>📦 Items Ordered ({cart.length})</h3>
            <div className="items-list">
              {cart.map((item, index) => (
                <div key={index} className="order-item">
                  <div className="item-image">
                    <img src={item.image} alt={item.name} />
                  </div>
                  <div className="item-details">
                    <h4>{item.name}</h4>
                    <div className="item-specs">
                      <span>Qty: {item.personCount || item.quantity || 1}</span>
                      {item.serves && <span>Serves: {item.serves}</span>}
                    </div>
                  </div>
                  <div className="item-price">
                    <span className="unit-price">Rs. {item.price} each</span>
                    <span className="total-price">
                      Rs. {parseFloat((item.totalPrice || (item.price * (item.personCount || item.quantity || 1))).toFixed(2))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="order-summary">
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>Rs. {totalAmount}</span>
            </div>
            <div className="summary-row">
              <span>Delivery Fee:</span>
              <span>Free</span>
            </div>
            <div className="summary-row total">
              <span>Total Amount:</span>
              <span>Rs. {totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="next-steps">
          <h3>What happens next?</h3>
          <div className="steps-grid">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Order Processing</h4>
                <p>We're preparing your items for delivery</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Quality Check</h4>
                <p>Each item is carefully inspected</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Out for Delivery</h4>
                <p>Your order will be delivered on time</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button className="btn-secondary" onClick={onBackToMenu}>
            Continue Shopping
          </button>
          <button className="btn-primary" onClick={() => window.print()}>
            Print Receipt
          </button>
        </div>

        {/* Support Information */}
        <div className="support-info">
          <p>Need help with your order?</p>
          <div className="support-options">
            <span>📞 Call: 1-800-SUPPORT</span>
            <span>✉️ Email: support@electronicstore.com</span>
            <span>💬 Live Chat Available 24/7</span>
          </div>
        </div>
      </div>
    </div>
  );
}