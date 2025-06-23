const express = require("express");
const { nanoid } = require("nanoid");
const Classroom = require("../models/Classroom");
const User = require("../models/User");
const Assignment = require("../models/Assignment");
const { authenticate, requireTeacher, requireStudent } = require("../middleware/auth");

const router = express.Router();

/**
 * @route   POST /create-classroom
 * @desc    Create a new classroom (teacher only)
 * @access  Private (Teacher)
 */
router.post("/create-classroom", authenticate, requireTeacher, async (req, res) => {
    try {
        const { name, description } = req.body;
        const teacherId = req.userId;

        if (!name) {
            return res.status(400).json({ error: "Course name is required" });
        }

        const inviteLink = nanoid(10);

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
        console.error("Create Classroom Error:", error);
        res.status(500).json({ error: "Error creating classroom" });
    }
});

/**
 * @route   GET /teacher-classrooms
 * @desc    Get classrooms owned by the authenticated teacher
 * @access  Private (Teacher)
 */
router.get("/teacher-classrooms", authenticate, requireTeacher, async (req, res) => {
    try {
        const teacherId = req.userId;

        const classrooms = await Classroom.find({ teacherId });

        if (!classrooms.length) {
            return res.status(404).json({ message: "No classrooms found" });
        }

        res.status(200).json({
            classrooms: classrooms.map(c => ({
                id: c._id,
                name: c.name,
                description: c.description,
                numStudents: c.numStudents,
                numAssignments: c.numAssignments,
                inviteLink: c.inviteLink,
            })),
        });
    } catch (error) {
        console.error("Fetch Classrooms Error:", error);
        res.status(500).json({ error: "Error fetching classrooms" });
    }
});

/**
 * @route   POST /add-student
 * @desc    Add a student to a classroom and assign to tasks
 * @access  Private (Teacher)
 */
