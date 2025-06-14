const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs").promises;
const User = require("../models/User");
const OCRuploadcheck = require("../models/OCRuploadcheck");
require("dotenv").config();

const { authenticate } = require("../middleware/auth");
const OCRonlinecheck = require("../models/OCRonlinecheck");
const router = express.Router();

// User Signup
router.post("/signup", async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const emailLower = email.toLowerCase();  

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
        const emailLower = email.toLowerCase();  
        const user = await User.findOne({ email: emailLower });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ error: "Invalid email or password" });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
        res.json({ message: "Login successful", token, user: { name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Logout & Cleanup
router.post("/logout", authenticate, async (req, res) => {
    try {
        const teacherId = req.userId;  
        const reportPath = `temp/reports/plagiarism_report_${teacherId}.pdf`;

        // Delete the report file if it exists
        await fs.unlink(reportPath).catch(() => { });

        // Also delete extracted text entries from DB
        await OCRuploadcheck.deleteMany({ teacherId });
        await OCRonlinecheck.deleteMany({ teacherId });

        res.status(200).json({ message: "Logged out successfully, report deleted" });
    } catch (error) {
        console.error("Logout Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Profile Update
router.put("/profile", authenticate, async (req, res) => {
    try {
        const { name } = req.body;
        const user = await User.findByIdAndUpdate(req.userId, { name }, { new: true });

        if (!user) return res.status(404).json({ error: "User not found" });

        res.json({ message: "Profile updated successfully", user });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Change Password
router.put("/change-password", authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.userId);

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

module.exports = router;