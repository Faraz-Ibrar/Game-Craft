// frontend/src/Components/MenuManager/ProductCard.jsx

import React, { useState, useEffect } from "react";
import "./ProductCard.css";

const ProductCard = ({ product, onAddToCart, isInCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [itemTotal, setItemTotal] = useState(product?.price || 0);

  useEffect(() => {
    setItemTotal(quantity * (product?.price || 0));
  }, [quantity, product]);

  const incrementQuantity = () => {
    setQuantity(prevCount => prevCount + 1);
  };

  const decrementQuantity = () => {
    setQuantity(prevCount => Math.max(1, prevCount - 1));
  };

  const handleAddToCart = () => {
    onAddToCart(product, quantity);
    setQuantity(1);
  };

  if (!product) {
    return <div className="product-card">Invalid product data</div>;
  }

  return (
    <div className="product-card">
      <div className="product-image-container">
        <img 
          src={product.image || '/placeholder-product.jpg'} 
          alt={product.name || 'Product'} 
          className="product-image"
          onError={(e) => {
            e.target.src = '/placeholder-product.jpg';
          }}
        />
      </div>
      
      <div className="product-content">
        <h3 className="product-title">{product.name || 'Unnamed Product'}</h3>
        
        <div className="category-brand">
          <span className="product-category">{product.category || 'Electronics'}</span>
          <span className="product-brand">Brand: {product.brand || 'Unknown'}</span>
        </div>
        
        {product.specifications && (
          <div className="specs-list">
            {product.specifications.split(',').slice(0, 3).map((spec, index) => (
              <div key={index} className="spec-item">• {spec.trim()}</div>
            ))}
          </div>
        )}
        
        <div className="price-container">
          <div className="product-price">
            Rs.{(product.price || 0).toLocaleString()}
          </div>
        </div>
        
        <div className="product-actions">
          <div className="quantity-container">
            <label className="quantity-label">Qty:</label>
            <div className="quantity-control">
              <button 
                className="qty-button" 
                onClick={decrementQuantity}
                disabled={quantity <= 1}
              >
                -
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                className="qty-input"
              />
              <button 
                className="qty-button" 
                onClick={incrementQuantity}
              >
                +
              </button>
            </div>
          </div>
          
          <div className="item-total">
            Total: Rs.{itemTotal.toLocaleString()}
          </div>
          
          <button 
            className="add-to-cart-btn"
            onClick={handleAddToCart}
          >
            <span style={{ marginRight: '8px' }}>🛒</span>
            {isInCart ? 'ADD MORE' : 'ADD TO CART'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;