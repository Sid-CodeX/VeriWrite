const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs/promises");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const jwt = require("jsonwebtoken");
const { extractTextFromImage } = require("../utils/ocr");
const OCRonlinecheck = require("../models/OCRonlinecheck");
const OCresult = require("../models/OCresult");
const SerpApiUsage = require("../models/SerpApiUsage");
const fetch = require("node-fetch");
const PDFDocument = require("pdfkit");
const stringSimilarity = require("string-similarity");
require("dotenv").config();

const router = express.Router();
const upload = multer({ dest: "temp/" });

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

const checkApiLimit = async (req, res, next) => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  let usage = await SerpApiUsage.findOne({ month: currentMonth, year: currentYear });

  if (!usage) {
    usage = new SerpApiUsage({ month: currentMonth, year: currentYear, count: 0 });
    await usage.save();
  }

  if (usage.count >= 90) {
    return res.status(429).json({ error: "Monthly search limit (90) reached. Try again next month." });
  }

  req.apiUsage = usage;
  next();
};

const searchOnlineForPlagiarism = async (query) => {
  const serpApiKey = process.env.SERPAPI_KEY;
  const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${serpApiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.organic_results
      ? data.organic_results.map(item => ({
          title: item.title,
          link: item.link,
          snippet: item.snippet,
        }))
      : [];
  } catch (error) {
    console.error("Error fetching search results:", error);
    return [];
  }
};

const chunkText = (text, chunkSize = 500) => {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.substring(i, i + chunkSize));
  }
  return chunks;
};

const calculateSimilarity = (text1, text2) => {
  return stringSimilarity.compareTwoStrings(text1, text2) * 100;
};

router.post("/online-check", authenticate, checkApiLimit, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const teacherId = req.teacherId;
    await OCRonlinecheck.deleteMany({ teacherId });
    await OCresult.deleteMany({ teacherId });

    const file = req.file;
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

      if (!extractedText.trim()) throw new Error(`No text extracted from ${file.originalname}.`);

      const textChunks = chunkText(extractedText);
      let matchesWithSimilarity = [];

      for (const chunk of textChunks) {
        const searchResults = await searchOnlineForPlagiarism(chunk);
        searchResults.forEach((match) => {
          const similarity = calculateSimilarity(chunk, match.snippet);
          matchesWithSimilarity.push({ ...match, similarity });
        });
      }

      matchesWithSimilarity.sort((a, b) => b.similarity - a.similarity);

      req.apiUsage.count += 1;
      await req.apiUsage.save();

      const newCheck = new OCRonlinecheck({
        teacherId,
        fileName: file.originalname,
        extractedText,
        matches: matchesWithSimilarity,
        checkedAt: new Date(),
      });
      await newCheck.save();

      const doc = new PDFDocument({ margin: 50 });
      let pdfBuffers = [];
      doc.on("data", pdfBuffers.push.bind(pdfBuffers));
      doc.on("end", async () => {
        const pdfBuffer = Buffer.concat(pdfBuffers);
        const newReport = new OCresult({
          teacherId,
          results: matchesWithSimilarity,
          reportFile: pdfBuffer,
          createdAt: new Date(),
        });
        await newReport.save();
        // Calculate overall similarity score
        const overallScore = matchesWithSimilarity.length > 0
            ? matchesWithSimilarity.reduce((max, match) => Math.max(max, match.similarity), 0)
            : 0;

        // Function to determine similarity level
        const getSimilarityLevel = (similarity) => {
            if (similarity < 50) return "Low";
            if (similarity < 75) return "Moderate";
            return "High";
        };

        // Return top 3 matches in JSON response
        res.json({
            message: "Online plagiarism check completed. Report saved.",
            score: overallScore,
            matches: matchesWithSimilarity.slice(0, 3).map(match => ({
                title: match.title,
                link: match.link,
                similarity: match.similarity,
                level: getSimilarityLevel(match.similarity),
            })),
        });
      });

      doc.fontSize(18).text("Online Plagiarism Report", { align: "center", underline: true }).moveDown();
      doc.fontSize(14).text(`Generated on: ${new Date().toLocaleString()}`, { align: "left" }).moveDown();
      doc.fontSize(16).text(`File: ${file.originalname}`, { bold: true, align: "left" }).moveDown();
      doc.fontSize(14).fillColor("blue").text("Extracted Text:", { underline: true }).moveDown();
      doc.fillColor("black").fontSize(12).text(extractedText, { align: "left" }).moveDown();
      doc.fontSize(14).fillColor("red").text("Online Matches:", { underline: true }).moveDown();

      matchesWithSimilarity.forEach((match, index) => {
        doc.moveDown(1);
        
        // Bold match title
        doc.fontSize(12).fillColor("black").font("Helvetica-Bold").text(match.title, { align: "left" });
        
        // Clickable link
        doc.fontSize(12).fillColor("blue").text(match.link, { align: "left", link: match.link, underline: true });
        
        // Snippet content
        doc.fillColor("black").font("Helvetica").text(`Snippet: ${match.snippet}`, { align: "left" }).moveDown(0.5);
        
        // Similarity score
        doc.fillColor("green").fontSize(12).text(`Similarity: ${match.similarity.toFixed(2)}%`, { align: "left" }).moveDown(1);
        
        // Separator Line
        if (index < matchesWithSimilarity.length - 1) {
          doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();  // Draws a horizontal line
          doc.moveDown(1);
        }
      });

      doc.end();

    } finally {
      await fs.unlink(filePath);
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// API to retrieve the saved PDF report
router.get("/download-report", authenticate, async (req, res) => {
  try {
    const teacherId = req.teacherId;
    const report = await OCresult.findOne({ teacherId }).sort({ createdAt: -1 });

    if (!report) {
      return res.status(404).json({ error: "No report found" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="Online_Check_Report.pdf"');
    res.send(report.reportFile);
  } catch (error) {
    console.error("Error retrieving report:", error);
    res.status(500).json({ error: "Failed to retrieve report" });
  }
});

// ✅ View Report API for OCR Online Check (Opens PDF in Browser)
router.get("/view-report", authenticate, async (req, res) => {
  try {
    const report = await OCresult.findOne({ teacherId: req.teacherId }).sort({ createdAt: -1 });

    if (!report) return res.status(404).json({ error: "No report found" });

    res.setHeader("Content-Disposition", 'inline; filename="Online_Check_Report.pdf"');
    res.setHeader("Content-Type", "application/pdf");
    res.send(report.reportFile);
  } catch (error) {
    console.error("Error viewing report:", error);
    res.status(500).json({ error: "Failed to view report" });
  }
});



module.exports = router;
