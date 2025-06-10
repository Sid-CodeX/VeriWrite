const express = require("express");
const jwt = require("jsonwebtoken");
const Classroom = require("../models/Classroom");
const Assignment = require("../models/Assignment");
const User = require("../models/User");

const router = express.Router();

// Authentication Middleware
const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId; // changed
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

// ✅ GET /student/dashboard
router.get("/dashboard", authenticate, requireStudent, async (req, res) => {
  try {
    const studentId = req.userId; 


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

// POST /studentcourses/join
router.post("/join", authenticate, requireStudent, async (req, res) => {
  try {
    const studentId = req.userId;
    const { classCode } = req.body;

    if (!classCode) {
      return res.status(400).json({ error: "Class code is required" });
    }

    const classroom = await Classroom.findOne({ inviteLink: classCode }).populate("assignments");

    if (!classroom) {
      return res.status(404).json({ error: "Classroom not found" });
    }

    if (classroom.blockedUsers.some(u => u.userId.equals(studentId))) {
      return res.status(403).json({ error: "You are blocked from this class." });
    }

    if (classroom.students.some(s => s.studentId.equals(studentId))) {
      return res.status(409).json({ message: "Already enrolled in this class." });
    }

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Add student to classroom
    classroom.students.push({
      studentId,
      name: student.name,
      email: student.email
    });
    classroom.numStudents += 1;

    // Add empty submission for each assignment
    for (const assignment of classroom.assignments) {
      assignment.submissions.push({
        studentId,
        name: student.name,
        email: student.email,
        submitted: false
      });
      await assignment.save();
    }

    await classroom.save();

    res.status(200).json({ message: "Successfully joined the class!" });
  } catch (error) {
    console.error("Error joining class:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /studentcourses/:classroomId
router.get("/:classroomId", authenticate, requireStudent, async (req, res) => {
  try {
    const studentId = req.userId;
    const { classroomId } = req.params;
    const { filter = "all" } = req.query;

    const classroom = await Classroom.findById(classroomId)
      .populate("teacherId", "name")
      .populate({
        path: "assignments exams",
        options: { sort: { deadline: 1 } } // sort by upcoming first
      });

    if (!classroom) {
      return res.status(404).json({ error: "Classroom not found" });
    }

    // Ensure student is enrolled
    const isEnrolled = classroom.students.some(s => s.studentId.equals(studentId));
    if (!isEnrolled) {
      return res.status(403).json({ error: "You are not enrolled in this classroom" });
    }

    const allItems = [...classroom.assignments, ...classroom.exams];

    const responseAssignments = allItems
      .map(item => {
        // Find the specific student's latest submission for this assignment/exam
        // Assuming you want the *latest* valid submission for status
        const studentSubmissions = item.submissions
                                    .filter(s => s.studentId && s.studentId.equals(studentId) && s.submitted)
                                    .sort((a, b) => b.submittedAt - a.submittedAt); // Sort by most recent first

        const latestSubmission = studentSubmissions.length > 0 ? studentSubmissions[0] : null;

        const submitted = !!latestSubmission; // True if a latestSubmission exists
        const submittedAt = latestSubmission?.submittedAt || null;

        const deadlineDate = new Date(item.deadline);
        const now = new Date();
        const isOverdue = deadlineDate < now && !submitted; // An item is overdue if deadline passed AND it's not submitted

        return {
          id: item._id,
          type: item.type,
          title: item.title,
          description: item.description,
          deadline: item.deadline, // Keep as string/Date from DB
          submitted: submitted, // <--- EXPLICITLY ADDED THIS BOOLEAN
          submittedAt: submittedAt, // <--- EXPLICITLY ADDED THIS DATE/NULL
          isOverdue: isOverdue, // This will be calculated on the backend now for consistency
        };
      })
      .filter(item => {
        // Apply frontend filter logic AFTER preparing all items
        if (filter === "pending") return !item.submitted;
        if (filter === "submitted") return item.submitted;
        return true; // "all"
      });

    res.status(200).json({
      classroom: {
        name: classroom.name,
        description: classroom.description,
        teacher: classroom.teacherId.name
      },
      // Sort assignments by deadline (upcoming first) for the final response
      assignments: responseAssignments.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    });

  } catch (err) {
    console.error("Error fetching classroom details:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


module.exports = router;
