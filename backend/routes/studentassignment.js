const express = require("express");
const Assignment = require("../models/Assignment");
const Classroom = require("../models/Classroom");
const multer = require("multer");
const fs = require("fs/promises");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const { extractTextFromImage } = require("../utils/ocr");
const { generateMinHashSignature } = require("../utils/minhash");
const { authenticate, requireStudent, requireTeacher } = require("../middleware/auth"); 

const router = express.Router();

// Multer setup for file uploads with 10MB file size limit
const upload = multer({
    dest: "temp/",
    limits: { fileSize: 10 * 1024 * 1024 }, 
});

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

        // Sort submissions by submittedAt descending.
        // Also, filter out any submissions where submittedAt is truly an invalid date (e.g., Date(0))
        const studentSubmissions = assignment.submissions
            .filter(s => s.studentId.equals(studentId) && s.submittedAt instanceof Date && s.submittedAt.getTime() > 0)
            .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());

        // The 'latestSubmission' is simply the first one after sorting.
        const latestSubmission = studentSubmissions[0] || null;

        let submissionStatus = "Not Submitted"; // Default status
        let submittedAt = null;
        let latestSubmissionIsLate = false; // Flag for the latest submission's lateness
        let currentFileName = null; // To store the latest file name

        if (latestSubmission) {
            // Check if the latest submission was indeed submitted after the deadline
            const deadlineDate = new Date(assignment.deadline);
            const submissionDate = new Date(latestSubmission.submittedAt);

            // Set the 'late' flag for the submission if it's after the deadline.
            // This is crucial for the "Submitted After Deadline" status.
            latestSubmissionIsLate = submissionDate > deadlineDate;

            submissionStatus = "Submitted";
            submittedAt = latestSubmission.submittedAt;
            currentFileName = latestSubmission.fileName;

            // If the latest submission was late, adjust the status message
            if (latestSubmissionIsLate) {
                submissionStatus = "Submitted (Late)"; // New status for frontend
            }

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
            submittedAt: submittedAt,
            fileName: currentFileName,
            canSubmitLate: assignment.canSubmitLate,
            submissionGuidelines: assignment.submissionGuidelines,
            latestSubmissionIsLate: latestSubmissionIsLate,

            message: new Date(assignment.deadline) < new Date() && assignment.canSubmitLate
                ? "Deadline has passed. You can still submit, but it will be marked as late."
                : (new Date(assignment.deadline) < new Date() && !assignment.canSubmitLate
                    ? "Deadline has passed. Submissions are no longer accepted."
                    : "You can submit your work before the deadline."),

            questionFile: assignment.questionFile ? {
                originalName: assignment.questionFile.originalName,
                contentType: assignment.questionFile.contentType
            } : undefined,
            // THESE ARE THE LINES THAT NEED TO BE *INSIDE* THE OBJECT
            latestSubmissionTeacherRemark: latestSubmission ? latestSubmission.teacherRemark : "No remarks yet.",
            latestSubmissionPlagiarismPercent: latestSubmission ? latestSubmission.plagiarismPercent : null, // Make sure this has a comma before it if it's not the last property

            submissions: studentSubmissions.map(sub => ({
                _id: sub._id,
                fileName: sub.fileName,
                submittedAt: sub.submittedAt,
                plagiarismPercent: sub.plagiarismPercent,
                teacherRemark: sub.teacherRemark,
                status: sub.status,
                late: sub.late || false,
                fileSize: sub.fileSize,
                submitted: sub.submitted,
                // The `teacherRemark` is already explicitly included above from `sub.teacherRemark`
                // No need for a duplicate `teacherRemark: sub.teacherRemark` here.
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

// POST /studentassignment/:assignmentId/submit
router.post(
  "/:assignmentId/submit",
  authenticate,
  requireStudent,
  upload.single("file"),
  async (req, res) => {
    const { assignmentId } = req.params;
    const studentId = req.userId;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const file = req.file;
    const filePath = file.path;
    const fileExt = path.extname(file.originalname).toLowerCase();

    // Allow only specific file types
    const allowedExtensions = [".pdf", ".docx", ".doc", ".jpg", ".jpeg", ".png"];
    const allowedMimeTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
    ];

    if (!allowedExtensions.includes(fileExt) || !allowedMimeTypes.includes(file.mimetype)) {
      try {
        await fs.unlink(filePath);
      } catch (err) {
        console.error("Failed to delete invalid file:", err);
      }
      return res.status(400).json({ error: `Unsupported file type: ${file.originalname}` });
    }

    let extractedText = "";

    try {
      // Extract text based on file type
      if (fileExt === ".pdf") {
        try {
          const pdfData = await pdfParse(await fs.readFile(filePath));
          extractedText = pdfData.text;
        } catch (err) {
          console.warn("pdf-parse failed, falling back to OCR:", err.message);
          extractedText = await extractTextFromImage(filePath);
        }

        // Fallback if text is too short
        if (!extractedText.trim() || extractedText.length < 50) {
          console.log("PDF text is too short, retrying with OCR...");
          extractedText = await extractTextFromImage(filePath);
        }
      } else if ([".doc", ".docx"].includes(fileExt)) {
        const docData = await mammoth.extractRawText({ path: filePath });
        extractedText = docData.value;
      } else if ([".jpg", ".jpeg", ".png"].includes(fileExt)) {
        extractedText = await extractTextFromImage(filePath);
      } else {
        return res.status(400).json({ error: `Unsupported file format: ${file.originalname}` });
      }

      // Final validation of extracted text
      if (!extractedText.trim()) {
        return res.status(400).json({ error: "No readable text could be extracted from the file." });
      }

      // Calculate word count and minhash signature
      const wordCount = (extractedText.match(/\b\w+\b/g) || []).length;
      const minHashSignature = generateMinHashSignature(extractedText);

      // Fetch assignment and validate submission record
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) return res.status(404).json({ error: "Assignment not found" });

      const submission = assignment.submissions.find(
        (sub) => sub.studentId.toString() === studentId.toString()
      );

      if (!submission) {
        return res.status(404).json({ error: "You are not enrolled in this assignment" });
      }

      const now = new Date();
      const deadline = new Date(assignment.deadline);
      const isLate = now > deadline;

      if (isLate && !assignment.canSubmitLate) {
        try {
          await fs.unlink(filePath);
        } catch (err) {
          console.error("Cleanup error after deadline fail:", err);
        }
        return res.status(403).json({ error: "Deadline has passed and late submissions are not allowed." });
      }

      // Update submission record
      submission.submitted = true;
      submission.submittedAt = now;
      submission.fileName = file.originalname;
      submission.fileSize = file.size;
      submission.extractedText = extractedText;
      submission.wordCount = wordCount;
      submission.minHashSignature = minHashSignature;
      submission.late = isLate;

      await assignment.save();

      res.status(200).json({ message: "Submission successful" });
    } catch (error) {
      console.error("Submission error:", error);
      try {
        await fs.unlink(filePath);
      } catch (err) {
        console.error("File cleanup failed during error handling:", err);
      }
      res.status(500).json({ error: "Internal server error" });
    }
  }
);


module.exports = router;