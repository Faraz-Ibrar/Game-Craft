const express = require('express');
const passport = require('../configurations/googleConfig');
const { generateToken } = require('../utils/jwtUtils');

// Add this route to your googleAuth.js file
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjust path to your User model

const router = express.Router();

// Initiate Google OAuth
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

// Google OAuth callback
router.get('/google/callback',
    passport.authenticate('google', { session: false }),
    (req, res) => {
        try {
            // Generate JWT token
            const token = generateToken(req.user);

            // Redirect to frontend with token
            res.redirect(`${process.env.FRONTEND_URL}/Order-Management-React/auth/success?token=${token}`);
        } catch (error) {
            console.error('Google auth callback error:', error);
            res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
        }
    }
);

// Verify token route
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user data from database
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role || 'customer'
        });
        
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
});

module.exports = router;