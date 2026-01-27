const express = require("express");
const { loginLimiter } = require("@middleware/rateLimiter"); // ✅ IMPORT
const { register, login } = require("../controllers/authController");

const { validateBody } = require("../middleware/validate");
const { registerSchema, loginSchema } = require("../validations/auth.validation");

const router = express.Router();

router.post("/register", validateBody(registerSchema), register);
router.post("/login", loginLimiter, validateBody(loginSchema), login);

module.exports = router;
