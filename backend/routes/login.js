//routes/login.js

const express = require("express");
const { login, refreshToken } = require("../controllers/login");
const router = express.Router();

router.post("/login", login);
router.post("/refresh-token", refreshToken);

module.exports = router;