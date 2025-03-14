const express = require("express");
const multer = require("multer");
const path = require("path");
const { extractTextFromImage } = require("../utils/ocr");
const Document = require("../models/Document");
const router = express.Router();

// Multer setup (memory storage to avoid saving files)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// API to upload and process files
router.post("/upload", upload.single("file"), async (req, res) => {
    try {
        const teacherId = req.body.teacherId;
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const fileExt = path.extname(req.file.originalname).toLowerCase();
        let extractedText = "";

        if ([".png", ".jpg", ".jpeg"].includes(fileExt)) {
            extractedText = await extractTextFromImage(req.file.buffer);
        } else {
            return res.status(400).json({ error: "Unsupported file format" });
        }

        // Store extracted text temporarily in database
        const document = new Document({ teacherId, text: extractedText });
        await document.save();

        res.status(200).json({ message: "File processed successfully", extractedText });
    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;