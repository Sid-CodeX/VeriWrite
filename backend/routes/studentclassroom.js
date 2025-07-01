const express = require("express");
const Classroom = require("../models/Classroom");
const Assignment = require("../models/Assignment");
const User = require("../models/User");
const { authenticate, requireStudent, requireTeacher } = require("../middleware/auth"); 
const router = express.Router();

// GET /student/dashboard
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

// Join Classroom route
router.post("/join", authenticate, requireStudent, async (req, res) => {
    try {
        const studentId = req.userId;
        const { classCode } = req.body;

        // Validate presence of class code
        if (!classCode) {
            return res.status(400).json({ error: "Class code is required" });
        }

        // Find classroom using class code and populate assignments
        const classroom = await Classroom.findOne({ classCode: classCode }).populate("assignments");

        // Handle classroom not found
        if (!classroom) {
            return res.status(404).json({ error: "Classroom not found with the provided code." });
        }

        // Check if student is blocked from the classroom
        if (classroom.blockedUsers.some(u => u.userId.equals(studentId))) {
            return res.status(403).json({ error: "You are blocked from this class." });
        }

        // Prevent duplicate enrollment
        if (classroom.students.some(s => s.studentId.equals(studentId))) {
            return res.status(409).json({ message: "Already enrolled in this class." });
        }

        // Retrieve student details
        const student = await User.findById(studentId);
        if (!student) {
            return res.status(404).json({ error: "Student not found" });
        }

        // Add student to the classroom
        classroom.students.push({
            studentId,
            name: student.name,
            email: student.email
        });
        classroom.numStudents += 1;

        // Create empty submission record for each assignment
        for (const assignment of classroom.assignments) {
            if (!assignment.submissions) {
                assignment.submissions = [];
            }
            assignment.submissions.push({
                studentId,
                name: student.name,
                email: student.email,
                submitted: false
            });
            await assignment.save();
        }

        // Save updated classroom document
        await classroom.save();

        res.status(200).json({ message: `Successfully joined ${classroom.name}!` });
    } catch (error) {
        console.error("Error joining class:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


// View classroom route
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
                const studentSubmissions = item.submissions
                    .filter(s => s.studentId && s.studentId.equals(studentId) && s.submitted)
                    .sort((a, b) => b.submittedAt - a.submittedAt); // Sort by most recent first

                const latestSubmission = studentSubmissions.length > 0 ? studentSubmissions[0] : null;

                const submitted = !!latestSubmission;
                const submittedAt = latestSubmission?.submittedAt || null;

                const deadlineDate = new Date(item.deadline);
                const now = new Date();
                const isOverdue = deadlineDate < now && !submitted;

                return {
                    id: item._id,
                    type: item.type,
                    title: item.title,
                    description: item.description,
                    deadline: item.deadline,
                    submitted: submitted,
                    submittedAt: submittedAt,
                    isOverdue: isOverdue,
                };
            })
            .filter(item => {
                if (filter === "pending") return !item.submitted;
                if (filter === "submitted") return item.submitted;
                return true;
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