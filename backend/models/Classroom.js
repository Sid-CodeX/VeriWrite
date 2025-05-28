const mongoose = require("mongoose");

const classroomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  students: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: String,
    email: String
  }],

  assignments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Assignment" }],
  exams: [{ type: mongoose.Schema.Types.ObjectId, ref: "Assignment" }],

  numStudents: { type: Number, default: 0 },
  numAssignments: { type: Number, default: 0 },
  numExams: { type: Number, default: 0 },

  inviteLink: { type: String, unique: true },

  blockedUsers: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    email: String
  }],

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Classroom", classroomSchema);
