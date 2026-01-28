const User = require("../models/User");
const mongoose = require("mongoose");

exports.profile = (req, res) => {
  res.json({
    message: "User profile",
    userId: req.user.id,
    role: req.user.role
  });
};

exports.adminDashboard = (req, res) => {
  res.json({
    message: "Welcome Admin"
  });
};




/**
 * GET /api/users
 * Returns list of users for chat.
 * - Non-admin: excludes admins
 * - Admin: can see all (optional: also exclude themselves)
 * Supports optional ?search=
 */
exports.getAllUsers = async (req, res) => {
  try {
    const requesterRole = req.user?.role;
    const requesterId = req.user?.id;

    const requesterIdObj =
      mongoose.Types.ObjectId.isValid(requesterId)
        ? new mongoose.Types.ObjectId(requesterId)
        : null;

    const { search } = req.query;
    const baseFilter = {};

    if (search) {
      baseFilter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Hide admins for non-admin requesters
    if (requesterRole !== "admin") {
      baseFilter.role = { $ne: "admin" };
    }

    // Exclude self right in the query
    if (requesterIdObj) {
      baseFilter._id = { $ne: requesterIdObj };
    }

    const users = await User.find(baseFilter)
      .select("_id name email role")
      .lean();

    return res.status(200).json(users);
  } catch (err) {
    console.error("getAllUsers error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
