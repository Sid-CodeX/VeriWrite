const mongoose = require("mongoose");

const OCRuploadcheckSchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment" }, // Link to an assignment (optional)
  extractedText: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: "2h" } // Auto-delete after 2 hours
});

module.exports = mongoose.model("OCRuploadcheck", OCRuploadcheckSchema);
