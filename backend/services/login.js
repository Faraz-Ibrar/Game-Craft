//services/login.js
const bcrypt = require("bcrypt");
const User = require("../models/User");
const { generateToken } = require("../utils/jwtUtils");
const { verifyToken } = require("../utils/authMiddleware")

async function login(email, password) {
    try {
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            throw new Error("User not found");
        }
        const isPasswordValid = await bcrypt.compare(password, existingUser.password);
        if (!isPasswordValid) {
            throw new Error("Incorrect password");
        }
        const token = generateToken(existingUser);
        return token;
    } catch (error) {
        console.log("Error Message : ", error);
        throw new Error("Invalid credentials");
    }
}

async function refreshToken(oldToken) {
    try {
        const decodedToken = verifyToken(oldToken); // Verifies the JWT
        const user = await User.findById(decodedToken._id); // Make sure to await if it's a Promise

        if (!user) {
            throw new Error("User not found");
        }

        const newToken = generateToken(user); // Generates a new token
        return newToken;

    } catch (error) {
        throw new Error("Invalid token");
    }
}

module.exports = {
    login,
    refreshToken
};