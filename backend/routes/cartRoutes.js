const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../utils/authMiddleware');
const Cart = require('../models/Cart');

// Create or Update Cart (Upsert by userId) - Protected with authentication
router.post('/', authenticateToken, async (req, res) => {
  try {
    // 🐛 DEBUG: Log everything to see what's happening
    console.log('=== CART POST DEBUG ===');
    console.log('req.user:', req.user);
    console.log('req.user type:', typeof req.user);
    console.log('req.user._id:', req.user?._id);
    console.log('req.user.id:', req.user?.id);
    console.log('req.body:', req.body);
    console.log('req.body.userId:', req.body.userId);
    console.log('=======================');

    // Try multiple ways to get userId
    const userId = req.user?._id || req.user?.id || req.body.userId;
    
    console.log('🎯 Final userId:', userId);
    console.log('🎯 userId type:', typeof userId);

    if (!userId) {
      return res.status(401).json({ 
        message: 'User authentication failed - no valid userId found',
        debug: {
          hasReqUser: !!req.user,
          reqUserKeys: req.user ? Object.keys(req.user) : [],
          reqBodyUserId: req.body.userId
        }
      });
    }
    
    const { items } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ message: 'Invalid request body. items array is required.' });
    }

    // Validate items
    for (const item of items) {
      if (!item.productId || !item.quantity) {
        return res.status(400).json({ message: 'Each cart item must have productId and quantity.' });
      }
      item.quantity = item.quantity || 1;
    }

    console.log('🔍 About to save cart for userId:', userId);

    const cart = await Cart.findOneAndUpdate(
      { userId },
      { items },
      { new: true, upsert: true }
    );

    console.log('✅ Cart saved successfully:', cart);
    res.status(200).json(cart);
  } catch (error) {
    console.error('❌ Error in creating/updating cart:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Get Cart by authenticated user - FIXED ROUTE
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('=== CART GET DEBUG ===');
    console.log('req.user:', req.user);
    console.log('req.user._id:', req.user?._id);
    console.log('=======================');

    const userId = req.user?._id || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User authentication required' });
    }

    const cart = await Cart.findOne({ userId });
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    res.status(200).json(cart);
  } catch (error) {
    console.error('Error fetching cart by userId:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ADDED: Alternative route for frontend compatibility
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    console.log('=== CART GET BY PARAM DEBUG ===');
    console.log('req.params.userId:', req.params.userId);
    console.log('req.user._id:', req.user?._id);
    console.log('===============================');

    const requestedUserId = req.params.userId;
    const authenticatedUserId = req.user?._id || req.user?.id;

    // Security check: ensure user can only access their own cart
    if (requestedUserId !== authenticatedUserId?.toString()) {
      return res.status(403).json({ message: 'Access denied - can only access your own cart' });
    }

    const cart = await Cart.findOne({ userId: requestedUserId });
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    res.status(200).json(cart);
  } catch (error) {
    console.error('Error fetching cart by userId param:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update Cart by authenticated user
router.put('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User authentication required' });
    }

    const { items } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ message: 'Invalid request body. items array is required.' });
    }

    // Validate and set defaults for each item
    for (const item of items) {
      if (!item.productId || !item.name || !item.image || !item.price) {
        return res.status(400).json({ 
          message: 'Each cart item must have productId, name, image, and price.' 
        });
      }
      
      if (!item.quantity) item.quantity = 1;
      if (!item.totalPrice) item.totalPrice = item.quantity * item.price;
      if (!item.brand) item.brand = '';
      if (!item.category) item.category = 'Electronics';
      if (!item.specifications) item.specifications = '';
    }

    const cart = await Cart.findOneAndUpdate(
      { userId },
      { items },
      { new: true }
    );
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    res.status(200).json(cart);
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete entire Cart by authenticated user - FIXED ROUTE
router.delete('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User authentication required' });
    }

    const deletedCart = await Cart.findOneAndDelete({ userId });
    if (!deletedCart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    res.status(200).json({ message: 'Cart deleted successfully' });
  } catch (error) {
    console.error('Error deleting cart:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ADDED: Alternative delete route for frontend compatibility
router.delete('/:userId', authenticateToken, async (req, res) => {
  try {
    const requestedUserId = req.params.userId;
    const authenticatedUserId = req.user?._id || req.user?.id;

    // Security check
    if (requestedUserId !== authenticatedUserId?.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const deletedCart = await Cart.findOneAndDelete({ userId: requestedUserId });
    if (!deletedCart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    res.status(200).json({ message: 'Cart deleted successfully' });
  } catch (error) {
    console.error('Error deleting cart:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add single item to cart - Protected with authentication
router.post('/add-item', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User authentication required' });
    }

    const { productId, name, image, price, brand = '', category = 'Electronics', specifications = '', quantity = 1 } = req.body;

    if (!productId || !name || !image || !price) {
      return res.status(400).json({ 
        message: 'Required fields: productId, name, image, price' 
      });
    }

    const totalPrice = quantity * price;

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      // Create new cart
      cart = new Cart({
        userId,
        items: [{
          productId,
          name,
          image,
          price,
          brand,
          category,
          specifications,
          quantity,
          totalPrice
        }]
      });
    } else {
      // Check if item already exists
      const existingItemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
      
      if (existingItemIndex >= 0) {
        // Update existing item
        const existingItem = cart.items[existingItemIndex];
        const newQuantity = existingItem.quantity + quantity;
        const newTotalPrice = newQuantity * price;

        cart.items[existingItemIndex] = {
          ...existingItem.toObject(),
          quantity: newQuantity,
          totalPrice: newTotalPrice
        };
      } else {
        // Add new item
        cart.items.push({
          productId,
          name,
          image,
          price,
          brand,
          category,
          specifications,
          quantity,
          totalPrice
        });
      }
    }

    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Remove single item from cart - Protected with authentication
router.delete('/remove-item/:productId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User authentication required' });
    }

    const { productId } = req.params;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => item.productId.toString() !== productId);
    await cart.save();

    res.status(200).json(cart);
  } catch (error) {
    console.error('Error removing item from cart:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get ALL Carts (for admin purposes only)
router.get('/admin/all', authenticateToken, async (req, res) => {
  try {
    // Optional: Add admin role check here
    // if (req.user.role !== 'admin') {
    //   return res.status(403).json({ message: 'Admin access required' });
    // }
    
    const carts = await Cart.find().sort({ updatedAt: -1 });
    res.status(200).json(carts);
  } catch (error) {
    console.error('Error fetching carts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get cart summary (total items, total amount) - Protected with authentication
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User authentication required' });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const totalItems = cart.items.length;
    const totalAmount = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    res.status(200).json({
      userId: cart.userId,
      totalItems,
      totalAmount,
      totalQuantity,
      lastUpdated: cart.updatedAt
    });
  } catch (error) {
    console.error('Error fetching cart summary:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;