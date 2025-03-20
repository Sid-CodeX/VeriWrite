const mongoose = require("mongoose");

const OCRuploadcheckSchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Store ObjectId of the teacher
  fileName: { type: String, required: true },
  extractedText: { type: String, required: false },
  createdAt: { type: Date, default: Date.now, expires: 7200 } // Expires in 2 hours
});

module.exports = mongoose.model("OCRuploadcheck", OCRuploadcheckSchema);
