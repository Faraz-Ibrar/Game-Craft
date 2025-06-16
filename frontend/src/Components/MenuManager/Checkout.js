// frontend/src/Components/MenuManager/CheckoutPage.jsx

import React, { useState } from "react";
import "./Checkout.css";

export default function Checkout({ 
  cart, 
  deliveryAddress, 
  setDeliveryAddress, 
  totalAmount, 
  onPlaceOrder, 
  onBack,
  orderType = "electronics" 
}) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [specialInstructions, setSpecialInstructions] = useState("");

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

const handleSubmit = (e) => {
  e.preventDefault();
  
  // Basic validation
  if (!customerName.trim()) {
    alert("Please enter your name");
    return;
  }
  
  if (!customerPhone.trim()) {
    alert("Please enter your phone number");
    return;
  }
  
  if (!deliveryAddress.trim()) {
    alert("Please enter delivery address");
    return;
  }

  // Prepare order data
  const orderData = {
    customerName: customerName.trim(),
    customerPhone: customerPhone.trim(),
    customerEmail: customerEmail.trim(),
    deliveryAddress: deliveryAddress.trim(),
    paymentMethod,
    specialInstructions: specialInstructions.trim(),
    cartItems: cart,
    totalAmount,
    deliveryCharges: 200,
    finalAmount: totalAmount + 200,
    orderType
  };

  // Debug logging
  console.log("Checkout - Order data being sent:", orderData);
  console.log("Checkout - Required fields check:");
  console.log("- customerName:", orderData.customerName);
  console.log("- customerPhone:", orderData.customerPhone);
  console.log("- finalAmount:", orderData.finalAmount);
  console.log("- deliveryAddress:", orderData.deliveryAddress);
  console.log("- cartItems length:", orderData.cartItems.length);

  // Pass the order data to parent component
  onPlaceOrder(orderData);
};

  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <h2>Complete Your Order</h2>
        
      </div>

      <form onSubmit={handleSubmit} className="checkout-form">
        <div className="form-sections">
          {/* Customer Information */}
          <div className="form-section">
            <h3>Customer Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="03XX-XXXXXXX"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Email Address (Optional)</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="your.email@example.com"
              />
            </div>
          </div>

          {/* Delivery Information */}
          <div className="form-section">
            <h3>Delivery Information</h3>
            <div className="form-group">
              <label>Delivery Address *</label>
              <textarea
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                rows="3"
                placeholder="Enter complete delivery address with landmarks"
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="cash">Cash on Delivery</option>
                  <option value="card">Card on Delivery</option>
                  <option value="online">Online Payment</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Special Instructions (Optional)</label>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                rows="2"
                placeholder="Any special delivery instructions..."
              />
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="order-summary">
          <h3>Order Summary</h3>
          <div className="summary-items">
            {cart.map(item => (
              <div key={item.id || item.productId} className="summary-item">
                <div className="item-info">
                  <img 
                    src={item.image || '/placeholder-product.jpg'} 
                    alt={item.name}
                    className="item-thumbnail"
                  />
                  <div className="item-details">
                    <h4>{item.name}</h4>
                    {item.brand && <p>Brand: {item.brand}</p>}
                    <p>Quantity: {item.quantity}</p>
                  </div>
                </div>
                <div className="item-price">
                  <span>Rs. {item.totalPrice.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="summary-totals">
            <div className="summary-row">
              <span>Total Items:</span>
              <span>{getTotalItems()}</span>
            </div>
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>Rs. {totalAmount.toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>Delivery Charges:</span>
              <span>Rs. 200</span>
            </div>
            <div className="summary-row total-row">
              <span>Total Amount:</span>
              <span>Rs. {(totalAmount + 200).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="checkout-actions">
          <button type="button" className="back-btn" onClick={onBack}>
            ← Back to Cart
          </button>
          <button type="submit" className="place-order-btn">
            Place Order - Rs. {(totalAmount + 200).toLocaleString()}
          </button>
        </div>
      </form>
    </div>
  );
}