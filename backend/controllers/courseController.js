const Course = require("../models/Course");
const { v4: uuidv4 } = require("uuid");

// Fetch courses created by logged-in teacher
exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find({ teacher_id: req.user.id });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Create a new course
exports.createCourse = async (req, res) => {
  try {
    const { name, description } = req.body;
    const newCourse = new Course({
      teacher_id: req.user.id,
      name,
      description,
      joining_link: `https://veriwrite.com/join/${uuidv4()}`
    });

    await newCourse.save();
    res.status(201).json(newCourse);
  } catch (err) {
    res.status(500).json({ error: "Failed to create course" });
  }
};

// Manage students (Add, Remove, Block)
exports.manageStudents = async (req, res) => {
  const { courseId, studentId, action } = req.body;
  try {
    let course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });

    let student = course.students.find(s => s.student_id.toString() === studentId);
    
    if (action === "add") {
      if (!student) course.students.push({ student_id: studentId });
    } else if (action === "remove") {
      course.students = course.students.filter(s => s.student_id.toString() !== studentId);
    } else if (action === "block") {
      if (student) student.status = "blocked";
    }

    await course.save();
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
