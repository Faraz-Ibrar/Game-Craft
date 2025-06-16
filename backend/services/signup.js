// services/signup.js
const User = require("../models/User");
const bcrypt = require("bcrypt");

async function checkUserExists(email) {
    try {
        const existingUser = await User.findOne({ email });
        return existingUser;
    } catch (error) {
        throw error;
    }
}

async function createUser(userData) {
    try {
        const { name, email, password } = userData;

        const hashedPassword = await bcrypt.hash(password, 10);

        const createdUser = new User({
            name,
            email,
            password: hashedPassword,
            role: "customer"
        });

        const savedUser = await createdUser.save();
        return savedUser;
    } catch (error) {
        throw error;
    }
}

module.exports = { 
    createUser,
    checkUserExists 
};