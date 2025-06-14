const express = require("express");
const { nanoid } = require("nanoid");
const Classroom = require("../models/Classroom");
const User = require("../models/User");
const Assignment = require("../models/Assignment");
const { authenticate, requireTeacher, requireStudent } = require("../middleware/auth");

const router = express.Router();

// Create classroom
router.post("/create-classroom", authenticate, requireTeacher, async (req, res) => {
    try {
        const { name, description } = req.body;
        const teacherId = req.userId; 

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
        const teacherId = req.userId; 

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

        // Find student
        const student = await User.findOne({ email: studentEmail, role: "student" });
        if (!student) {
            return res.status(404).json({ error: "Student not found" });
        }

        // Find classroom
        const classroom = await Classroom.findById(classroomId);
        if (!classroom) {
            return res.status(404).json({ error: "Classroom not found" });
        }

        // Check if student already exists in classroom
        const alreadyAdded = classroom.students.some(
            (s) => s.studentId.toString() === student._id.toString()
        );
        if (alreadyAdded) {
            return res.status(400).json({ error: "Student is already in this classroom" });
        }

        // Add student to classroom
        classroom.students.push({
            studentId: student._id,
            name: student.name,
            email: student.email,
        });
        classroom.numStudents += 1;
        await classroom.save();

        // Add student to all assignments and exams in this classroom
        const allAssignmentIds = [...classroom.assignments, ...classroom.exams];

        await Assignment.updateMany(
            { _id: { $in: allAssignmentIds } },
            {
                $push: {
                    submissions: {
                        studentId: student._id,
                        name: student.name,
                        email: student.email,
                        submitted: false,
                        plagiarismPercent: 0,
                        wordCount: 0
                    }
                }
            }
        );
        res.status(200).json({
            message: "Student added successfully and assigned to all assignments/exams.",
            student: { name: student.name, email: student.email },
        });
    } catch (error) {
        console.error("Error adding student:", error);
        res.status(500).json({ error: "Server error" });
    }
});


// View course
router.get("/view-course/:id", authenticate, requireTeacher, async (req, res) => {
    try {
        const classroomId = req.params.id;

        const classroom = await Classroom.findById(classroomId)
            .populate("assignments")
            .populate("exams");

        if (!classroom) {
            return res.status(404).json({ error: "Classroom not found" });
        }

        const allTasks = [];
        const extractTaskInfo = (task) => {
            const submittedCount = task.submissions?.filter((s) => s.submitted).length || 0;
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
            blockedStudents: classroom.blockedUsers.map((u) => ({
                userId: u.userId,
                email: u.email,
            })),
            tasks: allTasks,
        });
    } catch (error) {
        console.error("Error viewing course:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// GET /students/:classroomId - Get enrolled and blocked students of a classroom
router.get("/students/:classroomId", authenticate, requireTeacher, async (req, res) => {
    const { classroomId } = req.params;

    try {
        const classroom = await Classroom.findById(classroomId).lean();
        if (!classroom) {
            return res.status(404).json({ error: "Classroom not found" });
        }
        const students = classroom.students.map((s) => ({
            studentId: s.studentId,
            name: s.name,
            email: s.email,
        }));
        const blockedStudents = classroom.blockedUsers.map((b) => ({
            userId: b.userId,
            email: b.email,
        }));
        res.status(200).json({
            students,
            blockedStudents,
        });
    } catch (error) {
        console.error("Error fetching students:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// BLOCK student
router.post("/block-student", authenticate, requireTeacher, async (req, res) => {
    const { classroomId, studentId } = req.body;

    try {
        const classroom = await Classroom.findById(classroomId);
        if (!classroom) return res.status(404).json({ error: "Classroom not found" });

        const studentIndex = classroom.students.findIndex(
            (s) => s.studentId.toString() === studentId
        );

        if (studentIndex === -1) return res.status(404).json({ error: "Student not found in classroom" });

        const student = classroom.students[studentIndex];

        // Move to blockedUsers
        classroom.blockedUsers.push({
            userId: student.studentId,
            email: student.email,
        });

        // Remove from students[]
        classroom.students.splice(studentIndex, 1);
        classroom.numStudents -= 1;

        await classroom.save();

        res.status(200).json({ message: "Student blocked successfully" });
    } catch (error) {
        console.error("Error blocking student:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// UNBLOCK student
router.post("/unblock-student", authenticate, requireTeacher, async (req, res) => {
    const { classroomId, studentId } = req.body;

    try {
        const classroom = await Classroom.findById(classroomId);
        if (!classroom) return res.status(404).json({ error: "Classroom not found" });

        const blockedIndex = classroom.blockedUsers.findIndex(
            (u) => u.userId.toString() === studentId
        );

        if (blockedIndex === -1) return res.status(404).json({ error: "Student not found in blocked list" });

        const user = await User.findById(studentId);
        if (!user) return res.status(404).json({ error: "User not found" });

        // Add back to students[]
        classroom.students.push({
            studentId: user._id,
            name: user.name,
            email: user.email,
        });

        // Remove from blockedUsers
        classroom.blockedUsers.splice(blockedIndex, 1);
        classroom.numStudents += 1;

        await classroom.save();

        res.status(200).json({ message: "Student unblocked successfully" });
    } catch (error) {
        console.error("Error unblocking student:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// REMOVE student
router.post("/remove-student", authenticate, requireTeacher, async (req, res) => {
    const { classroomId, studentId } = req.body;

    try {
        const classroom = await Classroom.findById(classroomId);
        if (!classroom) return res.status(404).json({ error: "Classroom not found" });

        const initialLength = classroom.students.length;
        classroom.students = classroom.students.filter(
            (s) => s.studentId.toString() !== studentId
        );

        if (classroom.students.length === initialLength) {
            return res.status(404).json({ error: "Student not found in classroom" });
        }

        classroom.numStudents -= 1;
        await classroom.save();

        res.status(200).json({ message: "Student removed from classroom" });
    } catch (error) {
        console.error("Error removing student:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// DELETE /delete-classroom/:id
router.delete("/delete-classroom/:id", authenticate, requireTeacher, async (req, res) => {
    const classroomId = req.params.id;

    try {
        const classroom = await Classroom.findById(classroomId);

        if (!classroom) {
            return res.status(404).json({ error: "Classroom not found" });
        }

        // Ensure the requesting teacher owns the classroom
        if (classroom.teacherId.toString() !== req.userId) { 
            return res.status(403).json({ error: "Unauthorized: You do not own this classroom" });
        }

        // Delete all associated assignments and exams
        const allTaskIds = [...(classroom.assignments || []), ...(classroom.exams || [])];

        await Assignment.deleteMany({ _id: { $in: allTaskIds } });

        // Delete the classroom
        await Classroom.findByIdAndDelete(classroomId);

        res.status(200).json({ message: "Classroom and associated tasks deleted successfully" });
    } catch (error) {
        console.error("Error deleting classroom:", error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;