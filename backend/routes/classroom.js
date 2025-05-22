const express = require("express");
const jwt = require("jsonwebtoken");
const { nanoid } = require("nanoid");
const Classroom = require("../models/Classroom");

const router = express.Router();

//  Middleware for authentication
const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.teacherId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid Token" });
  }
};

//  POST /create-classroom
router.post("/create-classroom", authenticate, async (req, res) => {
  try {
    const { name, description } = req.body;
    const teacherId = req.teacherId;

    if (!name) return res.status(400).json({ error: "Course name is required" });

    const inviteLink = nanoid(10); // Unique 10-character invite code

    const newClassroom = new Classroom({
      name,
      description,
      teacherId,
      inviteLink,
      students: [],
      numStudents: 0,
      numAssignments: 0,
      numExams: 0,
    });

    await newClassroom.save();

    res.status(201).json({
      message: "Classroom created successfully",
      classroom: {
        id: newClassroom._id,
        name: newClassroom.name,
        description: newClassroom.description,
        inviteLink: newClassroom.inviteLink,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creating classroom" });
  }
});

module.exports = router;
