const express = require("express");
const jwt = require("jsonwebtoken");
const { nanoid } = require("nanoid");
const Classroom = require("../models/Classroom");
const User = require("../models/User");

const router = express.Router();

// Middleware for authentication
const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.teacherId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid Token" });
  }
};

// POST /create-classroom
router.post("/create-classroom", authenticate, async (req, res) => {
  try {
    const { name, description } = req.body;
    const teacherId = req.teacherId;

    if (!name) return res.status(400).json({ error: "Course name is required" });

    const inviteLink = nanoid(10); // Unique 10-character invite code

    const newClassroom = new Classroom({
      name,
      description,
      teacherId,
      inviteLink,
      students: [],
      numStudents: 0,
      numAssignments: 0,
      numExams: 0,
    });

    await newClassroom.save();

    res.status(201).json({
      message: "Classroom created successfully",
      classroom: {
        id: newClassroom._id,
        name: newClassroom.name,
        description: newClassroom.description,
        inviteLink: newClassroom.inviteLink,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creating classroom" });
  }
});

// ✅ GET /teacher-classrooms
router.get("/teacher-classrooms", authenticate, async (req, res) => {
  try {
    const teacherId = req.teacherId;
    
    // Fetch all classrooms created by the teacher
    const classrooms = await Classroom.find({ teacherId });

    if (classrooms.length === 0) {
      return res.status(404).json({ message: "No classrooms found" });
    }

    res.status(200).json({
      classrooms: classrooms.map((classroom) => ({
        id: classroom._id,
        name: classroom.name,
        description: classroom.description,
        numStudents: classroom.numStudents,
        numAssignments: classroom.numAssignments,
        inviteLink: classroom.inviteLink,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching classrooms" });
  }
});

// Add student to classroom
router.post("/add-student", authenticate, async (req, res) => {
  try {
    const { classroomId, studentEmail } = req.body;

    // 1. Find student by email and role 'student'
    const student = await User.findOne({ email: studentEmail, role: "student" });
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // 2. Find classroom
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ error: "Classroom not found" });
    }

    // 3. Check if student is already added to the classroom
    const alreadyAdded = classroom.students.some(
      (s) => s.studentId.toString() === student._id.toString()
    );
    if (alreadyAdded) {
      return res.status(400).json({ error: "Student is already in this classroom" });
    }

    // 4. Add student to the classroom
    classroom.students.push({
      studentId: student._id,
      name: student.name,
      email: student.email,
    });

    // Increment student count
    classroom.numStudents += 1;

    await classroom.save();

    // Respond with success message
    res.status(200).json({
      message: "Student added successfully",
      student: { name: student.name, email: student.email },
    });
  } catch (error) {
    console.error("Error adding student:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
