const express = require("express");
const jwt = require("jsonwebtoken");
const Classroom = require("../models/Classroom");
const Assignment = require("../models/Assignment");

const router = express.Router();

// ✅ Authentication Middleware
const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.studentId = decoded.userId;
    req.role = decoded.role;

    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// ✅ Only Student Access Middleware
const requireStudent = (req, res, next) => {
  if (req.role !== "student") {
    return res.status(403).json({ error: "Access denied: Students only" });
  }
  next();
};

// ✅ GET /student/dashboard
router.get("/dashboard", authenticate, requireStudent, async (req, res) => {
  try {
    const studentId = req.studentId;

    // Get classrooms student is part of
    const classrooms = await Classroom.find({
      "students.studentId": studentId
    })
      .populate("teacherId", "name")
      .populate("assignments")
      .lean();

    let totalCourses = classrooms.length;
    let totalAssignments = 0;
    let completedAssignments = 0;

    const courses = [];

    for (const classroom of classrooms) {
      const { _id, name, teacherId, assignments } = classroom;
      const instructor = teacherId.name;
      const total = assignments.length;
      let submitted = 0;

      let nextDue = null;
      let nextDueTitle = "";
      let pastDue = false;

      for (const assignment of assignments) {
        totalAssignments++;

        const submission = assignment.submissions.find(
          (sub) => sub.studentId.toString() === studentId.toString()
        );

        if (submission && submission.submitted) {
          submitted++;
          completedAssignments++;
        }

        // Determine next due assignment
        const isUpcoming =
          !nextDue || new Date(assignment.deadline) < new Date(nextDue);
        if (!submission || !submission.submitted) {
          if (isUpcoming) {
            nextDue = assignment.deadline;
            nextDueTitle = assignment.title;
            pastDue = new Date(assignment.deadline) < new Date();
          }
        }
      }

      courses.push({
        classroomId: _id,
        name,
        instructor,
        progress: total === 0 ? 0 : Math.round((submitted / total) * 100),
        totalAssignments: total,
        submittedAssignments: submitted,
        nextDue: nextDueTitle
          ? {
              title: nextDueTitle,
              dueDate: nextDue,
              pastDue,
            }
          : null,
      });
    }

    return res.status(200).json({
      totalCourses,
      totalAssignments,
      completedAssignments,
      courses,
    });
  } catch (err) {
    console.error("Error fetching student dashboard:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
