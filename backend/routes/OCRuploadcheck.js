const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs/promises");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const jwt = require("jsonwebtoken");
const { extractTextFromImage } = require("../utils/ocr");
const OCRuploadcheck = require("../models/OCRuploadcheck");
const PDFDocument = require("pdfkit");
const { jaccardSimilarity, highlightMatches } = require("../utils/similarity");
require("dotenv").config();

const router = express.Router();
const upload = multer({ dest: "temp/" }); // Temporary storage

// ✅ Middleware to verify JWT Token
const authenticateToken = (req, res, next) => {
    const token = req.header("Authorization");
    if (!token) return res.status(401).json({ error: "Unauthorized: No token provided" });

    jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Forbidden: Invalid token" });
        req.user = user;
        next();
    });
};

// ✅ Upload, Extract Text & Store in DB Temporarily
router.post("/upload-and-check", authenticateToken, upload.array("files", 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) return res.status(400).json({ error: "No files uploaded" });

        if (req.user.role !== "teacher") return res.status(401).json({ error: "Unauthorized: Only teachers can upload files." });

        const teacherId = req.user.userId;
        console.log("Teacher ID:", teacherId);

        let extractedTexts = [];
        for (const file of req.files) {
            const filePath = file.path;
            const fileExt = path.extname(file.originalname).toLowerCase();
            let extractedText = "";

            try {
                if (fileExt === ".pdf") {
                    const pdfData = await pdfParse(await fs.readFile(filePath));
                    extractedText = pdfData.text;
                } else if (fileExt === ".docx") {
                    const docData = await mammoth.extractRawText({ path: filePath });
                    extractedText = docData.value;
                } else if ([".png", ".jpg", ".jpeg"].includes(fileExt)) {
                    extractedText = await extractTextFromImage(filePath);
                } else {
                    await fs.unlink(filePath);
                    return res.status(400).json({ error: `Unsupported file format: ${file.originalname}` });
                }
            } catch (error) {
                console.error(`Error processing ${file.originalname}:`, error);
                await fs.unlink(filePath);
                return res.status(500).json({ error: `Error processing ${file.originalname}` });
            }

            await fs.unlink(filePath);

            if (!extractedText.trim()) return res.status(400).json({ error: `No text extracted from ${file.originalname}.` });

            const storedText = await OCRuploadcheck.create({
                teacherId: teacherId,
                fileName: file.originalname,
                extractedText: extractedText.trim().toLowerCase(),
            });
            extractedTexts.push(storedText);
        }

        res.status(200).json({ message: "Plagiarism check complete", results: extractedTexts });
    } catch (error) {
        console.error("Plagiarism Check Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
