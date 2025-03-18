const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs/promises");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const jwt = require("jsonwebtoken");
const { extractTextFromImage } = require("../utils/ocr");
const mongoose = require("mongoose");
const OCRuploadcheck = require("../models/OCRuploadcheck");
const PDFDocument = require("pdfkit");

const router = express.Router();
const upload = multer({ dest: "temp/" }); // Temporary storage

// ✅ Middleware for authentication
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

// ✅ Upload, Extract Text & Store in DB Temporarily
router.post("/upload-and-check", authenticate, upload.array("files", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: "No files uploaded" });

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

      await fs.unlink(filePath); // ✅ Delete file immediately after processing

      if (!extractedText.trim()) return res.status(400).json({ error: `No text extracted from ${file.originalname}.` });

      // ✅ Store extracted text in DB temporarily
      const storedText = await OCRuploadcheck.create({
        teacherId: req.teacherId,
        fileName: file.originalname,
        extractedText: extractedText.trim().toLowerCase(),
      });
      extractedTexts.push(storedText);
    }

    // ✅ Perform Exact Match Plagiarism Check
    let results = [];
    for (let i = 0; i < extractedTexts.length; i++) {
      for (let j = i + 1; j < extractedTexts.length; j++) {
        const text1 = extractedTexts[i].extractedText;
        const text2 = extractedTexts[j].extractedText;
        
        let similarity = (text1 === text2) ? 100 : calculateSimilarity(text1, text2);

        results.push({
          file1: extractedTexts[i].fileName,
          file2: extractedTexts[j].fileName,
          similarity: `${similarity.toFixed(2)}%`,
        });
      }
    }

    res.status(200).json({ message: "Plagiarism check complete", results });
  } catch (error) {
    console.error("Plagiarism Check Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Calculate Similarity Percentage
function calculateSimilarity(text1, text2) {
  const words1 = new Set(text1.split(/\s+/));
  const words2 = new Set(text2.split(/\s+/));
  
  const intersection = new Set([...words1].filter(word => words2.has(word)));
  const union = new Set([...words1, ...words2]);
  
  return (intersection.size / union.size) * 100;
}

// ✅ Generate Plagiarism Report PDF
router.post("/download-report", async (req, res) => {
  try {
    const { results } = req.body;
    if (!Array.isArray(results) || results.length === 0) return res.status(400).json({ error: "No plagiarism results available" });

    const doc = new PDFDocument();
    res.setHeader("Content-Disposition", 'attachment; filename="plagiarism_report.pdf"');
    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);
    doc.fontSize(18).text("Plagiarism Report", { align: "center" }).moveDown();
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`).moveDown();

    results.forEach((result) => {
      doc.text(`File 1: ${result.file1}`);
      doc.text(`File 2: ${result.file2}`);
      doc.text(`Similarity: ${result.similarity}`).moveDown();
    });

    doc.end();
  } catch (error) {
    console.error("PDF Generation Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
