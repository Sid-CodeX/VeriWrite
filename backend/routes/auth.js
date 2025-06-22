const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs").promises;
const User = require("../models/User");
const Classroom = require("../models/Classroom");
const Assignment = require("../models/Assignment");
const { authenticate } = require("../middleware/auth");
const OCRonlinecheck = require("../models/OCRonlinecheck");
const OCRuploadcheck = require("../models/OCRuploadcheck");
const router = express.Router();
require("dotenv").config();

/**
 * @route POST /auth/signup
 * @desc Register a new user, return JWT token on success
 * @access Public
 */
router.post("/signup", async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const emailLower = email.toLowerCase();

        // Check if email already exists
        if (await User.findOne({ email: emailLower })) {
            return res.status(400).json({ error: "Email already in use" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save new user
        const newUser = new User({ name, email: emailLower, password: hashedPassword, role });
        await newUser.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: newUser._id, role: newUser.role },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.status(201).json({
            message: "User registered successfully!",
            token,
            user: {
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
            },
        });
    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

/**
 * @route POST /auth/login
 * @desc Authenticate user, return JWT token on success
 * @access Public
 */
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const emailLower = email.toLowerCase();

        // Find user by email
        const user = await User.findOne({ email: emailLower });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ error: "Invalid email or password" });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

/**
 * @route POST /auth/logout
 * @desc Log out user, clean up temporary reports and DB records
 * @access Private
 */
router.post("/logout", authenticate, async (req, res) => {
    try {
        const teacherId = req.userId;
        const reportPath = `temp/reports/plagiarism_report_${teacherId}.pdf`;

        // Delete report file if exists
        await fs.unlink(reportPath).catch(() => { /* Ignore file not found error */ });

        // Remove extracted text records related to the user
        await OCRuploadcheck.deleteMany({ teacherId });
        await OCRonlinecheck.deleteMany({ teacherId });

        res.status(200).json({ message: "Logged out successfully, report deleted" });
    } catch (error) {
        console.error("Logout Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

/**
 * @route PUT /auth/profile
 * @desc Update user profile (currently name only), reflect in related models
 * @access Private
 */
router.put("/profile", authenticate, async (req, res) => {
    try {
        const { name } = req.body;
        const userId = req.userId;

        if (!name || typeof name !== "string" || name.trim() === "") {
            return res.status(400).json({ error: "Valid name is required for profile update" });
        }

        // Update user's name
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { name: name.trim() },
            { new: true, select: "_id name email role" }
        );

        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        // Propagate name change to classrooms and assignments
        await Classroom.updateMany(
            { "students.studentId": userId },
            { $set: { "students.$[elem].name": updatedUser.name } },
            { arrayFilters: [{ "elem.studentId": userId }] }
        );

        await Assignment.updateMany(
            { "submissions.studentId": userId },
            { $set: { "submissions.$[elem].name": updatedUser.name } },
            { arrayFilters: [{ "elem.studentId": userId }] }
        );

        res.json({ message: "Profile updated successfully", user: updatedUser });
    } catch (error) {
        console.error("Profile Update Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

/**
 * @route PUT /auth/change-password
 * @desc Change current user's password
 * @access Private
 */
router.put("/change-password", authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.userId);

        if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
            return res.status(400).json({ error: "Incorrect current password" });
        }

        // Update password with hash
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({ message: "Password changed successfully" });
    } catch (error) {
        console.error("Password Change Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
