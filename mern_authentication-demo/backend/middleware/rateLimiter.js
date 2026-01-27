const rateLimit = require("express-rate-limit");

exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minute
  max: 10,             // 10 attempts/minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts, try again later" }
});
