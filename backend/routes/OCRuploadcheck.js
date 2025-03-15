const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const { extractTextFromImage } = require("../utils/ocr");
const OCRuploadcheck = require("../models/OCRuploadcheck");

const router = express.Router();

// Multer Storage (Temporary, Files Deleted After Processing)
const upload = multer({ dest: "uploads/" });

// API to Upload and Process OCR Files (No Permanent Storage)
router.post("/ocr-upload", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const { teacherId, assignmentId } = req.body;  
        const filePath = req.file.path;
        const fileExt = path.extname(req.file.originalname).toLowerCase();
        let extractedText = "";

        if (fileExt === ".pdf") {
            const pdfData = await pdfParse(fs.readFileSync(filePath));
            extractedText = pdfData.text;
        } else if (fileExt === ".docx") {
            const wordData = await mammoth.extractRawText({ path: filePath });
            extractedText = wordData.value;
        } else if ([".png", ".jpg", ".jpeg"].includes(fileExt)) {
            extractedText = await extractTextFromImage(filePath);
        } else {
            return res.status(400).json({ error: "Unsupported file format" });
        }

        // Prevent empty text from being saved
        if (!extractedText.trim()) {
            return res.status(400).json({ error: "No text extracted from the document." });
        }

        await OCRuploadcheck.create({ teacherId, assignmentId, extractedText });

        res.status(200).json({ message: "Text extracted successfully", extractedText });

        fs.unlinkSync(filePath); // Delete file after processing
    } catch (error) {
        console.error("OCR Upload Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


module.exports = router;
