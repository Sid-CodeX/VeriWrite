const mongoose = require("mongoose");

/**
 * User Schema
 * Stores user info for authentication and role-based access (teacher/student)
 */
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true }, 
    email: { type: String, required: true, unique: true, lowercase: true }, 
    password: { type: String, required: true }, 
    role: { type: String, enum: ["teacher", "student"], required: true } 
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
