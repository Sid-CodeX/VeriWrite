const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema({
  teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  description: { type: String },
  joining_link: { type: String, unique: true },
  students: [
    {
      student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      status: { type: String, enum: ["active", "blocked"], default: "active" }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("Course", CourseSchema);
