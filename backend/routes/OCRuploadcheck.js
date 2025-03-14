const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const { extractTextFromImage } = require("../utils/ocr");
const router = express.Router();

// Multer Storage Setup
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

// API to Upload and Process OCR Files (Stores Permanently)
router.post("/ocr-upload", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

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

        // Save to OCR Document Storage
        const ocrDoc = new OCRDocument({
            filename: req.file.filename,
            text: extractedText,
        });
        await ocrDoc.save();

        res.status(200).json({ message: "File stored successfully", extractedText });

    } catch (error) {
        console.error("OCR Upload Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
