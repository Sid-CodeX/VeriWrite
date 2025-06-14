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

        // Sort submissions by submittedAt descending
        const studentSubmissions = assignment.submissions
            .filter(s => s.studentId.equals(studentId))
            .sort((a, b) => {
                // Handle new Date(0) for unsubmitted items to ensure they sort correctly
                const dateA = a.submittedAt.getTime() === 0 ? -Infinity : a.submittedAt.getTime();
                const dateB = b.submittedAt.getTime() === 0 ? -Infinity : a.submittedAt.getTime(); // Corrected was 'b.submittedAt.getTime()'
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
                submitted: sub.submitted,
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
router.post("/:assignmentId/submit", authenticate, requireStudent, upload.single("file"), async (req, res) => {
    const { assignmentId } = req.params;
    const studentId = req.userId;

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const file = req.file;
    const filePath = file.path;
    const fileExt = path.extname(file.originalname).toLowerCase();

    // Validate file extension and MIME type
    const allowedExtensions = [".pdf", ".docx", ".doc", ".jpg", ".jpeg", ".png"]; // Added .doc here
    const allowedMimeTypes = [
        "application/pdf",
        "application/msword", // .doc
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
        "image/jpeg",
        "image/png"
    ];

    if (!allowedExtensions.includes(fileExt) || !allowedMimeTypes.includes(file.mimetype)) {
        // Delete temp file before responding with error
        try { await fs.unlink(filePath); } catch (err) { }
        return res.status(400).json({ error: `Unsupported file type: ${file.originalname}` });
    }

    let extractedText = "";

    try {
        // 1. Extract text using OCR
        if (fileExt === ".pdf") {
            const pdfData = await pdfParse(await fs.readFile(filePath));
            extractedText = pdfData.text;
        } else if ([".doc", ".docx"].includes(fileExt)) { // Handle both .doc and .docx
            const docData = await mammoth.extractRawText({ path: filePath });
            extractedText = docData.value;
        } else if ([".png", ".jpg", ".jpeg"].includes(fileExt)) {
            extractedText = await extractTextFromImage(filePath);
        } else {
            return res.status(400).json({ error: `Unsupported file format: ${file.originalname}` });
        }

        if (!extractedText.trim()) {
            return res.status(400).json({ error: "No text extracted from the file" });
        }

        const wordCount = (extractedText.match(/\b\w+\b/g) || []).length;
        // Generate MinHash Signature
        const minHashSignature = generateMinHashSignature(extractedText); // Uses default k and numPermutations

        // 2. Update submission in Assignment schema
        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) return res.status(404).json({ error: "Assignment not found" });

        const submission = assignment.submissions.find(sub =>
            sub.studentId.toString() === studentId.toString()
        );

        if (!submission) {
            return res.status(404).json({ error: "You are not enrolled in this assignment or no submission record found" });
        }

        // Check if the deadline has passed and if late submissions are allowed
        const deadlinePassed = new Date(assignment.deadline) < new Date();
        const isLate = deadlinePassed && !assignment.canSubmitLate;

        if (isLate) {
            return res.status(403).json({ error: "Deadline has passed and late submissions are not allowed." });
        }

        // 3. Save submission info
        submission.submitted = true;
        submission.submittedAt = new Date();
        submission.fileName = file.originalname;
        submission.fileSize = file.size;
        submission.extractedText = extractedText;
        submission.wordCount = wordCount;
        submission.minHashSignature = minHashSignature;
        submission.late = deadlinePassed;

        await assignment.save();

        res.status(200).json({ message: "Submission successful" });
    } catch (error) {
        console.error("Submission error:", error);
        res.status(500).json({ error: "Internal server error" });
    } finally {
        // 4. Clean up temp file
        try {
            await fs.unlink(filePath);
        } catch (err) {
            console.error(`Failed to delete temp file: ${filePath}`, err);
        }
    }
});

module.exports = router;