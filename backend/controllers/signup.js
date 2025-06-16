// controllers/signup.js
const signupService = require("../services/signup");
const jwt = require("jsonwebtoken");

async function createUser(req, res) {
    try {
        const userData = req.body;
        
        // Validate required fields
        const { name, email, password } = userData;
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email, and password are required"
            });
        }

        // Check if user already exists
        const existingUser = await signupService.checkUserExists(email);
        if (existingUser) {
            return res.status(400).json({
                message: "User with this email already exists"
            });
        }

        // Create the user
        const savedUser = await signupService.createUser(userData);
        
        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: savedUser._id, 
                email: savedUser.email,
                role: savedUser.role 
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        // Return the expected format
        res.status(201).json({
            success: true,
            message: "User created successfully",
            user: {
                id: savedUser._id,
                name: savedUser.name,
                email: savedUser.email,
                role: savedUser.role
            },
            accessToken: token, // This is what your frontend expects
            // Alternative: you can also include 'token' for backward compatibility
            token: token
        });

    } catch (error) {
        console.error("Signup error:", error);
        
        // Handle duplicate email error from MongoDB
        if (error.code === 11000) {
            return res.status(400).json({
                message: "User with this email already exists"
            });
        }
        
        res.status(500).json({
            message: "Internal server error during signup"
        });
    }
}

module.exports = { createUser };