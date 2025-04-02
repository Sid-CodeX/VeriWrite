const mongoose = require("mongoose");

const SerpApiUsageSchema = new mongoose.Schema({
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  count: { type: Number, default: 0 }
});

module.exports = mongoose.model("SerpApiUsage", SerpApiUsageSchema);
