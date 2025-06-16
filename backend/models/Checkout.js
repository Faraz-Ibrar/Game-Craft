const mongoose = require('mongoose');

const checkoutSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true 
  },
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },

  // Customer Info
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerEmail: { type: String },

  // Cart Items
  cartItems: [
    {
      productId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true 
      },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      category: { type: String },
      brand: { type: String },
      image: { type: String },
      quantity: { type: Number, required: true, min: 1 },
      totalPrice: { type: Number, required: true }
    }
  ],

  // Amounts
  totalAmount: { type: Number, required: true },
  deliveryCharges: { type: Number, default: 200 },
  finalAmount: { type: Number, required: true },

  // Delivery
  deliveryAddress: { type: String, required: true },
  specialInstructions: { type: String },

  // Payment & Order Info
  paymentMethod: {
    type: String,
    required: true,
    enum: ['cash', 'card', 'online'],
    default: 'cash'
  },
  paymentStatus: {
    type: String,
    default: 'pending',
    enum: ['pending', 'completed', 'failed']
  },
  orderStatus: {
    type: String,
    default: 'pending',
    enum: ['pending', 'confirmed', 'processing', 'delivered', 'cancelled']
  },
  orderType: {
    type: String,
    default: 'electronics'
  },

  // Delivery tracking
  actualDelivery: { type: Date }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Generate order number
checkoutSchema.pre('save', function(next) {
  if (this.isNew && !this.orderNumber) {
    this.orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
  next();
});

// Virtual for populated products
checkoutSchema.virtual('products', {
  ref: 'Product',
  localField: 'cartItems.productId',
  foreignField: '_id'
});

// Add static method for phone search
checkoutSchema.statics.findByPhone = function(phone) {
  return this.find({ customerPhone: phone });
};

module.exports = mongoose.model('Checkout', checkoutSchema);