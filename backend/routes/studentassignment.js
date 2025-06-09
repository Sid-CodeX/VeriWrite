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

    const assignment = await Assignment.findById(assignmentId)
      .populate("classroomId", "name students")
      .lean();

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    const classroom = assignment.classroomId;

    const isEnrolled = classroom.students.some(s => s.studentId.equals(studentId));
    if (!isEnrolled) {
      return res.status(403).json({ error: "You are not enrolled in this classroom" });
    }

    // Sort submissions by submittedAt descending
    const studentSubmissions = assignment.submissions
      .filter(s => s.studentId.equals(studentId))
      .sort((a, b) => {
            // Handle new Date(0) for unsubmitted items to ensure they sort correctly
            const dateA = a.submittedAt.getTime() === 0 ? -Infinity : a.submittedAt.getTime();
            const dateB = b.submittedAt.getTime() === 0 ? -Infinity : b.submittedAt.getTime();
            return dateB - dateA;
        });

    // The 'latestSubmission' should only be considered if it actually has a file and a non-epoch date
    const latestSubmission = studentSubmissions.find(sub => sub.submitted && sub.fileName && sub.submittedAt.getTime() !== 0) || null;


    let submissionStatus = "Not Submitted"; // Default status
    let submittedAt = null;
    let submissionLate = false;
    let currentFileName = null; // To store the latest file name

    if (latestSubmission) {
      submissionStatus = "Submitted";
      submittedAt = latestSubmission.submittedAt;
      submissionLate = latestSubmission.late || false;
      currentFileName = latestSubmission.fileName; // Get the file name from the latest valid submission
    } else if (new Date(assignment.deadline) < new Date()) {
      submissionStatus = "Overdue";
    } else {
      submissionStatus = "Pending";
    }

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
   submissionStatus: submissionStatus,
   submittedAt: submittedAt, // This will be null if no valid submission
   fileName: currentFileName, // This will be null if no valid submission
   canSubmitLate: assignment.canSubmitLate,
     message: new Date(assignment.deadline) < new Date() && assignment.canSubmitLate
      ? "Deadline has passed. You can still submit, but it will be marked as late."
    : (new Date(assignment.deadline) < new Date() && !assignment.canSubmitLate
     ? "Deadline has passed. Submissions are no longer accepted."
     : "You can submit your work before the deadline."),
   submissionGuidelines: assignment.submissionGuidelines,
   questionFile: assignment.questionFile ? {
    originalName: assignment.questionFile.originalName,
    contentType: assignment.questionFile.contentType
   } : undefined,
   submissions: studentSubmissions.map(sub => ({
    _id: sub._id,
    fileName: sub.fileName,
    submittedAt: sub.submittedAt,
    plagiarismPercent: sub.plagiarismPercent,
    teacherRemark: sub.teacherRemark,
    score: sub.score,
    markDistribution: sub.markDistribution,
    status: sub.status,
    late: sub.late || false,
    fileSize: sub.fileSize,
        submitted: sub.submitted, // <--- ADDED THIS LINE
   }))
  };

  res.status(200).json(response);

 } catch (err) {
  console.error("Error fetching assignment details:", err);
  res.status(500).json({ error: "Internal server error" });
}
});

// GET /studentassignment/view-question/:assignmentId
router.get("/view-question/:assignmentId", authenticate, requireStudent, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const studentId = req.userId;

    const assignment = await Assignment.findById(assignmentId).populate("classroomId", "students");

    if (!assignment || !assignment.questionFile?.data) {
      return res.status(404).json({ error: "Question paper not found" });
    }

    // Verify student is enrolled
    const isEnrolled = assignment.classroomId.students.some(s => s.studentId.equals(studentId));
    if (!isEnrolled) {
      return res.status(403).json({ error: "Access denied: Not enrolled" });
    }

    res.setHeader("Content-Disposition", `inline; filename="${assignment.questionFile.originalName}"`);
    res.setHeader("Content-Type", assignment.questionFile.contentType);
    res.send(assignment.questionFile.data);
  } catch (err) {
    console.error("Error viewing question paper:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /studentassignment/download-question/:assignmentId
router.get("/download-question/:assignmentId", authenticate, requireStudent, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const studentId = req.userId;

    const assignment = await Assignment.findById(assignmentId).populate("classroomId", "students");

    if (!assignment || !assignment.questionFile?.data) {
      return res.status(404).json({ error: "Question paper not found" });
    }

    // Verify student is enrolled
    const isEnrolled = assignment.classroomId.students.some(s => s.studentId.equals(studentId));
    if (!isEnrolled) {
      return res.status(403).json({ error: "Access denied: Not enrolled" });
    }

    res.setHeader("Content-Disposition", `attachment; filename="${assignment.questionFile.originalName}"`);
    res.setHeader("Content-Type", assignment.questionFile.contentType);
    res.send(assignment.questionFile.data);
  } catch (err) {
    console.error("Error downloading question paper:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


module.exports = router;