router.post("/add-student", authenticate, requireTeacher, async (req, res) => {
    try {
        const { classroomId, studentEmail } = req.body;

        const student = await User.findOne({ email: studentEmail, role: "student" });
        if (!student) {
            return res.status(404).json({ error: "Student not found" });
        }

        const classroom = await Classroom.findById(classroomId);
        if (!classroom) {
            return res.status(404).json({ error: "Classroom not found" });
        }

        if (classroom.students.some(s => s.studentId.toString() === student._id.toString())) {
            return res.status(400).json({ error: "Student is already in this classroom" });
        }

        classroom.students.push({
            studentId: student._id,
            name: student.name,
            email: student.email,
        });
        classroom.numStudents += 1;
        await classroom.save();

        const allTaskIds = [...(classroom.assignments || []), ...(classroom.exams || [])];

        await Assignment.updateMany(
            { _id: { $in: allTaskIds } },
            {
                $push: {
                    submissions: {
                        studentId: student._id,
                        name: student.name,
                        email: student.email,
                        submitted: false,
                        plagiarismPercent: 0,
                        wordCount: 0,
                    }
                }
            }
        );

        res.status(200).json({
            message: "Student added successfully and assigned to all tasks.",
            student: { name: student.name, email: student.email },
        });
    } catch (error) {
        console.error("Add Student Error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

/**
 * @route   GET /view-course/:id
 * @desc    View detailed info about a specific classroom
 * @access  Private (Teacher)
 */
router.get("/view-course/:id", authenticate, requireTeacher, async (req, res) => {
    try {
        const classroom = await Classroom.findById(req.params.id)
            .populate("assignments")
            .populate("exams");

        if (!classroom) {
            return res.status(404).json({ error: "Classroom not found" });
        }

        const formatTask = (task) => {
            const submittedCount = task.submissions?.filter(s => s.submitted).length || 0;
            return {
                id: task._id,
                type: task.type,
                title: task.title,
                description: task.description,
                deadline: task.deadline,
                submissions: `${submittedCount}/${classroom.numStudents}`,
                hasFile: !!task.questionFile,
                canSubmitLate: task.canSubmitLate,
            };
        };

        const tasks = [
            ...classroom.assignments.map(formatTask),
            ...classroom.exams.map(formatTask),
        ];

        res.status(200).json({
            id: classroom._id,
            name: classroom.name,
            description: classroom.description,
            numStudents: classroom.numStudents,
            numAssignments: classroom.numAssignments,
            numExams: classroom.numExams,
            students: classroom.students.map(s => ({
                studentId: s.studentId,
                name: s.name,
                email: s.email,
            })),
            blockedStudents: classroom.blockedUsers.map(u => ({
                userId: u.userId,
                email: u.email,
            })),
            tasks,
        });
    } catch (error) {
        console.error("View Course Error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

/**
 * @route   GET /students/:classroomId
 * @desc    Get enrolled and blocked students of a classroom
 * @access  Private (Teacher)
 */
router.get("/students/:classroomId", authenticate, requireTeacher, async (req, res) => {
    try {
        const classroom = await Classroom.findById(req.params.classroomId).lean();
        if (!classroom) {
            return res.status(404).json({ error: "Classroom not found" });
        }

        res.status(200).json({
            students: classroom.students.map(s => ({
                studentId: s.studentId,
                name: s.name,
                email: s.email,
            })),
            blockedStudents: classroom.blockedUsers.map(b => ({
                userId: b.userId,
                email: b.email,
            })),
        });
    } catch (error) {
        console.error("Fetch Students Error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

/**
 * @route   POST /block-student
 * @desc    Block a student from a classroom
 * @access  Private (Teacher)
 */
router.post("/block-student", authenticate, requireTeacher, async (req, res) => {
    try {
        const { classroomId, studentId } = req.body;
        const classroom = await Classroom.findById(classroomId);
        if (!classroom) return res.status(404).json({ error: "Classroom not found" });

        const studentIndex = classroom.students.findIndex(s => s.studentId.toString() === studentId);
        if (studentIndex === -1) return res.status(404).json({ error: "Student not found in classroom" });

        const student = classroom.students[studentIndex];

        classroom.blockedUsers.push({
            userId: student.studentId,
            email: student.email,
        });
        classroom.students.splice(studentIndex, 1);
        classroom.numStudents -= 1;

        await classroom.save();
        res.status(200).json({ message: "Student blocked successfully" });
    } catch (error) {
        console.error("Block Student Error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

/**
 * @route   POST /unblock-student
 * @desc    Unblock a student and re-add to classroom
 * @access  Private (Teacher)
 */
router.post("/unblock-student", authenticate, requireTeacher, async (req, res) => {
    try {
        const { classroomId, studentId } = req.body;
        const classroom = await Classroom.findById(classroomId);
        if (!classroom) return res.status(404).json({ error: "Classroom not found" });

        const blockedIndex = classroom.blockedUsers.findIndex(u => u.userId.toString() === studentId);
        if (blockedIndex === -1) return res.status(404).json({ error: "Student not found in blocked list" });

        const user = await User.findById(studentId);
        if (!user) return res.status(404).json({ error: "User not found" });

        classroom.students.push({
            studentId: user._id,
            name: user.name,
            email: user.email,
        });
        classroom.blockedUsers.splice(blockedIndex, 1);
        classroom.numStudents += 1;

        await classroom.save();
        res.status(200).json({ message: "Student unblocked successfully" });
    } catch (error) {
        console.error("Unblock Student Error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

/**
 * @route   POST /remove-student
 * @desc    Remove student from classroom
 * @access  Private (Teacher)
 */
router.post("/remove-student", authenticate, requireTeacher, async (req, res) => {
    try {
        const { classroomId, studentId } = req.body;
        const classroom = await Classroom.findById(classroomId);
        if (!classroom) return res.status(404).json({ error: "Classroom not found" });

        const initialLen = classroom.students.length;
        classroom.students = classroom.students.filter(s => s.studentId.toString() !== studentId);

        if (classroom.students.length === initialLen) {
            return res.status(404).json({ error: "Student not found in classroom" });
        }

        classroom.numStudents -= 1;
        await classroom.save();
        res.status(200).json({ message: "Student removed from classroom" });
    } catch (error) {
        console.error("Remove Student Error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

/**
 * @route   DELETE /delete-classroom/:id
 * @desc    Delete classroom and associated tasks
 * @access  Private (Teacher)
 */
router.delete("/delete-classroom/:id", authenticate, requireTeacher, async (req, res) => {
    try {
        const classroom = await Classroom.findById(req.params.id);
        if (!classroom) {
            return res.status(404).json({ error: "Classroom not found" });
        }

        if (classroom.teacherId.toString() !== req.userId) {
            return res.status(403).json({ error: "Unauthorized: You do not own this classroom" });
        }

        const taskIds = [...(classroom.assignments || []), ...(classroom.exams || [])];

        await Assignment.deleteMany({ _id: { $in: taskIds } });
        await Classroom.findByIdAndDelete(classroom._id);

        res.status(200).json({ message: "Classroom and associated tasks deleted successfully" });
    } catch (error) {
        console.error("Delete Classroom Error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
