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
const Summarizer = require("node-summarizer");  // Import the node-summarizer package
const stringSimilarity = require("string-similarity"); // Add string similarity library
require("dotenv").config();

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

// Middleware to enforce global 90-request limit
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

// Function to perform online search using SerpAPI
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

// Function to summarize text using node-summarizer
const summarizeText = (text) => {
  const summarizer = new Summarizer();
  const summary = summarizer.getSummary(text);
  return summary;
};

// Function to calculate the similarity percentage between two strings
const calculateSimilarity = (text1, text2) => {
  return stringSimilarity.compareTwoStrings(text1, text2) * 100;
};

// Upload & Online Check API
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

      // Summarize the extracted text before checking for plagiarism
      const summarizedText = summarizeText(extractedText);

      // Search online for plagiarism (summarized text)
      const searchResults = await searchOnlineForPlagiarism(summarizedText);

      // Calculate similarity for each match
      const matchesWithSimilarity = searchResults.map((match) => {
        const similarity = calculateSimilarity(summarizedText, match.snippet);
        return { ...match, similarity };
      });

      // Sort matches by similarity, from highest to lowest
      matchesWithSimilarity.sort((a, b) => b.similarity - a.similarity);

      // Update API usage count
      req.apiUsage.count += 1;
      await req.apiUsage.save();

      // Save extracted text and matches in the database
      const newCheck = new OCRonlinecheck({
        teacherId,
        fileName: file.originalname,
        extractedText,
        matches: matchesWithSimilarity,
        checkedAt: new Date(),
      });
      await newCheck.save();

      // Generate PDF Report
      const doc = new PDFDocument({ margin: 50 });
      let pdfBuffers = [];
      doc.on("data", pdfBuffers.push.bind(pdfBuffers));
      doc.on("end", async () => {
        const pdfBuffer = Buffer.concat(pdfBuffers);

        // Save PDF Report in OCresult collection
        const newReport = new OCresult({
          teacherId,
          results: matchesWithSimilarity,
          reportFile: pdfBuffer,
          createdAt: new Date(),
        });
        await newReport.save();

        res.json({ message: "Online plagiarism check completed. Report saved." });
      });

      // Report Header
      doc.fontSize(18).text("Online Plagiarism Report", { align: "center", underline: true }).moveDown();
      doc.fontSize(14).text(`Generated on: ${new Date().toLocaleString()}`, { align: "left" }).moveDown();
      doc.fontSize(16).text(`File: ${file.originalname}`, { bold: true, align: "left" }).moveDown();

      // Extracted Text Section
      doc.fontSize(14).text("Extracted Text:", { underline: true }).moveDown();
      doc.fillColor("black").fontSize(12).text(extractedText, { align: "left" }).moveDown();

      // Online Matches Section
      doc.fillColor("black").fontSize(14).text("Online Matches:", { align: "left", underline: true }).moveDown();
      matchesWithSimilarity.forEach((match) => {
        doc.fillColor("red").fontSize(12).text(`${match.title} - ${match.link}`, { align: "left" }).moveDown();
        doc.fillColor("black").fontSize(12).text(`Snippet: ${match.snippet}`, { align: "left" }).moveDown();
        doc.fillColor("blue").fontSize(12).text(`Similarity: ${match.similarity.toFixed(2)}%`, { align: "left" }).moveDown();
      });

      doc.end();
    } catch (error) {
      console.error(`Error processing ${file.originalname}:`, error);
      return res.status(500).json({ error: `Error processing ${file.originalname}` });
    } finally {
      await fs.unlink(filePath);
    }
  } catch (error) {
    console.error("Online Plagiarism Check Error:", error);
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

module.exports = router;
