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
    req.role = decoded.role;

    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Only Teacher Access Middleware
const requireTeacher = (req, res, next) => {
  if (req.role !== "teacher") {
    return res.status(403).json({ error: "Access denied: Teachers only" });
  }
  next();
};

// POST /create-classroom
router.post("/create-classroom", authenticate, requireTeacher, async (req, res) => {
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

// GET /teacher-classrooms
router.get("/teacher-classrooms", authenticate, requireTeacher, async (req, res) => {
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
router.post("/add-student", authenticate, requireTeacher, async (req, res) => {
  try {
    const { classroomId, studentEmail } = req.body;

    // Find student by email and role 
    const student = await User.findOne({ email: studentEmail, role: "student" });
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Find classroom
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ error: "Classroom not found" });
    }

    // Check if student is already added to the classroom
    const alreadyAdded = classroom.students.some(
      (s) => s.studentId.toString() === student._id.toString()
    );
    if (alreadyAdded) {
      return res.status(400).json({ error: "Student is already in this classroom" });
    }

    // Add student to the classroom
    classroom.students.push({
      studentId: student._id,
      name: student.name,
      email: student.email,
    });

    classroom.numStudents += 1;

    await classroom.save();
    res.status(200).json({
      message: "Student added successfully",
      student: { name: student.name, email: student.email },
    });
  } catch (error) {
    console.error("Error adding student:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /view-course/:id
router.get("/view-course/:id", authenticate, requireTeacher, async (req, res) => {
  try {
    const classroomId = req.params.id;

    const classroom = await Classroom.findById(classroomId)
      .populate("assignments")
      .populate("exams");

    if (!classroom) {
      return res.status(404).json({ error: "Classroom not found" });
    }

    // Combine assignments and exams into one list for frontend rendering
    const allTasks = [];

    const extractTaskInfo = (task) => {
      const submittedCount = task.submissions.filter((s) => s.submitted).length;
      return {
        id: task._id,
        type: task.type, 
        title: task.title,
        deadline: task.deadline,
        submissions: `${submittedCount}/${classroom.numStudents}`,
      };
    };

    classroom.assignments.forEach((a) => allTasks.push(extractTaskInfo(a)));
    classroom.exams.forEach((e) => allTasks.push(extractTaskInfo(e)));

    res.status(200).json({
      id: classroom._id,
      name: classroom.name,
      description: classroom.description,
      numStudents: classroom.numStudents,
      numAssignments: classroom.numAssignments,
      numExams: classroom.numExams,
      students: classroom.students.map((s) => ({
        studentId: s.studentId,
        name: s.name,
        email: s.email,
      })),
      tasks: allTasks, 
    });
  } catch (error) {
    console.error("Error viewing course:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
