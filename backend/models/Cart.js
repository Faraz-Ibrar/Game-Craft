const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true },
    brand: { type: String, default: '' },
    category: { type: String, default: 'Electronics' },
    specifications: { type: String, default: '' },
    quantity: { type: Number, required: true, default: 1, min: 1 },
    totalPrice: { type: Number, required: true }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for populated products
cartSchema.virtual('products', {
  ref: 'Product',
  localField: 'items.productId',
  foreignField: '_id'
});

// Virtual for calculating cart total
cartSchema.virtual('total').get(function () {
  return this.items.reduce((total, item) => {
    return total + (item.quantity * (item.product?.price || 0));
  }, 0);
});

module.exports = mongoose.model('Cart', cartSchema);