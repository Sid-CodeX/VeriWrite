const mongoose = require("mongoose");

const OCRonlinecheckSchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Store ObjectId of the teacher
  fileName: { type: String, required: true },
  extractedText: { type: String, required: false },
  matches: [
    {
      title: { type: String, required: true },
      link: { type: String, required: true },
      snippet: { type: String, required: true }
    }
  ],
  createdAt: { type: Date, default: Date.now, expires: 7200 } // Expires in 2 hours
});

module.exports = mongoose.model("OCRonlinecheck", OCRonlinecheckSchema);
