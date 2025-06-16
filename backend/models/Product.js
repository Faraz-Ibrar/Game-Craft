const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true }, // e.g., 'Laptop', 'GPU', 'RAM', etc.
  brand: { type: String, required: true }, // e.g., 'Dell', 'NVIDIA', etc.
  specifications: { type: String }, // Detailed specifications
  image: { type: String, required: true },
  available: { type: Boolean, default: true },
}, {
  timestamps: true // adds createdAt and updatedAt
});

module.exports = mongoose.model('Product', productSchema);