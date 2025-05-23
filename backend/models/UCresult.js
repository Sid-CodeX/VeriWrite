const mongoose = require("mongoose");

const ucResultSchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
  results: { type: Array, required: true },
  reportFile: { type: Buffer, required: true }, // Store PDF report as binary
  createdAt: { type: Date, default: Date.now, expires: 7200 }, // Auto-delete after 2 hours (7200 sec)
});

module.exports = mongoose.model("UCresult", ucResultSchema);
