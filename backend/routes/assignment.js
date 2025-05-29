const express = require("express");
const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");

const Classroom = require("../models/Classroom");
const Assignment = require("../models/Assignment");

const router = express.Router();

// Authentication Middleware with Role
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

// Multer Setup for In-Memory Storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = [".pdf", ".doc", ".docx", ".txt"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedTypes.includes(ext)) {
    return cb(new Error("Invalid file type"));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter,
});

// Utility: Calculate Jaccard Similarity
function calculateSimilarity(text1, text2) {
  const tokenize = (text) => {
    if (!text || typeof text !== "string") return [];
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, "") // remove punctuation
      .split(/\s+/)
      .filter(Boolean);
  };

  const set1 = new Set(tokenize(text1));
  const set2 = new Set(tokenize(text2));

  const intersection = new Set([...set1].filter((word) => set2.has(word)));
  const union = new Set([...set1, ...set2]);

  return union.size === 0 ? 0 : (intersection.size / union.size) * 100;
}

// Utility: Word Count
function getWordCount(text) {
  if (!text || typeof text !== "string") return 0;
  const words = text.trim().split(/\s+/);
  return words.filter(Boolean).length;
}

// Wrapper middleware to catch multer errors in async functions
function multerErrorHandler(middleware) {
  return (req, res, next) => {
    middleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // Handle Multer errors explicitly
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ error: "File size too large. Max 10MB allowed." });
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return res.status(400).json({ error: "Invalid file type. Only PDF, Word, or Text files allowed." });
        }
        return res.status(400).json({ error: err.message });
      } else if (err) {
        return res.status(500).json({ error: "File upload error." });
      }
      next();
    });
  };
}

