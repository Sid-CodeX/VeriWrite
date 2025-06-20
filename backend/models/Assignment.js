const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: String,
    email: String,
    submitted: { type: Boolean, default: false },
    submittedAt: { type: Date },
    fileName: String,
    fileSize: { type: Number },
    extractedText: String,
    plagiarismPercent: { type: Number }, 
    wordCount: Number,
    teacherRemark: { type: String, default: "No remarks" }, 
    minHashSignature: { type: [Number], default: [] },
    late: { type: Boolean, default: false }, 

    topMatches: [{
        matchedStudentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        matchedText: String,
        plagiarismPercent: Number
    }],

    allMatches: [{
        matchedStudentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        plagiarismPercent: Number
    }],
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
    canSubmitLate: { type: Boolean, default: true }, 
    submissionGuidelines: { type: [String], default: [] }, 

    submissions: [submissionSchema],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Assignment || mongoose.model('Assignment', assignmentSchema);