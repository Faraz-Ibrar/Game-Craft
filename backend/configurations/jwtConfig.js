//backend/configurations/jwtConfig
const crypto = require("crypto");

// Use environment variable or generate a fallback
const secretKey = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

// Add logging to debug
console.log("JWT Secret loaded:", secretKey ? "✅ Success" : "❌ Failed");

module.exports = {
    secretKey
};