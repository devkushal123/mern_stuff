const express = require("express");
const router = express.Router();

const authMiddleware = require("@middleware/authMiddleware");
const roleMiddleware = require("@middleware/roleMiddleware");

const {profile, getAllUsers, adminDashboard} = require("@controllers/userController");


router.get("/", authMiddleware, getAllUsers);

// USER – accessible by logged-in users
router.get(
  "/profile",
  authMiddleware,          // 1️⃣ JWT verification
  profile   // 2️⃣ controller function
);

// ADMIN – only admin role
router.get(
  "/admin-dashboard",
  authMiddleware,              // JWT check
  roleMiddleware("admin"),     // role check
  adminDashboard
);

module.exports = router;
