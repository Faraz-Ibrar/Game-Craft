// frontend/src/Components/MenuManager/CartContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext';

// Set base URL for all axios requests
axios.defaults.baseURL = 'http://localhost:5000';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartLoading, setCartLoading] = useState(false);
  const [orderMessage, setOrderMessage] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [confirmedOrder, setConfirmedOrder] = useState({
    orderId: "",
    cart: [],
    deliveryAddress: "",
    totalAmount: 0
  });

  // ✅ NEW: Enhanced error handling
  const [cartError, setCartError] = useState(null);
  const [productError, setProductError] = useState(null);

  // ✅ NEW: Centralized error logger
  const logCartError = (action, error) => {
    console.error(`Cart ${action} failed:`, error);
    setCartError(error.message || `${action} failed`);

    // Auto-clear error after 5 seconds
    setTimeout(() => setCartError(null), 5000);
  };

  const logProductError = (action, error) => {
    console.error(`Product ${action} failed:`, error);
    setProductError(error.message || `${action} failed`);

    // Auto-clear error after 5 seconds
    setTimeout(() => setProductError(null), 5000);
  };

  // ✅ NEW: Clear error methods
  const clearCartError = useCallback(() => setCartError(null), []);
  const clearProductError = useCallback(() => setProductError(null), []);
  const clearAllErrors = useCallback(() => {
    setCartError(null);
    setProductError(null);
  }, []);

  // ✅ IMPROVED: Use centralized token management from AuthContext
  const { user, getAuthToken, loading: authLoading } = useAuth();

  const getUserId = useCallback(() => {
    if (!user) {
      console.log('🚫 No user object found');
      return null;
    }

    // Check for nested _id (common with MongoDB)
    const id = user._id ||
      user.id ||
      user.userId ||
      (user.user && user.user._id) ||
      (user.data && user.data._id);

    console.log('👤 User ID extracted:', id, 'from user:', user);
    return id;
  }, [user]);

  const userId = getUserId();

  // Helper function to safely parse numbers
  const safeParseFloat = (value, defaultValue = 0) => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  };

  // Helper function to safely parse integers
  const safeParseInt = (value, defaultValue = 0) => {
    const parsed = parseInt(value);
    return isNaN(parsed) ? defaultValue : parsed;
  };

  // ✅ IMPROVED: Enhanced save cart function with better error handling
  const saveCartToDatabase = async (updatedCart) => {
    try {
      const token = getAuthToken();
      const currentUserId = getUserId();

      console.log(currentUserId)

      if (!token) {
        console.warn('No authentication token found. User might not be logged in.');
        return; // Don't throw error for guest users
      }

      if (!currentUserId) {
        console.warn('No user ID found. Cannot save cart to database.');
        return;
      }

      console.log('💾 Saving cart to database for userId:', currentUserId);

      const cartItems = updatedCart.map(item => ({
        productId: item.id || item.productId,
        name: item.name || '',
        brand: item.brand || '',
        image: item.image || '',
        price: safeParseFloat(item.price, 0),
        specifications: item.specifications || '',
        category: item.category || '',
        quantity: safeParseInt(item.quantity, 1),
        totalPrice: safeParseFloat(item.totalPrice, 0)
      }));

      const payload = {
        userId: currentUserId,
        items: cartItems
      };

      console.log('📦 Cart payload:', payload);

      await axios.post('/api/cart', payload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('✅ Cart saved successfully');
      // Clear any previous cart errors on successful save
      clearCartError();
    } catch (err) {
      console.error('❌ Error saving cart:', err.response?.data || err.message);
      logCartError('save to database', err);
      // Don't set orderMessage here to avoid confusion with user actions
    }
  };

  // ✅ IMPROVED: Enhanced load cart function with better error handling
  const loadCartFromDatabase = useCallback(async () => {
    if (!user || authLoading) {
      console.log('Skipping cart load - user not authenticated or auth still loading');
      return;
    }

    const currentUserId = getUserId();
    if (!currentUserId) {
      console.log('Skipping cart load - no valid user ID');
      return;
    }

    try {
      setCartLoading(true);
      clearCartError();

      const token = getAuthToken();
      if (!token) {
        console.warn('No token available for cart loading');
        return;
      }

      console.log('📥 Loading cart for userId:', currentUserId);

      const response = await axios.get(`/api/cart/${currentUserId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data && response.data.items) {
        const transformedCart = response.data.items.map(item => {
          const quantity = safeParseInt(item.quantity, 1);

          return {
            id: item.productId || item.menuItemId || item.id,
            productId: item.productId || item.menuItemId || item.id,
            name: item.name || '',
            brand: item.brand || '',
            image: item.image || '',
            price: 0, // Will be updated by enrichCartWithProductData
            specifications: item.specifications || '',
            category: item.category || '',
            quantity: quantity,
            totalPrice: 0 // Will be recalculated
          };
        });
        setCart(transformedCart);
        console.log(`✅ Loaded ${transformedCart.length} items from cart`);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        console.log('No existing cart found for user');
      } else {
        console.error('❌ Error loading cart:', err.response?.data || err.message);
        logCartError('load from database', err);
      }
    } finally {
      setCartLoading(false);
    }
  }, [user, authLoading, getUserId, getAuthToken, clearCartError]);

  // Enhanced function to merge cart data with product data for complete properties
  const enrichCartWithProductData = useCallback((cartItems, productsData) => {
    return cartItems.map(cartItem => {
      // Find matching product from products array
      const matchingProduct = productsData.find(p =>
        p.id === cartItem.id ||
        p._id === cartItem.id ||
        p.id === cartItem.productId ||
        p._id === cartItem.productId
      );

      if (matchingProduct) {
        // Always use the current product price, not the stored cart price
        const currentPrice = safeParseFloat(matchingProduct.price, 0);
        const quantity = safeParseInt(cartItem.quantity, 1);
        const recalculatedTotal = currentPrice * quantity;

        // Log price updates for debugging
        if (cartItem.price && Math.abs(currentPrice - cartItem.price) > 0.01) {
          console.log(`Price updated for ${matchingProduct.name}: ${cartItem.price} → ${currentPrice}`);
        }

        // Merge cart item with complete product data
        return {
          ...cartItem,
          name: cartItem.name || matchingProduct.name || '',
          brand: cartItem.brand || matchingProduct.brand || '',
          image: cartItem.image || matchingProduct.image || '',
          specifications: cartItem.specifications || matchingProduct.specifications || '',
          category: cartItem.category || matchingProduct.category || '',
          price: currentPrice,
          quantity: quantity,
          totalPrice: recalculatedTotal
        };
      }

      // Return original cart item if no matching product found
      return cartItem;
    });
  }, []);

  // ✅ IMPROVED: Enhanced product loading with better error handling
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        clearProductError();

        console.log('🛍️ Loading products...');
        const response = await axios.get('/api/products');

        const transformedProducts = response.data.map(product => ({
          ...product,
          id: product._id,
          price: safeParseFloat(product.price, 0)
        }));

        setProducts(transformedProducts);
        console.log(`✅ Loaded ${transformedProducts.length} products`);
      } catch (err) {
        logProductError('load products', err);
        setOrderMessage("Failed to load products from server. Make sure backend is running on port 5000.");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [clearProductError]);

  // ✅ IMPROVED: Load cart only after auth is ready
  useEffect(() => {
    if (!authLoading && user) {
      loadCartFromDatabase();
    }
  }, [loadCartFromDatabase, authLoading, user]);

  // Enhanced useEffect to enrich cart data when both cart and products are loaded
  useEffect(() => {
    if (cart.length > 0 && products.length > 0) {
      const enrichedCart = enrichCartWithProductData(cart, products);

      // Always update when products are loaded to ensure current prices
      const needsPriceUpdate = cart.some(item => item.price === 0);

      if (needsPriceUpdate) {
        console.log('Updating cart with current product prices');
        setCart(enrichedCart);
        saveCartToDatabase(enrichedCart);
      } else {
        // Check for other changes
        const hasChanges = enrichedCart.some((item, index) => {
          const original = cart[index];
          return !original ||
            Math.abs(item.price - original.price) > 0.01 ||
            item.totalPrice !== original.totalPrice ||
            item.name !== original.name ||
            item.brand !== original.brand ||
            item.image !== original.image ||
            item.specifications !== original.specifications ||
            item.category !== original.category;
        });

        if (hasChanges) {
          console.log('Updating cart due to product changes');
          setCart(enrichedCart);
          saveCartToDatabase(enrichedCart);
        }
      }
    }
  }, [products, enrichCartWithProductData, saveCartToDatabase]);

  useEffect(() => {
    // Safely calculate total with validation
    const total = cart.reduce((sum, item) => {
      const itemTotal = safeParseFloat(item.totalPrice, 0);
      return sum + itemTotal;
    }, 0);
    setTotalAmount(total);
  }, [cart]);

  // ✅ IMPROVED: Enhanced addToCart with better error handling
  const addToCart = async (product, quantity) => {
    try {
      clearCartError();

      // Validate inputs
      if (!product || !product.id) {
        throw new Error('Invalid product data');
      }

      const currentUserId = getUserId();
      if (!currentUserId) {
        throw new Error('Please log in to add items to cart');
      }

      console.log('🛒 Adding to cart for userId:', currentUserId);

      const validQuantity = safeParseInt(quantity, 1);
      const productPrice = safeParseFloat(product.price, 0);
      const totalPrice = validQuantity * productPrice;

      if (productPrice <= 0) {
        throw new Error('Product price is invalid');
      }

      if (validQuantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }

      const existingIndex = cart.findIndex(ci => (ci.id === product.id || ci.productId === product.id));
      let updatedCart;

      if (existingIndex >= 0) {
        updatedCart = [...cart];
        const currentQuantity = safeParseInt(updatedCart[existingIndex].quantity, 0);
        const updatedQuantity = currentQuantity + validQuantity;
        updatedCart[existingIndex] = {
          ...updatedCart[existingIndex],
          quantity: updatedQuantity,
          totalPrice: updatedQuantity * productPrice
        };
      } else {
        updatedCart = [...cart, {
          id: product.id,
          productId: product.id,
          name: product.name || '',
          brand: product.brand || '',
          image: product.image || '',
          price: productPrice,
          specifications: product.specifications || '',
          category: product.category || '',
          quantity: validQuantity,
          totalPrice
        }];
      }

      setCart(updatedCart);
      await saveCartToDatabase(updatedCart);

      setOrderMessage(`✅ Added ${product.name} (Quantity: ${validQuantity}) to cart`);
      setTimeout(() => setOrderMessage(""), 3000);
    } catch (error) {
      console.error('❌ Add to cart failed:', error.message);
      logCartError('add to cart', error);
      setOrderMessage(`❌ ${error.message}`);
      setTimeout(() => setOrderMessage(""), 3000);
    }
  };

  // ✅ IMPROVED: Enhanced updateCartItemQuantity with better error handling
  const updateCartItemQuantity = async (itemId, newQuantity) => {
    try {
      clearCartError();

      const validQuantity = safeParseInt(newQuantity, 0);

      if (validQuantity <= 0) {
        await removeFromCart(itemId);
        return;
      }

      const updatedCart = cart.map(item => {
        if (item.id === itemId || item.productId === itemId) {
          const itemPrice = safeParseFloat(item.price, 0);
          return {
            ...item,
            quantity: validQuantity,
            totalPrice: validQuantity * itemPrice
          };
        }
        return item;
      });

      setCart(updatedCart);
      await saveCartToDatabase(updatedCart);
    } catch (error) {
      logCartError('update quantity', error);
    }
  };

  // ✅ IMPROVED: Enhanced removeFromCart with better error handling
  const removeFromCart = async (itemId) => {
    try {
      clearCartError();

      const updatedCart = cart.filter(item => item.id !== itemId && item.productId !== itemId);
      setCart(updatedCart);
      await saveCartToDatabase(updatedCart);

      setOrderMessage("✅ Item removed from cart");
      setTimeout(() => setOrderMessage(""), 3000);
    } catch (error) {
      logCartError('remove from cart', error);
      setOrderMessage("❌ Failed to remove item from cart");
      setTimeout(() => setOrderMessage(""), 3000);
    }
  };

  // ✅ IMPROVED: Enhanced clearCart with better error handling
  const clearCart = async () => {
    try {
      clearCartError();

      setCart([]);

      const token = getAuthToken();
      const currentUserId = getUserId();

      if (token && currentUserId) {
        console.log('🗑️ Clearing cart for userId:', currentUserId);
        await axios.delete(`/api/cart/${currentUserId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }

      setOrderMessage("✅ Cart cleared");
      setTimeout(() => setOrderMessage(""), 3000);
    } catch (err) {
      console.error('❌ Error clearing cart:', err.response?.data || err.message);
      logCartError('clear cart', err);
      setOrderMessage("❌ Failed to clear cart");
      setTimeout(() => setOrderMessage(""), 3000);
    }
  };

  // ✅ IMPROVED: Enhanced handlePlaceOrder with better error handling
  const handlePlaceOrder = async (orderData) => {
    try {
      clearCartError();

      console.log("CartContext - Received order data:", orderData);

      if (!orderData) {
        throw new Error("Order data is missing. Please try again.");
      }

      if (!orderData.customerName || !orderData.customerPhone) {
        throw new Error("Customer information is required.");
      }

      if (!orderData.deliveryAddress?.trim()) {
        throw new Error("Please provide a delivery address.");
      }

      if (!orderData.cartItems || orderData.cartItems.length === 0) {
        throw new Error("Cart is empty.");
      }

      const totalAmount = safeParseFloat(orderData.totalAmount, 0);
      const deliveryCharges = safeParseFloat(orderData.deliveryCharges, 0);
      const finalAmount = safeParseFloat(orderData.finalAmount, totalAmount + deliveryCharges);

      if (totalAmount <= 0) {
        throw new Error("Invalid total amount.");
      }

      const token = getAuthToken();
      if (!token) {
        throw new Error("Authentication required to place order.");
      }

      const orderPayload = {
        userId: getUserId(),
        customerName: orderData.customerName.trim(),
        customerPhone: orderData.customerPhone.trim(),
        customerEmail: orderData.customerEmail?.trim() || '',
        deliveryAddress: orderData.deliveryAddress.trim(),
        paymentMethod: orderData.paymentMethod || 'cash',
        specialInstructions: orderData.specialInstructions?.trim() || '',
        cartItems: orderData.cartItems.map(item => ({
          productId: item.id || item.productId,
          name: item.name || '',
          brand: item.brand || '',
          image: item.image || '',
          price: safeParseFloat(item.price, 0),
          specifications: item.specifications || '',
          category: item.category || '',
          quantity: safeParseInt(item.quantity, 1),
          totalPrice: safeParseFloat(item.totalPrice, 0)
        })),
        totalAmount,
        deliveryCharges,
        finalAmount,
        orderType: orderData.orderType || 'electronics'
      };

      console.log('📦 Order payload with userId:', orderPayload.userId, orderPayload);

      const response = await axios.post('/api/checkout', orderPayload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('CartContext - Backend response:', response.data);

      const orderId = response.data.order?.orderNumber || response.data._id;

      setConfirmedOrder({
        orderId,
        cart: [...cart],
        deliveryAddress: orderData.deliveryAddress,
        totalAmount: finalAmount
      });

      await clearCart();

      setOrderMessage(`✅ Order placed successfully! Order ID: ${orderId}`);
      return orderId;
    } catch (error) {
      logCartError('place order', error);
      setOrderMessage(`❌ ${error.message}`);
      throw error;
    }
  };

  const getTotalItemsInCart = () => {
    return cart.reduce((total, item) => {
      const quantity = safeParseInt(item.quantity, 0);
      return total + quantity;
    }, 0);
  };

  const value = {
    cart,
    products,
    loading,
    cartLoading,
    orderMessage,
    totalAmount,
    confirmedOrder,
    cartError,
    productError,
    setOrderMessage,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    handlePlaceOrder,
    getTotalItemsInCart,
    setConfirmedOrder,
    clearCartError,
    clearProductError,
    clearAllErrors
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};