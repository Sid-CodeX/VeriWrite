const mongoose = require("mongoose");

const OCRuploadcheckSchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment" },
  fileName: { type: String, required: true },
  extractedText: { type: String, required: false },
  createdAt: { type: Date, default: Date.now, expires: 7200 }
});

module.exports = mongoose.model("OCRuploadcheck", OCRuploadcheckSchema);
