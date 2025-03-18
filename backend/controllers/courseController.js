const Course = require("../models/Course");
const User = require("../models/User");
const { v4: uuidv4 } = require("uuid"); // To generate unique invite codes

// ✅ Create a new course
const createCourse = async (req, res) => {
    try {
        if (req.user.role !== "teacher") {
            return res.status(403).json({ message: "Only teachers can create courses" });
        }

        const { name, description } = req.body;
        const inviteCode = uuidv4(); // Generate unique invite code

        const course = new Course({
            name,
            description,
            teacherId: req.user._id,
            inviteCode
        });

        await course.save();
        res.status(201).json({ message: "Course created successfully", course });
    } catch (error) {
        res.status(500).json({ message: "Error creating course", error });
    }
};

// ✅ Get courses created by a teacher
const getTeacherCourses = async (req, res) => {
    try {
        if (req.user.role !== "teacher") {
            return res.status(403).json({ message: "Access denied" });
        }

        const courses = await Course.find({ teacherId: req.user._id });
        res.status(200).json(courses);
    } catch (error) {
        res.status(500).json({ message: "Error fetching courses", error });
    }
};

// ✅ Get courses student is enrolled in
const getStudentCourses = async (req, res) => {
    try {
        if (req.user.role !== "student") {
            return res.status(403).json({ message: "Access denied" });
        }

        const courses = await Course.find({ students: req.user._id });
        res.status(200).json(courses);
    } catch (error) {
        res.status(500).json({ message: "Error fetching courses", error });
    }
};

// ✅ Join a course using an invite code
const joinCourse = async (req, res) => {
    try {
        if (req.user.role !== "student") {
            return res.status(403).json({ message: "Only students can join courses" });
        }

        const { inviteCode } = req.body;
        const course = await Course.findOne({ inviteCode });

        if (!course) {
            return res.status(404).json({ message: "Invalid invite code" });
        }

        // Check if student is already in the course
        if (course.students.includes(req.user._id)) {
            return res.status(400).json({ message: "You are already enrolled in this course" });
        }

        // Add student to course
        course.students.push(req.user._id);
        await course.save();

        res.status(200).json({ message: "Successfully joined the course", course });
    } catch (error) {
        res.status(500).json({ message: "Error joining course", error });
    }
};

// ✅ Manage students (Add/Remove)
const manageStudents = async (req, res) => {
    try {
        if (req.user.role !== "teacher") {
            return res.status(403).json({ message: "Access denied" });
        }

        const { courseId, action, studentEmail } = req.body;
        const course = await Course.findById(courseId);

        if (!course || course.teacherId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You do not have permission to manage this course" });
        }

        const student = await User.findOne({ email: studentEmail });

        if (!student || student.role !== "student") {
            return res.status(404).json({ message: "Student not found" });
        }

        if (action === "add") {
            if (!course.students.includes(student._id)) {
                course.students.push(student._id);
            }
        } else if (action === "remove") {
            course.students = course.students.filter(id => id.toString() !== student._id.toString());
        } else {
            return res.status(400).json({ message: "Invalid action" });
        }

        await course.save();
        res.status(200).json({ message: "Student list updated", course });
    } catch (error) {
        res.status(500).json({ message: "Error managing students", error });
    }
};

module.exports = { createCourse, getTeacherCourses, getStudentCourses, joinCourse, manageStudents };
