//backend/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cors = require('cors'); // Add CORS

const cartRoutes = require('./routes/cartRoutes');
const checkoutRoutes = require('./routes/checkoutRoutes');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/googleAuth');
const loginRoutes = require('./routes/login');
const signupRoutes = require('./routes/signup');
const userRoutes = require('./routes/user');
const createAdminAccount = require("./scripts/admin");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Allow requests from React app
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Routes
app.use('/api/cart', cartRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/products', productRoutes);
app.use("/user", signupRoutes);
app.use("/auth", loginRoutes);
app.use("/auth", authRoutes);  // Add Google auth routes
app.use("/api", userRoutes);


createAdminAccount();

// Home route
app.get('/', (req, res) => {
  res.send('Welcome to HomeCook Backend!');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});