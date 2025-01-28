const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  role: { type: String, required: true },
  organization: { type: String, required: true },
  googleId: { type: String }, // For Google OAuth
  accessToken: { type: String }, // Google Classroom token
});

module.exports = mongoose.model("User", UserSchema);
