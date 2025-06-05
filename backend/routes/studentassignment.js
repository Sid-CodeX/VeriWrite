const express = require("express");
const jwt = require("jsonwebtoken");
const Assignment = require("../models/Assignment");
const Classroom = require("../models/Classroom");

const router = express.Router();

// Authentication Middleware
const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.role = decoded.role;

    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Only Student Access Middleware
const requireStudent = (req, res, next) => {
  if (req.role !== "student") {
    return res.status(403).json({ error: "Access denied: Students only" });
  }
  next();
};

// GET /studentassignment/:assignmentId
router.get("/:assignmentId", authenticate, requireStudent, async (req, res) => {
  try {
    const studentId = req.userId;
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId).populate("classroomId", "name students");

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    const classroom = assignment.classroomId;

    // Check if student belongs to this classroom
    const isEnrolled = classroom.students.some(s => s.studentId.equals(studentId));
    if (!isEnrolled) {
      return res.status(403).json({ error: "You are not enrolled in this classroom" });
    }

    const submission = assignment.submissions.find(s => s.studentId.equals(studentId));
    const submitted = submission?.submitted || false;

    const response = {
      assignmentId: assignment._id,
      classroom: {
        id: classroom._id,
        name: classroom.name
      },
      title: assignment.title,
      description: assignment.description,
      type: assignment.type,
      deadline: assignment.deadline,
      deadlinePassed: new Date(assignment.deadline) < new Date(),
      submissionStatus: submitted ? "Submitted" : "Pending",
      submittedAt: submission?.submittedAt || null,
      fileName: submission?.fileName || null,
      canSubmitLate: new Date(assignment.deadline) < new Date(), // late submission allowed
      message: new Date(assignment.deadline) < new Date()
        ? "Deadline has passed. You can still submit, but it will be marked as late."
        : "You can submit your work before the deadline.",
      submissionGuidelines: [
        "Submit files in PDF, Word, or Text format only",
        "Maximum file size: 10MB",
        "Include your name and roll number in the document",
        "You can submit multiple times",
        "Late submissions will be marked accordingly",
        "Only your last submission will be considered"
      ]
    };

    res.status(200).json(response);

  } catch (err) {
    console.error("Error fetching assignment details:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
