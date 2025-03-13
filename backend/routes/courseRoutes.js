const express = require("express");
const { getCourses, createCourse, manageStudents } = require("../controllers/courseController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, getCourses);
router.post("/create", authMiddleware, createCourse);
router.post("/manage-students", authMiddleware, manageStudents);

module.exports = router;
