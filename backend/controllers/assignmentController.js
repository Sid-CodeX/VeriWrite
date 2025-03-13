const Assignment = require("../models/Assignment");

// Create Assignment/Exam
exports.createAssignment = async (req, res) => {
  try {
    const { course_id, type, title, description, deadline } = req.body;
    const file_url = req.file ? `/uploads/${req.file.filename}` : null;

    const newAssignment = new Assignment({
      course_id,
      teacher_id: req.user.id,
      type,
      title,
      description,
      deadline,
      file_url
    });

    await newAssignment.save();
    res.status(201).json(newAssignment);
  } catch (err) {
    res.status(500).json({ error: "Failed to create assignment" });
  }
};