// POST /create-assignment
router.post("/create-assignment", authenticate,  requireTeacher,  multerErrorHandler(upload.single("file")),  async (req, res) => {
    try {
      const { type, title, description, deadline, classroomId } = req.body;
      const teacherId = req.teacherId;

      if (!type || !title || !deadline || !classroomId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const deadlineDate = new Date(deadline);
      if (isNaN(deadlineDate.getTime()) || deadlineDate <= new Date()) {
        return res.status(400).json({ error: "Deadline must be a valid future date" });
      }

      const classroom = await Classroom.findById(classroomId);
      if (!classroom) return res.status(404).json({ error: "Classroom not found" });

      const submissions = classroom.students.map((student) => ({
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        submitted: false,
        fileName: "",
        extractedText: "",
        plagiarismPercent: null,
      }));

      let questionFile = null;
      if (req.file) {
        questionFile = {
          data: req.file.buffer,
          contentType: req.file.mimetype,
          originalName: req.file.originalname,
        };
      }

      const newAssignment = new Assignment({
        type,
        title,
        description,
        deadline: deadlineDate,
        teacherId,
        classroomId,
        questionFile,
        submissions,
      });

      await newAssignment.save();

      if (type.toLowerCase() === "assignment") {
        classroom.assignments.push(newAssignment._id);
        classroom.numAssignments += 1;
      } else if (type.toLowerCase() === "exam") {
        classroom.exams.push(newAssignment._id);
        classroom.numExams += 1;
      }

      await classroom.save();

      res.status(201).json({
        message: "Assignment created successfully",
        assignmentId: newAssignment._id,
      });
    } catch (error) {
      console.error("Error creating assignment:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// GET /view/:assignmentId
router.get("/view/:assignmentId", authenticate, requireTeacher, async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId)
      .populate("classroomId", "name students")
      .lean();

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const classSize = assignment.classroomId.students.length;
    const students = assignment.classroomId.students;

    let submitted = 0,
      checked = 0;

    const studentSubmissions = students.map((student) => {
      const submission = assignment.submissions.find(
        (sub) => sub.studentId.toString() === student.studentId.toString()
      );

      if (submission) {
        submitted++;
        if (submission.plagiarismPercent !== null && submission.plagiarismPercent !== undefined) {
          checked++;
        }

        return {
          name: student.name,
          email: student.email,
          status: "Submitted",
          submittedDate: submission.submittedAt,
          fileName: submission.fileName || "Uploaded",
          plagiarismPercent: submission.plagiarismPercent ?? "Not checked",
          extractedText: submission.extractedText,
          isChecked: submission.plagiarismPercent !== null && submission.plagiarismPercent !== undefined,
        };
      } else {
        return {
          name: student.name,
          email: student.email,
          status: "Pending",
          submittedDate: null,
          fileName: "No submission",
          plagiarismPercent: "—",
          extractedText: null,
          isChecked: false,
        };
      }
    });

    res.json({
      assignmentTitle: assignment.title,
      assignmentType: assignment.type,
      description: assignment.description,
      dueDate: assignment.deadline,
      classSize,
      submitted,
      pending: classSize - submitted,
      checked,
      studentSubmissions,
    });
  } catch (error) {
    console.error("Error fetching assignment view:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /check-plagiarism/:assignmentId
router.post("/check-plagiarism/:assignmentId", authenticate, requireTeacher, async (req, res) => {
  const { assignmentId } = req.params;

  try {
    const assignment = await Assignment.findById(assignmentId);

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    const submissions = assignment.submissions.filter((sub) => sub.submitted && sub.extractedText);

    if (submissions.length < 2) {
      return res.status(400).json({ error: "Not enough submissions to check plagiarism." });
    }

    for (let i = 0; i < submissions.length; i++) {
      const current = submissions[i];
      const currentText = current.extractedText || "";

      let matches = [];

      for (let j = 0; j < submissions.length; j++) {
        if (i === j) continue;

        try {
          const other = submissions[j];
          const similarity = calculateSimilarity(currentText, other.extractedText || "");

          matches.push({
            matchedStudentId: other.studentId,
            name: other.name,
            email: other.email,
            similarity,
            matchedText: other.extractedText,
          });
        } catch (err) {
          console.error(
            `Error calculating similarity between submission ${current.studentId} and ${submissions[j].studentId}:`,
            err
          );
        }
      }

      matches.sort((a, b) => b.similarity - a.similarity);

      const topMatches = matches.slice(0, 2).map((match) => ({
        matchedStudentId: match.matchedStudentId,
        matchedText: match.matchedText,
        plagiarismPercent: parseFloat(match.similarity.toFixed(2)),
      }));

      const allMatches = matches.map((match) => ({
        name: match.name,
        plagiarismPercent: parseFloat(match.similarity.toFixed(2)),
      }));

      const plagiarismPercent = topMatches.length > 0 ? topMatches[0].plagiarismPercent : 0;
      const wordCount = getWordCount(currentText);

      const submissionToUpdate = assignment.submissions.find(
        (sub) => sub.studentId.toString() === current.studentId.toString()
      );

      if (submissionToUpdate) {
        submissionToUpdate.wordCount = wordCount;
        submissionToUpdate.plagiarismPercent = plagiarismPercent;
        submissionToUpdate.topMatches = topMatches;
        submissionToUpdate.allMatches = allMatches;
      }
    }

    await assignment.save();

    return res.status(200).json({
      message: "Plagiarism check completed",
      totalSubmissions: submissions.length,
      checkedAt: new Date(),
    });
  } catch (err) {
    console.error("Error during plagiarism check:", err);
    return res.status(500).json({ error: "Internal server error during plagiarism check." });
  }
});

// GET /view-report/:assignmentId/:studentId
router.get("/view-report/:assignmentId/:studentId", authenticate, requireTeacher, async (req, res) => {
  const { assignmentId, studentId } = req.params;

  try {
    const assignment = await Assignment.findById(assignmentId).populate("classroomId", "name").lean();

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    const submission = assignment.submissions.find((sub) => sub.studentId.toString() === studentId.toString());

    if (!submission || !submission.submitted) {
      return res.status(404).json({ error: "Submission not found or not submitted" });
    }

    res.json({
      studentId: submission.studentId,
      name: submission.name,
      email: submission.email,
      wordCount: submission.wordCount ?? getWordCount(submission.extractedText),
      plagiarismPercent: submission.plagiarismPercent ?? 0,
      topMatches: submission.topMatches ?? [],
      allMatches: submission.allMatches ?? [],
      extractedText: submission.extractedText,
    });
  } catch (err) {
    console.error("Error fetching plagiarism report:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
