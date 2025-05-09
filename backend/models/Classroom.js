const mongoose = require("mongoose");

const classroomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },

  students: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
    name: String,
    email: String
  }],

  numStudents: { type: Number, default: 0 },
  numAssignments: { type: Number, default: 0 },
  numExams: { type: Number, default: 0 },

  inviteLink: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Classroom", classroomSchema);
