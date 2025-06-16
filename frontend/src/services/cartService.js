// src/services/cartService.js
import { cartAPI } from './api';

export class CartService {
  constructor() {
    this.listeners = [];
  }

  // Add listener for cart updates
  addListener(callback) {
    this.listeners.push(callback);
  }

  // Remove listener
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Notify all listeners of cart changes
  notifyListeners(cartData) {
    this.listeners.forEach(callback => callback(cartData));
  }

  // Get user ID from localStorage
  getUserId() {
    const userData = localStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      return user.id || user._id;
    }
    return null;
  }

  // Get cart for authenticated user
  async getCart() {
    try {
      const userId = this.getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const cartData = await cartAPI.getCart(userId);
      this.notifyListeners(cartData);
      return cartData;
    } catch (error) {
      console.error('Error fetching cart:', error);
      throw error;
    }
  }

  // Add item to cart
  async addToCart(productData) {
    try {
      const userId = this.getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const cartData = await cartAPI.addToCart(userId, productData);
      this.notifyListeners(cartData);
      return cartData;
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  }

  // Update cart item quantity
  async updateCartItem(productId, quantity) {
    try {
      const userId = this.getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      if (quantity <= 0) {
        return await this.removeFromCart(productId);
      }

      const cartData = await cartAPI.updateCartItem(userId, productId, quantity);
      this.notifyListeners(cartData);
      return cartData;
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw error;
    }
  }

  // Remove item from cart
  async removeFromCart(productId) {
    try {
      const userId = this.getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const cartData = await cartAPI.removeFromCart(userId, productId);
      this.notifyListeners(cartData);
      return cartData;
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  }

  // Clear entire cart
  async clearCart() {
    try {
      const userId = this.getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const cartData = await cartAPI.clearCart(userId);
      this.notifyListeners(cartData);
      return cartData;
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  }

  // Calculate cart totals
  calculateTotals(cartItems) {
    if (!cartItems || !Array.isArray(cartItems)) {
      return { totalItems: 0, totalAmount: 0 };
    }

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return { totalItems, totalAmount };
  }
}

// Create and export a singleton instance
export const cartService = new CartService();
export default cartService;