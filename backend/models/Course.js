const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Array of student IDs
  assignments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Assignment" }], // Placeholder for assignments
  exams: [{ type: mongoose.Schema.Types.ObjectId, ref: "Exam" }], // Placeholder for exams
  numAssignments: { type: Number, default: 0 }, // Track number of assignments
  numExams: { type: Number, default: 0 }, // Track number of exams
  inviteCode: { type: String, unique: true }, // Unique code for joining
  createdAt: { type: Date, default: Date.now }, // Course creation timestamp
  status: { type: String, enum: ["active", "archived"], default: "active" } // Track if the course is active or archived
});

module.exports = mongoose.model("Course", courseSchema);
