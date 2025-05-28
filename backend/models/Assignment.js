const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: String,
  email: String,
  submitted: { type: Boolean, default: false },
  submittedAt: { type: Date },
  fileName: String,
  extractedText: String,
  plagiarismPercent: Number,
  wordCount: Number,
  teacherRemark: { type: String, default: "No remarks" },

  topMatches: [{
    matchedStudentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    matchedText: String,
    plagiarismPercent: Number
  }],

  allMatches: [{
    name: String,
    plagiarismPercent: Number
  }]
});

const assignmentSchema = new mongoose.Schema({
  classroomId: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom", required: true },
  type: { type: String, enum: ["Assignment", "Exam"], required: true },
  title: { type: String, required: true },
  description: String,
  deadline: { type: Date, required: true },
  questionFile: {
    data: Buffer,
    contentType: String,
    originalName: String
  },
  
  submissions: [submissionSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Assignment || mongoose.model('Assignment', assignmentSchema);

