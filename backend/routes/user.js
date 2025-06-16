//routes/user.js
const express = require("express");
const { getUsers } = require("../controllers/user");
const { authenticateToken } = require("../utils/authMiddleware");
const router = express.Router();

router.get("/users", authenticateToken, getUsers);

module.exports = router;