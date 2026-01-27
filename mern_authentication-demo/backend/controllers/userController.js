const User = require("../models/User");

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
 * returns list of users (without password)
 * supports ?search=
 */
exports.getAllUsers = async (req, res) => {
  try {
    const search = req.query.search;

    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const users = await User.find(filter).select("_id name email"); // ✅ safe fields only
    return res.status(200).json(users);
  } catch (error) {
    console.error("getAllUsers error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
