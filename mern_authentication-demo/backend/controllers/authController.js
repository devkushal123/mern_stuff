const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("@models/User");

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // ✅ Optional but recommended: check existence before create (better UX)
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await User.create({
      name,
      email,
      password: hashedPassword,
      role
    });

    res.status(201).json({ message: "User registered" });

  } catch (err) {
    // Detect E11000 duplicate key error
    if (err.code === 11000) {
      const duplicatedField = Object.keys(err.keyValue || {})[0] || "field";
      const duplicatedValue = err.keyValue?.[duplicatedField];

      return res.status(409).json({
        error: `The ${duplicatedField} '${duplicatedValue}' is already in use. Please provide a different value.`
      });
    }
    // Other errors
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // 404 “User not found” avoid karo ✅
      // Industry best practice is: return same generic error for both “email not found” and “wrong password” to prevent user enumeration (attackers can find which emails are registered).
     //otherwise we can also pass return res.status(404).json({ message: "Resourec/user not found. Invalid credentials" });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({ token, message: "User LoggedIn successfully." });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
