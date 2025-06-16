const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../utils/authMiddleware');
const Checkout = require('../models/Checkout');

// Helper function to generate order number
const generateOrderNumber = async () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();

  let orderNumber;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 5;

  while (!isUnique && attempts < maxAttempts) {
    orderNumber = `ORD-${timestamp}-${random}${attempts > 0 ? attempts : ''}`;

    // Check if this order number already exists
    const existingOrder = await Checkout.findOne({ orderNumber });
    if (!existingOrder) {
      isUnique = true;
    } else {
      attempts++;
    }
  }

  if (!isUnique) {
    // Fallback: use timestamp + random number
    orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }

  return orderNumber;
};

// Create checkout - Protected with authentication
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Extract userId from authenticated user (same as cart routes)
    const userId = req.user?._id || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'User authentication required',
        debug: {
          hasReqUser: !!req.user,
          reqUserKeys: req.user ? Object.keys(req.user) : []
        }
      });
    }

    const {
      customerName,
      customerPhone,
      customerEmail,
      cartItems,
      totalAmount,
      deliveryCharges,
      finalAmount,
      deliveryAddress,
      specialInstructions,
      paymentMethod,
      orderType
    } = req.body;

    if (!customerName || !customerPhone) {
      return res.status(400).json({ success: false, message: 'Customer name and phone number are required' });
    }

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      console.error("❌ Invalid cartItems received:", cartItems);
      return res.status(400).json({ success: false, message: 'Cart items must be a non-empty array' });
    }

    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Total amount must be greater than 0' });
    }

    if (!deliveryAddress || !deliveryAddress.trim()) {
      return res.status(400).json({ success: false, message: 'Delivery address is required' });
    }

    const calculatedDeliveryCharges = deliveryCharges || 200;
    const calculatedFinalAmount = finalAmount || (totalAmount + calculatedDeliveryCharges);

    const orderNumber = await generateOrderNumber();

    const checkout = new Checkout({
      userId, // Use authenticated userId
      orderNumber,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail ? customerEmail.trim() : undefined,
      cartItems: cartItems.map(item => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        category: item.category,
        brand: item.brand,
        image: item.image,
        quantity: item.quantity,
        totalPrice: item.totalPrice
      })),
      totalAmount,
      deliveryCharges: calculatedDeliveryCharges,
      finalAmount: calculatedFinalAmount,
      deliveryAddress: deliveryAddress.trim(),
      specialInstructions: specialInstructions ? specialInstructions.trim() : undefined,
      paymentMethod: paymentMethod || 'cash',
      orderType: orderType || 'electronics',
      paymentStatus: 'pending',
      orderStatus: 'pending'
    });

    const savedCheckout = await checkout.save();

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order: savedCheckout
    });
  } catch (error) {
    console.error('Error creating checkout:', error);

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Order number already exists. Please try again.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user's own checkouts - Protected with authentication
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'User authentication required' 
      });
    }

    const { orderStatus, paymentStatus, limit = 50, page = 1 } = req.query;

    // Build filter object - always include userId for authenticated user
    const filter = { userId };
    if (orderStatus) filter.orderStatus = orderStatus;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const checkouts = await Checkout.find(filter)
      .sort({ createdAt: -1 }) // Most recent first
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Checkout.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: checkouts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching checkouts:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all checkouts (admin only) - Protected with authentication
router.get('/admin/all', authenticateToken, async (req, res) => {
  try {
    // Optional: Add admin role check here
    // if (req.user.role !== 'admin') {
    //   return res.status(403).json({ success: false, message: 'Admin access required' });
    // }

    const { userId, orderStatus, paymentStatus, limit = 50, page = 1 } = req.query;

    // Build filter object
    const filter = {};
    if (userId) filter.userId = userId;
    if (orderStatus) filter.orderStatus = orderStatus;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const checkouts = await Checkout.find(filter)
      .sort({ createdAt: -1 }) // Most recent first
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Checkout.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: checkouts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching checkouts:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get checkouts by user ID (admin or user accessing their own) - Protected with authentication
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const requestedUserId = req.params.userId;
    const authenticatedUserId = req.user?._id || req.user?.id;

    // Security check: ensure user can only access their own orders (unless admin)
    // Optional: Add admin role check to bypass this restriction
    if (requestedUserId !== authenticatedUserId?.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied - can only access your own orders' 
      });
    }

    const checkouts = await Checkout.find({ userId: requestedUserId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: checkouts
    });
  } catch (error) {
    console.error('Error fetching user checkouts:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get single Checkout by ID - Protected with authentication
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'User authentication required' 
      });
    }

    const checkout = await Checkout.findById(req.params.id);
    if (!checkout) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Security check: ensure user can only access their own order (unless admin)
    if (checkout.userId.toString() !== userId.toString()) {
      // Optional: Add admin role check to bypass this restriction
      return res.status(403).json({
        success: false,
        message: 'Access denied - can only access your own orders'
      });
    }

    res.status(200).json({
      success: true,
      data: checkout
    });
  } catch (error) {
    console.error('Error fetching checkout:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update Checkout status - Protected with authentication (admin only)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    // Optional: Add admin role check here
    // if (req.user.role !== 'admin') {
    //   return res.status(403).json({ success: false, message: 'Admin access required' });
    // }

    const { orderStatus, paymentStatus } = req.body;

    const updateData = {};
    if (orderStatus) updateData.orderStatus = orderStatus;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    // Set delivery date if order is delivered
    if (orderStatus === 'delivered') {
      updateData.actualDelivery = new Date();
    }

    const updated = await Checkout.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error updating checkout status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update Checkout by ID (full update) - Protected with authentication
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'User authentication required' 
      });
    }

    // First check if the order exists and belongs to the user
    const existingCheckout = await Checkout.findById(req.params.id);
    if (!existingCheckout) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Security check: ensure user can only update their own order (unless admin)
    if (existingCheckout.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - can only update your own orders'
      });
    }

    const updated = await Checkout.findByIdAndUpdate(
      req.params.id,
      { ...req.body, userId }, // Ensure userId cannot be changed
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error updating checkout:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete Checkout by ID - Protected with authentication
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'User authentication required' 
      });
    }

    // First check if the order exists and belongs to the user
    const existingCheckout = await Checkout.findById(req.params.id);
    if (!existingCheckout) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Security check: ensure user can only delete their own order (unless admin)
    if (existingCheckout.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - can only delete your own orders'
      });
    }

    const deleted = await Checkout.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting checkout:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Search orders by phone number (admin only) - Protected with authentication
router.get('/search/phone/:phone', authenticateToken, async (req, res) => {
  try {
    // Optional: Add admin role check here
    // if (req.user.role !== 'admin') {
    //   return res.status(403).json({ success: false, message: 'Admin access required' });
    // }

    const { phone } = req.params;
    const checkouts = await Checkout.findByPhone(phone)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: checkouts
    });
  } catch (error) {
    console.error('Error searching by phone:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;