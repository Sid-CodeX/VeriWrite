const mongoose = require("mongoose");

const AssignmentSchema = new mongoose.Schema({
  course_id: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["assignment", "exam"], required: true },
  title: { type: String, required: true },
  description: { type: String },
  deadline: { type: Date, required: true },
  file_url: { type: String }
}, { timestamps: true });

module.exports = mongoose.model("Assignment", AssignmentSchema);
