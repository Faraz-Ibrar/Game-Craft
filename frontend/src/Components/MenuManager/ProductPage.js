// frontend/src/Components/MenuManager/ProductsPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "./CartContext";
import ProductCard from "./ProductCard";
import "./ProductManager.css";
import Carousel from 'react-bootstrap/Carousel';
import "./ProductPage.css"

export default function ProductsPage() {
  const navigate = useNavigate();
  const {
    products,
    cart,
    loading,
    orderMessage,
    addToCart,
    getTotalItemsInCart,
    totalAmount
  } = useCart();

  const handleCartClick = () => {
    navigate('/cart');
  };

  if (loading) {
    return (
      <div className="electronics-store-system">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="electronics-store-system">
      {/* Hero Carousel Section */}
      <section className="hero-carousel">
        <Carousel fade>
          <Carousel.Item>
            <img
              className="d-block w-100"
              src="https://3.bp.blogspot.com/-i7nLv-n77CQ/V4xtbXSLJKI/AAAAAAAALMY/aFRBu47IpZYT2OTGBydxGVJdPCVxhmlRQCEw/w1200-h630-p-k-no-nu/gtx_980.jpg"
              alt="Electronics Store - Latest Technology"
              style={{ height: '400px', objectFit: 'cover' }}
            />
            <Carousel.Caption>
              <h3>Latest Graphic Cards</h3>
            </Carousel.Caption>
          </Carousel.Item>
          <Carousel.Item>
            <img
              className="d-block w-100"
              src="https://th.bing.com/th/id/R.5d109e68ba28aa3650cded71a263736a?rik=%2b0uTkeh3rd%2bH4A&pid=ImgRaw&r=0"
              alt="Mobile Phones and Accessories"
              style={{ height: '400px', objectFit: 'cover' }}
            />
            <Carousel.Caption>
              <h3>Modern Case</h3>
            </Carousel.Caption>
          </Carousel.Item>
          <Carousel.Item>
            <img
              className="d-block w-100"
              src="https://cdn.pixabay.com/photo/2020/09/03/20/39/headphones-5542364_1280.jpg"
              alt="Computers and Laptops"
              style={{ height: '400px', objectFit: 'cover' }}
            />
            <Carousel.Caption>
              <h3>Accessories</h3>
            </Carousel.Caption>
          </Carousel.Item>
        </Carousel>
      </section>

      <main className="main-content">
        <div className="products-header">
          <h2>Our Products</h2>
          <div className="products-count">
            {products.length} products available
          </div>
        </div>

        <div className="product-grid">
          {products.length > 0 ? (
            products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
                isInCart={cart.some(item => item.id === product.id || item.productId === product.id)}
              />
            ))
          ) : (
            <div className="no-items">
              <h3>No products available</h3>
              <p>Please check back later for new arrivals!</p>
            </div>
          )}
        </div>
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