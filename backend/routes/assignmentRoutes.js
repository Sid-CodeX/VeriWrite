const express = require("express");
const multer = require("multer");
const { createAssignment } = require("../controllers/assignmentController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/create", authMiddleware, upload.single("file"), createAssignment);

module.exports = router;
