//utils/authMiddleware.js
const jwt = require("jsonwebtoken");
const { secretKey } = require("../configurations/jwtConfig"); // ✅ Destructure the import

function authenticateToken(req, res, next) {
   const authHeader = req.header("Authorization");
   if (!authHeader) {
       return res.status(401).json({ message: "Unauthorized: Missing token!" });
   }
   
   const [bearer, token] = authHeader.split(" ");
   if (bearer !== "Bearer" || !token) {
       return res.status(401).json({ message: "Unauthorized: Invalid token format" });
   }
   
   jwt.verify(token, secretKey, (err, user) => { // ✅ Now using the actual string
       if (err) {
           console.log("JWT verification error:", err.message); // Add logging
           return res.status(403).json({ message: "Forbidden: Invalid Token" });
       }
       req.user = user;
       next();
   });
}

function verifyToken(token) {
    try {
        return jwt.verify(token, secretKey);
    } catch (error) {
        throw new Error("Invalid token");
    }
}


module.exports = { authenticateToken, verifyToken };