const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const OCRuploadcheck = require("../models/OCRuploadcheck");
require("dotenv").config();

const router = express.Router();

// User Signup
router.post("/signup", async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (await User.findOne({ email })) {
            return res.status(400).json({ error: "Email already in use" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword, role });
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
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
        res.status(200).json({ token, role: user.role });

    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// User Logout - Delete Extracted Text
router.post("/logout", async (req, res) => {
    try {
        const { teacherId } = req.body;
        
        // Delete extracted text from temporary storage
        await OCRuploadcheck.deleteMany({ teacherId });

        res.status(200).json({ message: "Logged out, extracted texts deleted" });
    } catch (error) {
        console.error("Logout Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
