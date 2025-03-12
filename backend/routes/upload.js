const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const Document = require("../models/Document");
const { extractTextFromImage } = require("../utils/ocr");
const router = express.Router();

// Multer storage setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = "uploads/";
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage });

// API to upload and process files
router.post("/upload", upload.single("file"), async (req, res) => {
    try {
        const teacherId = req.body.teacherId;  // Get teacher ID from request
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const filePath = req.file.path;
        const fileExt = path.extname(req.file.originalname).toLowerCase();
        let extractedText = "";

        if (fileExt === ".pdf") {
            const dataBuffer = fs.readFileSync(filePath);
            const pdfData = await pdfParse(dataBuffer);
            extractedText = pdfData.text;
        } else if (fileExt === ".docx") {
            const wordData = await mammoth.extractRawText({ path: filePath });
            extractedText = wordData.value;
        } else if ([".png", ".jpg", ".jpeg"].includes(fileExt)) {
            extractedText = await extractTextFromImage(filePath);
        } else {
            return res.status(400).json({ error: "Unsupported file format" });
        }

        // Save to database
        const document = new Document({ teacherId, filename: req.file.filename, text: extractedText });
        await document.save();

        res.status(200).json({ message: "File uploaded successfully", extractedText });

        // Delete file after processing
        fs.unlinkSync(filePath);
    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
