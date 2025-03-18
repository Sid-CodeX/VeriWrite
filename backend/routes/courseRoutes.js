const express = require("express");
const router = express.Router();
const { createCourse, getTeacherCourses, getStudentCourses, joinCourse, manageStudents } = require("../controllers/courseController");
const authMiddleware = require("../middleware/authMiddleware");
const { v4: uuidv4 } = require("uuid");
const Course = require("../models/Course"); 

// Create a course (Only for teachers)
router.post("/create", authMiddleware, async (req, res) => {
    try {
        const { name, description } = req.body;
        const teacherId = req.user.id; // Extract teacher ID from token

        // Validate input
        if (!name) {
            return res.status(400).json({ message: "Course name is required" });
        }

        // Check if user is a teacher (Modify if user roles are in schema)
        if (req.user.role !== "teacher") {
            return res.status(403).json({ message: "Only teachers can create courses" });
        }

        // Generate a unique invite code
        const inviteCode = uuidv4(); // Generate a UUID for invite

        // Create new course
        const newCourse = new Course({
            name,
            description,
            teacherId,
            inviteCode, // Auto-generated
        });

        // Save to database
        await newCourse.save();

        res.status(201).json({
            message: "Course created successfully",
            course: newCourse,
        });
    } catch (error) {
        console.error("Error creating course:", error);
        res.status(500).json({ message: "Server error. Try again later." });
    }
});

// Get courses created by the teacher
router.get("/teacher", authMiddleware, async (req, res) => {
    try {
        const teacherId = req.user.userId; // Extract teacher ID from JWT
        const role = req.user.role;

        // ✅ Ensure only teachers can access this
        if (role !== "teacher") {
            return res.status(403).json({ message: "Access denied. Only teachers can view created courses." });
        }

        // 🔍 Fetch courses created by the teacher
        const courses = await Course.find({ teacherId });

        res.json({ message: "Courses retrieved successfully", courses });
    } catch (error) {
        console.error("Error fetching teacher's courses:", error);
        res.status(500).json({ message: "Server error" });
    }
});
// Get courses student is enrolled in
router.get("/student", authMiddleware, getStudentCourses);

// Join a course using an invite code
router.post("/join", authMiddleware, async (req, res) => {
    try {
        const { inviteCode } = req.body;
        const studentId = req.user.userId;  // Extract student ID from token
        const role = req.user.role;  // Extract role from token

        // ✅ Ensure only students can join courses
        if (role !== "student") {
            return res.status(403).json({ message: "Only students can join courses" });
        }

        // 🔍 Find the course by invite code
        const course = await Course.findOne({ inviteCode });

        if (!course) {
            return res.status(404).json({ message: "Invalid invite code. Course not found" });
        }

        // ✅ Check if student is already enrolled
        if (course.students.includes(studentId)) {
            return res.status(400).json({ message: "You are already enrolled in this course" });
        }

        // 📌 Add student to the course
        course.students.push(studentId);
        await course.save();

        res.json({ message: "Successfully joined the course", course });
    } catch (error) {
        console.error("Error joining course:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Manage students (Add/Remove)
router.post("/manage-students", authMiddleware, manageStudents);

module.exports = router;
