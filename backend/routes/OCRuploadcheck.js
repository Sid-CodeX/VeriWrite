const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs/promises");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const jwt = require("jsonwebtoken");
const { extractTextFromImage } = require("../utils/ocr");
const UCresult = require("../models/UCresult");
const OCRuploadcheck = require("../models/OCRuploadcheck");
const PDFDocument = require("pdfkit");

const router = express.Router();
const upload = multer({ dest: "temp/" });

// Middleware for authentication
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

// Function to calculate similarity percentage
const calculateSimilarity = (text1, text2) => {
  const words1 = new Set(text1.toLowerCase().match(/\b\w+\b/g) || []);
  const words2 = new Set(text2.toLowerCase().match(/\b\w+\b/g) || []);
  
  const commonWords = [...words1].filter(word => words2.has(word));
  return (commonWords.length / Math.max(words1.size, words2.size)) * 100;
};

// Function to highlight matched words (Full Word Matching)
const highlightMatches = (text, reference) => {
  const words = text.split(/\b/); // Split by word boundaries
  const refWords = new Set(reference.toLowerCase().match(/\b\w+\b/g) || []);
  
  return words.map(word => refWords.has(word.toLowerCase()) ? `**${word}**` : word).join("");
};

// Upload & Check API
router.post("/upload-and-check", authenticate, upload.array("files", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: "No files uploaded" });

    const teacherId = req.teacherId;

    // Delete previous results before storing new ones
    await OCRuploadcheck.deleteMany({ teacherId });
    await UCresult.deleteMany({ teacherId });

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
          throw new Error(`Unsupported file format: ${file.originalname}`);
        }

        if (!extractedText.trim()) throw new Error(`No text extracted from ${file.originalname}.`);

        const storedText = await OCRuploadcheck.create({
          teacherId,
          fileName: file.originalname,
          extractedText: extractedText.trim().toLowerCase(),
        });

        extractedTexts.push(storedText);
      } catch (error) {
        console.error(`Error processing ${file.originalname}:`, error);
        return res.status(500).json({ error: `Error processing ${file.originalname}` });
      } finally {
        try {
          await fs.unlink(filePath);
        } catch (err) {
          console.error(`Failed to delete temp file: ${filePath}`, err);
        }
      }
    }

    let results = [];
    for (let i = 0; i < extractedTexts.length; i++) {
      for (let j = i + 1; j < extractedTexts.length; j++) {
        const text1 = extractedTexts[i].extractedText;
        const text2 = extractedTexts[j].extractedText;

        let similarity = text1 === text2 ? 100 : calculateSimilarity(text1, text2);
        let highlightedText1 = highlightMatches(text1, text2);
        let highlightedText2 = highlightMatches(text2, text1);

        results.push({
          file1: extractedTexts[i].fileName,
          file2: extractedTexts[j].fileName,
          similarity: `${similarity.toFixed(2)}%`,
          level: similarity >= 80 ? "High" : similarity >= 50 ? "Medium" : "Low",
          text1: highlightedText1,
          text2: highlightedText2
        });
      }
    }

    // Generate PDF Report
    const doc = new PDFDocument({ margin: 50 });
    let pdfBuffers = [];
    doc.on("data", chunk => pdfBuffers.push(chunk));
    doc.on("end", async () => {
      const pdfBuffer = Buffer.concat(pdfBuffers);

      // Store plagiarism results & PDF in DB
      await UCresult.create({ teacherId, results, reportFile: pdfBuffer });

      res.json({ message: "Plagiarism check completed", results });
    });

    // PDF Content
    doc.fontSize(18).text("Plagiarism Report", { align: "center", underline: true }).moveDown();
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`).moveDown();

    results.forEach((result, index) => {
      doc.fontSize(14).fillColor("black").text(`Comparison ${index + 1}`);
      doc.fontSize(12).fillColor("blue").text(`File 1: ${result.file1}`);
      doc.fontSize(12).fillColor("blue").text(`File 2: ${result.file2}`);
      doc.fontSize(12).fillColor("black").text(`Similarity: ${result.similarity} (${result.level})`).moveDown();
      doc.fillColor("red").fontSize(10).text("Matched Content:");
      doc.fillColor("black").font("Courier").text(result.text1, { width: 450 }).moveDown();
      doc.fillColor("black").font("Courier").text(result.text2, { width: 450 }).moveDown();
      doc.moveDown(2);
    });

    doc.end();
  } catch (error) {
    console.error("Plagiarism Check Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Download Report API
router.get("/download-report", authenticate, async (req, res) => {
  try {
    const report = await UCresult.findOne({ teacherId: req.teacherId });
    if (!report) return res.status(400).json({ error: "No report found" });

    res.setHeader("Content-Disposition", 'attachment; filename="plagiarism_report.pdf"');
    res.setHeader("Content-Type", "application/pdf");
    res.send(report.reportFile);
  } catch (error) {
    console.error("PDF Download Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;