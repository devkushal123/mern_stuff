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
