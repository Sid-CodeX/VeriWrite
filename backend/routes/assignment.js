const express = require("express");
const multer = require("multer");
const path = require("path");
const Classroom = require("../models/Classroom");
const Assignment = require("../models/Assignment");
const { calculateJaccardSimilarity } = require("../utils/similarity");
const { findCandidatePairs } = require("../utils/lsh");
const User = require("../models/User");
const { authenticate, requireTeacher, requireStudent } = require("../middleware/auth");
const router = express.Router();

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

router.post("/create-assignment", authenticate, requireTeacher, multerErrorHandler(upload.single("file")), async (req, res) => {
    try {
        const {
            type,
            title,
            description,
            deadline,
            classroomId,
            canSubmitLate
        } = req.body;
        const teacherId = req.userId;

        if (!type || !title || !deadline || !classroomId) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const deadlineDate = new Date(deadline);
        // Ensure deadline is a valid future date
        if (isNaN(deadlineDate.getTime()) || deadlineDate <= new Date()) {
            return res.status(400).json({ error: "Deadline must be a valid future date" });
        }

        const classroom = await Classroom.findById(classroomId);
        if (!classroom) return res.status(404).json({ error: "Classroom not found" });

        // Check for duplicate assignment title within the same classroom and type
        const existingAssignment = await Assignment.findOne({
            classroomId: classroomId,
            title: { $regex: new RegExp(`^${title.trim()}$`, 'i') }, // Case-insensitive exact match
            type: type,
        });

        if (existingAssignment) {
            return res.status(409).json({ error: `An ${type.toLowerCase()} with the title "${title}" already exists in this classroom.` });
        }

        const submissions = classroom.students.map((student) => ({
            studentId: student.studentId,
            name: student.name,
            email: student.email,
            submitted: false,
            fileName: "",
            extractedText: "",
            minHashSignature: [],
            plagiarismPercent: null,
            fileSize: 0,
            submittedAt: new Date(0),
            status: "pending",
            late: false,
            teacherRemark: "No remarks",
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
            canSubmitLate: canSubmitLate !== undefined ? canSubmitLate : true,
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
            task: { // Return enough data for frontend to update without refetching all
                id: newAssignment._id,
                title: newAssignment.title,
                deadline: newAssignment.deadline,
                type: newAssignment.type,
                description: newAssignment.description, 
                submissions: `0/${classroom.numStudents}`,
                hasFile: !!newAssignment.questionFile, // Indicate if file was uploaded
                canSubmitLate: newAssignment.canSubmitLate,
            }
        });
    } catch (error) {
        console.error("Error creating assignment:", error);
        if (error.code === 11000) {
            return res.status(409).json({ error: "An assignment/exam with this title and type already exists in this classroom." });
        }
        res.status(500).json({ error: "Server error" });
    }
});

// View Assignment Route
router.get("/view/:assignmentId", authenticate, requireTeacher, async (req, res) => {
    try {
        const { assignmentId } = req.params;

        // Populate matchedStudentId within topMatches and allMatches inside submissions
        const assignment = await Assignment.findById(assignmentId)
            .populate("classroomId", "name students") // Populates Classroom data
            .populate({ // Population for topMatches.matchedStudentId
                path: 'submissions.topMatches.matchedStudentId',
                model: 'User', // Explicitly specify the model, though 'ref' in schema is usually enough
                select: 'name email' // Select only name and email from the User model
            })
            .populate({ // Population for allMatches.matchedStudentId
                path: 'submissions.allMatches.matchedStudentId',
                model: 'User',
                select: 'name email'
            })
            .lean(); // Use lean() for better performance as you're not modifying Mongoose documents

        if (!assignment) {
            return res.status(404).json({ message: "Assignment not found" });
        }

        const classSize = assignment.classroomId.students.length;
        const students = assignment.classroomId.students; // These are User _id's with name/email already if populated by Classroom schema

        let submitted = 0;
        let checked = 0;

        const studentSubmissions = students.map((student) => {
            const submission = assignment.submissions.find(
                // Ensure comparison is consistent (student.studentId will be ObjectId from Classroom students array)
                (sub) => sub.studentId && student.studentId && sub.studentId.toString() === student.studentId.toString()
            );

            // Initialize topMatches and allMatches as empty arrays to avoid undefined issues
            let topMatchesWithDetails = [];
            let allMatchesWithDetails = [];

            // If a submission exists and has extracted text
            if (submission && submission.extractedText) {
                submitted++;
                const isChecked = submission.plagiarismPercent !== null && submission.plagiarismPercent !== undefined;
                if (isChecked) checked++;

                // Process topMatches: access populated name/email
                topMatchesWithDetails = (submission.topMatches || []).map(match => ({
                    matchedStudentId: match.matchedStudentId ? match.matchedStudentId._id : null, // Get _id from populated object
                    matchedText: match.matchedText,
                    plagiarismPercent: match.plagiarismPercent,
                    name: match.matchedStudentId ? match.matchedStudentId.name : 'Unknown Match', // Use populated name
                    email: match.matchedStudentId ? match.matchedStudentId.email : 'N/A',     // Use populated email
                }));

                // Process allMatches: access populated name/email
                allMatchesWithDetails = (submission.allMatches || []).map(match => ({
                    matchedStudentId: match.matchedStudentId ? match.matchedStudentId._id : null, // Get _id from populated object
                    plagiarismPercent: match.plagiarismPercent,
                    name: match.matchedStudentId ? match.matchedStudentId.name : 'Unknown Match', // Use populated name
                    email: match.matchedStudentId ? match.matchedStudentId.email : 'N/A',     // Use populated email
                }));


                return {
                    studentId: submission.studentId,
                    name: student.name, // Use name from Classroom's student list
                    email: student.email, // Use email from Classroom's student list
                    status: "Submitted",
                    submittedDate: submission.submittedAt,
                    fileName: submission.fileName || "Uploaded",
                    plagiarismPercent: submission.plagiarismPercent ?? "Not checked",
                    wordCount: submission.wordCount,
                    extractedText: submission.extractedText,
                    isChecked,
                    topMatches: topMatchesWithDetails, // Use the processed data
                    allMatches: allMatchesWithDetails, // Use the processed data
                };
            } else {
                // If no submission or if the submission is incomplete/invalid
                return {
                    studentId: student.studentId,
                    name: student.name,
                    email: student.email,
                    status: "Pending",
                    submittedDate: null,
                    fileName: "No submission",
                    plagiarismPercent: "—",
                    wordCount: submission ? submission.wordCount : null, // Ensure wordCount is passed even if not submitted, if needed. Otherwise, set null or 0.
                    extractedText: null,
                    isChecked: false,
                    topMatches: [],
                    allMatches: []
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
            canSubmitLate: assignment.canSubmitLate, 
            questionFile: !!assignment.questionFile, 
        });
    } catch (error) {
        console.error("Error fetching assignment view:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Check Plagiarism
router.post("/check-plagiarism/:assignmentId", authenticate, requireTeacher, async (req, res) => {
    const { assignmentId } = req.params;

    try {
        const assignment = await Assignment.findById(assignmentId);

        if (!assignment) {
            return res.status(404).json({ error: "Assignment not found" });
        }

        // Filter for submissions that are submitted, have extracted text, and a MinHash signature
        const allSubmissions = assignment.submissions.filter(
            (sub) => sub.submitted && sub.extractedText && sub.minHashSignature && sub.minHashSignature.length > 0
        );

        if (allSubmissions.length < 2) {
            return res.status(400).json({ error: "Not enough valid submissions with generated signatures to check plagiarism." });
        }

        // Prepare data for LSH: only need the _id and signature, plus student info for processing
        const signaturesWithIds = allSubmissions.map(sub => ({
            submissionId: sub._id.toString(), // Convert ObjectId to string for map keys and LSH
            studentId: sub.studentId.toString(), // Also include studentId for direct mapping
            signature: sub.minHashSignature,
            extractedText: sub.extractedText, // Keep extractedText here for direct access
            name: sub.name,
            email: sub.email,
        }));

        // Find candidate pairs using LSH
        const candidatePairs = findCandidatePairs(signaturesWithIds);

        // Create a map for quick lookup of submission data by its submission._id string
        const submissionDataMap = new Map(signaturesWithIds.map(sub => [sub.submissionId, sub]));

        // Map to store plagiarism results for each student (by studentId string)
        const plagiarismResults = new Map();

        // Perform precise similarity check ONLY on candidate pairs
        for (const [id1, id2] of candidatePairs) {
            const subData1 = submissionDataMap.get(id1);
            const subData2 = submissionDataMap.get(id2);

            if (!subData1 || !subData2) {
                console.warn(`Missing submission data for candidate pair IDs: ${id1}, ${id2}`);
                continue; // Skip if data is unexpectedly missing
            }

            // Calculate similarity (returns a decimal between 0 and 1)
            const similarity = calculateJaccardSimilarity(subData1.extractedText, subData2.extractedText);

            // Helper to update results for a student
            // This function now stores `matchedStudentId` and `plagiarismPercent` for `allMatches`
            const updateStudentResults = (currentStudentId, otherStudentId, simValue) => {
                if (!plagiarismResults.has(currentStudentId)) {
                    plagiarismResults.set(currentStudentId, {
                        topMatches: [], // Will be populated and sorted later
                        allMatches: [], // Stores only matchedStudentId and plagiarismPercent for consistency with schema
                        maxSimilarity: 0 // Keep as 0-1 decimal for internal max tracking
                    });
                }
                const studentRes = plagiarismResults.get(currentStudentId);
                studentRes.allMatches.push({
                    matchedStudentId: otherStudentId, // Directly available student ID
                    plagiarismPercent: parseFloat((simValue * 100).toFixed(2)),
                });
                studentRes.maxSimilarity = Math.max(studentRes.maxSimilarity, simValue);
            };

            // Update plagiarism info for subData1's student
            updateStudentResults(
                subData1.studentId, // Current student ID
                subData2.studentId, // Matched student ID
                similarity
            );

            // Update plagiarism info for subData2's student (symmetric comparison)
            updateStudentResults(
                subData2.studentId, // Current student ID
                subData1.studentId, // Matched student ID
                similarity
            );
        }

        //  Update each submission in the database based on calculated results ---
        for (const submission of assignment.submissions) {
            const studentIdString = submission.studentId.toString();
            const studentResult = plagiarismResults.get(studentIdString);

            if (studentResult) {
                // Sort allMatches by plagiarism percentage descending
                // Note: allMatches now contains the 0-100 percentage
                studentResult.allMatches.sort((a, b) => b.plagiarismPercent - a.plagiarismPercent);

                // Slice for top 3 matches and correctly map to the schema format
                // Here, we retrieve the matchedText and name from the 'signaturesWithIds' map
                // that contains all necessary original data for the topMatches.
                const topMatchesFormatted = studentResult.allMatches.slice(0, 3).map((match) => {
                    // Find the original data for the matched student from our pre-processed list
                    const matchedStudentOriginalData = signaturesWithIds.find(s => s.studentId === match.matchedStudentId);

                    return {
                        matchedStudentId: match.matchedStudentId,
                        matchedText: matchedStudentOriginalData ? matchedStudentOriginalData.extractedText : '', // Use stored extractedText
                        plagiarismPercent: match.plagiarismPercent
                    };
                });

                // The main plagiarismPercent should also be 0-100
                submission.plagiarismPercent = parseFloat((studentResult.maxSimilarity * 100).toFixed(2));
                submission.topMatches = topMatchesFormatted;
                // The `allMatches` array here already matches the schema (only matchedStudentId and plagiarismPercent)
                // No need to re-map it, just assign directly.
                submission.allMatches = studentResult.allMatches;
                // wordCount is not re-calculated here as it's set during submission
            } else {
                // If a submission was not part of any candidate pair (e.g., very unique, or fewer than 2 total)
                submission.plagiarismPercent = 0;
                submission.topMatches = [];
                submission.allMatches = [];
            }
        }

        await assignment.save();

        return res.status(200).json({
            message: "Plagiarism check completed using LSH for efficiency.",
            totalSubmissions: allSubmissions.length,
            candidatesChecked: candidatePairs.length, // Number of pairs LSH identified
            checkedAt: new Date(),
        });
    } catch (err) {
        console.error("Error during plagiarism check:", err);
        return res.status(500).json({ error: "Internal server error during plagiarism check." });
    }
});

// View Report Route
// View Report Route (WITH DEBUG CONSOLE.LOGS)
router.get("/view-report/:assignmentId/:studentId", authenticate, requireTeacher, async (req, res) => {
    const { assignmentId, studentId } = req.params;

    console.log("\n--- START VIEW REPORT DEBUG ---");
    console.log(`[${new Date().toISOString()}] Fetching report for studentId: ${studentId}, assignmentId: ${assignmentId}`);

    try {
        // Find the assignment
        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
            console.log(`[${new Date().toISOString()}] ERROR: Assignment with ID ${assignmentId} not found.`);
            return res.status(404).json({ error: "Assignment not found" });
        }
        console.log(`[${new Date().toISOString()}] Found assignment: ${assignment.title}`);

        const submission = assignment.submissions.find((sub) => sub.studentId.toString() === studentId.toString());
        if (!submission || !submission.submitted) {
            console.log(`[${new Date().toISOString()}] ERROR: Submission for student ${studentId} not found or not submitted in assignment ${assignmentId}.`);
            return res.status(404).json({ error: "Submission not found or not submitted" });
        }
        console.log(`[${new Date().toISOString()}] Found submission by student: ${submission.name} (ID: ${submission.studentId.toString()})`);
        console.log(`[${new Date().toISOString()}] Submission's document name: ${submission.fileName}`);

        // Fetch latest details for the main student
        const mainStudentUser = await User.findById(studentId).select('name email').lean();
        const mainStudentName = mainStudentUser ? mainStudentUser.name : submission.name || 'Unknown (Main)';
        const mainStudentEmail = mainStudentUser ? mainStudentUser.email : submission.email || 'N/A (Main)';
        console.log(`[${new Date().toISOString()}] Main student details: Name='${mainStudentName}', Email='${mainStudentEmail}'`);

        // Aggregate all unique matched student IDs to avoid N+1 queries
        const uniqueMatchedStudentIds = new Set();

        // Add IDs from topMatches
        (submission.topMatches || []).forEach(match => {
            if (match.matchedStudentId) {
                uniqueMatchedStudentIds.add(match.matchedStudentId.toString());
            }
        });

        // Add IDs from allMatches
        (submission.allMatches || []).forEach(match => {
            if (match.matchedStudentId) {
                uniqueMatchedStudentIds.add(match.matchedStudentId.toString());
            }
        });
        console.log(`[${new Date().toISOString()}] Unique Matched Student IDs collected for query:`, Array.from(uniqueMatchedStudentIds));


        // Fetch all unique matched users in a single database query
        let matchedUsersMap = new Map();
        if (uniqueMatchedStudentIds.size > 0) {
            console.log(`[${new Date().toISOString()}] Querying User collection for IDs:`, Array.from(uniqueMatchedStudentIds));
            const users = await User.find({ _id: { $in: Array.from(uniqueMatchedStudentIds) } }).select('name email').lean();
            console.log(`[${new Date().toISOString()}] RESULT: Users found from DB query:`, users); // <-- **THIS IS A CRITICAL LOG**
            users.forEach(user => {
                matchedUsersMap.set(user._id.toString(), { name: user.name, email: user.email });
            });
            console.log(`[${new Date().toISOString()}] Matched Users Map after population:`, Object.fromEntries(matchedUsersMap));
        } else {
            console.log(`[${new Date().toISOString()}] No unique matched student IDs to query for user details.`);
        }

        // Populate topMatches with name and email
        const topMatchesWithDetails = (submission.topMatches || []).map(match => {
            const userDetails = matchedUsersMap.get(match.matchedStudentId.toString());
            const populatedMatch = {
                matchedStudentId: match.matchedStudentId,
                matchedText: match.matchedText,
                plagiarismPercent: match.plagiarismPercent,
                name: userDetails ? userDetails.name : 'Unknown Match (DB Missing)', // More specific fallback
                email: userDetails ? userDetails.email : 'N/A (DB Missing)',       // More specific fallback
            };
            // console.log(`[${new Date().toISOString()}] Populated top match:`, populatedMatch); // Uncomment if you need to see every single match
            return populatedMatch;
        });

        // Populate allMatches with name and email
        const allMatchesWithNames = (submission.allMatches || []).map(match => {
            const userDetails = matchedUsersMap.get(match.matchedStudentId.toString());
            const populatedAllMatch = {
                matchedStudentId: match.matchedStudentId,
                plagiarismPercent: match.plagiarismPercent,
                name: userDetails ? userDetails.name : 'Unknown Match (DB Missing)', // More specific fallback
                email: userDetails ? userDetails.email : 'N/A (DB Missing)',       // More specific fallback
            };
            // console.log(`[${new Date().toISOString()}] Populated all match:`, populatedAllMatch); // Uncomment if you need to see every single match
            return populatedAllMatch;
        });

        console.log(`[${new Date().toISOString()}] Prepared Top Matches (first 2):`, topMatchesWithDetails.slice(0, Math.min(2, topMatchesWithDetails.length)));
        console.log(`[${new Date().toISOString()}] Prepared All Matches (first 2):`, allMatchesWithNames.slice(0, Math.min(2, allMatchesWithNames.length)));

        // Respond with the compiled data
        res.json({
            studentUserId: studentId,
            name: mainStudentName,
            email: mainStudentEmail,
            wordCount: submission.wordCount,
            plagiarismScore: submission.plagiarismPercent ?? 0,
            topMatches: topMatchesWithDetails,
            allMatches: allMatchesWithNames,
            extractedText: submission.extractedText,
            submissionDate: submission.submittedAt,
            documentName: submission.fileName,
            reportGenerated: true,
        });

    } catch (err) {
        console.error(`[${new Date().toISOString()}] FATAL ERROR during plagiarism report fetch:`, err);
        res.status(500).json({ error: "Server error" });
    } finally {
        console.log(`[${new Date().toISOString()}] --- END VIEW REPORT DEBUG ---`);
    }
});

// Delete Assignment Route
router.delete("/delete/:assignmentId", authenticate, requireTeacher, async (req, res) => {
    const { assignmentId } = req.params;

    try {
        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
            return res.status(404).json({ error: "Assignment not found" });
        }

        const classroomId = assignment.classroomId;
        const type = assignment.type;

        await Assignment.findByIdAndDelete(assignmentId);

        // Update the classroom
        const classroom = await Classroom.findById(classroomId);
        if (!classroom) {
            return res.status(404).json({ error: "Classroom not found" });
        }

        if (type === "Assignment") {
            classroom.assignments = classroom.assignments.filter(
                (id) => id.toString() !== assignmentId
            );
            classroom.numAssignments = Math.max(0, classroom.numAssignments - 1);
        } else if (type === "Exam") {
            classroom.exams = classroom.exams.filter(
                (id) => id.toString() !== assignmentId
            );
            classroom.numExams = Math.max(0, classroom.numExams - 1);
        }

        await classroom.save();

        res.status(200).json({ message: `${type} deleted successfully.` });
    } catch (error) {
        console.error("Error deleting assignment:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


// View Extracted Text Route
router.get("/view-extracted-text/:assignmentId/:studentId", authenticate, requireTeacher, async (req, res) => {
    const { assignmentId, studentId } = req.params;

    try {
        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
            return res.status(404).json({ error: "Assignment not found" });
        }

        const submission = assignment.submissions.find((sub) => sub.studentId.toString() === studentId.toString());
        if (!submission || !submission.submitted) {
            return res.status(404).json({ error: "Submission not found or not submitted" });
        }
        
        if (!submission.extractedText) {
            return res.status(404).json({ error: "No extracted text available for this submission." });
        }
        // You can fetch student name and email if needed for the view, similar to view-report
        const studentUser = await User.findById(studentId).select('name email').lean();
        const studentName = studentUser ? studentUser.name : submission.name || 'Unknown Student';
        const studentEmail = studentUser ? studentUser.email : submission.email || 'Unknown Email';

        res.json({
            assignmentTitle: assignment.title,
            studentName: studentName,
            studentEmail: studentEmail,
            fileName: submission.fileName,
            extractedText: submission.extractedText,
            submittedAt: submission.submittedAt
        });

    } catch (err) {
        console.error("Error fetching extracted text:", err);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;