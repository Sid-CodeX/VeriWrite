const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();

const router = express.Router();

// Generate JWT Token
const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};

// User Signup
router.post("/signup", async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const emailLower = email.toLowerCase(); // ✅ Convert email to lowercase

        if (await User.findOne({ email: emailLower })) {
            return res.status(400).json({ error: "Email already in use" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email: emailLower, password: hashedPassword, role });
        await newUser.save();

        res.status(201).json({ message: "User registered successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});



// User Login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ error: "Invalid email or password" });
        }

        const token = generateToken(user);
        res.json({ token, user });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// User Logout (Handled on frontend by clearing token)

// Update Profile
router.put("/profile", async (req, res) => {
    try {
        const { userId, name, email } = req.body;
        const user = await User.findByIdAndUpdate(userId, { name, email }, { new: true });

        if (!user) return res.status(404).json({ error: "User not found" });

        res.json({ message: "Profile updated successfully", user });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Change Password
router.put("/change-password", async (req, res) => {
    try {
        const { userId, currentPassword, newPassword } = req.body;
        const user = await User.findById(userId);

        if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
            return res.status(400).json({ error: "Incorrect current password" });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({ message: "Password changed successfully" });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Reset Password (Send Email - To Be Implemented)
router.post("/reset-password", async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ error: "Email not found" });

        // Here, you would send a password reset email with a token
        res.json({ message: "Password reset instructions sent to email" });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
