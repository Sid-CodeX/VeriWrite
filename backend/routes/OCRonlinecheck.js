// Import necessary modules and libraries
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs/promises");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const { extractTextFromImage } = require("../utils/ocr");
const OCRonlinecheck = require("../models/OCRonlinecheck");
const OCresult = require("../models/OCresult");
const SerpApiUsage = require("../models/SerpApiUsage");
const fetch = require("node-fetch");
const PDFDocument = require("pdfkit");
const stringSimilarity = require("string-similarity");
require("dotenv").config();

// Middleware for authentication and role check
const { authenticate, requireTeacher } = require("../middleware/auth");

const router = express.Router();

// Configure Multer to store uploaded files temporarily
const upload = multer({ dest: "temp/" });

// Middleware to check and enforce monthly SerpAPI usage limit (90 searches per month)
 
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

/**
 * Helper function to perform online search using SerpAPI
 * @param {string} query - Text chunk to search online
 * @returns {Array} List of search result snippets
 */
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

/**
 * Helper function to split long text into smaller chunks for better search accuracy
 * @param {string} text - Full extracted text
 * @param {number} chunkSize - Maximum chunk size
 * @returns {Array} Array of text chunks
 */
const chunkText = (text, chunkSize = 500) => {
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.substring(i, i + chunkSize));
    }
    return chunks;
};

/**
 * Calculates similarity percentage between two text strings
 */
const calculateSimilarity = (text1, text2) => {
    return stringSimilarity.compareTwoStrings(text1, text2) * 100;
};

/**
 * POST /online-check
 * Uploads a file, extracts text (via OCR or parsing), performs online search for plagiarism,
 * calculates similarity, generates and stores a detailed PDF report
 */
router.post("/online-check", authenticate, requireTeacher, checkApiLimit, upload.single("file"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const teacherId = req.userId;

        // Clean up previous records for this teacher
        await OCRonlinecheck.deleteMany({ teacherId });
        await OCresult.deleteMany({ teacherId });

        const file = req.file;
        const filePath = file.path;
        const fileExt = path.extname(file.originalname).toLowerCase();
        let extractedText = "";

        try {
            // Extract text based on file type
            if (fileExt === ".pdf") {
                const pdfData = await pdfParse(await fs.readFile(filePath));
                extractedText = pdfData.text;
            } else if (fileExt === ".docx") {
                const docData = await mammoth.extractRawText({ path: filePath });
                extractedText = docData.value;
            } else if ([".png", ".jpg", ".jpeg"].includes(fileExt)) {
                extractedText = await extractTextFromImage(filePath);
            } else {
                await fs.unlink(filePath); // Delete unsupported file
                return res.status(400).json({ error: `Unsupported file format: ${file.originalname}` });
            }

            if (!extractedText.trim()) throw new Error(`No text extracted from ${file.originalname}.`);

            // Chunk text and search each chunk online
            const textChunks = chunkText(extractedText);
            let matchesWithSimilarity = [];

            for (const chunk of textChunks) {
                const searchResults = await searchOnlineForPlagiarism(chunk);
                searchResults.forEach((match) => {
                    const similarity = calculateSimilarity(chunk, match.snippet);
                    matchesWithSimilarity.push({ ...match, similarity });
                });
            }

            // Sort matches by descending similarity
            matchesWithSimilarity.sort((a, b) => b.similarity - a.similarity);

            // Increment API usage counter
            req.apiUsage.count += 1;
            await req.apiUsage.save();

            // Save extracted data and matches in MongoDB
            const newCheck = new OCRonlinecheck({
                teacherId,
                fileName: file.originalname,
                extractedText,
                matches: matchesWithSimilarity,
                checkedAt: new Date(),
            });
            await newCheck.save();

            // Generate PDF report
            const doc = new PDFDocument({ margin: 50 });
            let pdfBuffers = [];
            doc.on("data", pdfBuffers.push.bind(pdfBuffers));
            doc.on("end", async () => {
                const pdfBuffer = Buffer.concat(pdfBuffers);

                // Save PDF report
                const newReport = new OCresult({
                    teacherId,
                    results: matchesWithSimilarity,
                    reportFile: pdfBuffer,
                    createdAt: new Date(),
                });
                await newReport.save();

                // Determine overall plagiarism score
                const overallScore = matchesWithSimilarity.length > 0
                    ? matchesWithSimilarity.reduce((max, match) => Math.max(max, match.similarity), 0)
                    : 0;

                const getSimilarityLevel = (similarity) => {
                    if (similarity < 50) return "Low";
                    if (similarity < 75) return "Moderate";
                    return "High";
                };

                // Respond with summary
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

            // Start writing to the PDF document
            doc.fontSize(18).text("Online Plagiarism Report", { align: "center", underline: true }).moveDown();
            doc.fontSize(14).text(`Generated on: ${new Date().toLocaleString()}`, { align: "left" }).moveDown();
            doc.fontSize(16).text(`File: ${file.originalname}`, { bold: true, align: "left" }).moveDown();
            doc.fontSize(14).fillColor("blue").text("Extracted Text:", { underline: true }).moveDown();
            doc.fillColor("black").fontSize(12).text(extractedText, { align: "left" }).moveDown();
            doc.fontSize(14).fillColor("red").text("Online Matches:", { underline: true }).moveDown();

            // Write each match to the PDF
            matchesWithSimilarity.forEach((match, index) => {
                doc.moveDown(1);
                doc.fontSize(12).fillColor("black").font("Helvetica-Bold").text(match.title, { align: "left" });
                doc.fontSize(12).fillColor("blue").text(match.link, { align: "left", link: match.link, underline: true });
                doc.fillColor("black").font("Helvetica").text(`Snippet: ${match.snippet}`, { align: "left" }).moveDown(0.5);
                doc.fillColor("green").fontSize(12).text(`Similarity: ${match.similarity.toFixed(2)}%`, { align: "left" }).moveDown(1);
                if (index < matchesWithSimilarity.length - 1) {
                    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();  // Draw separator
                    doc.moveDown(1);
                }
            });

            doc.end();
        } finally {
            await fs.unlink(filePath); // Clean up temp file
        }
    } catch (error) {
        console.error("Error in online-check:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

/**
 * GET /download-report
 * Returns the most recent PDF plagiarism report for the logged-in teacher as a downloadable file
 */
router.get("/download-report", authenticate, requireTeacher, async (req, res) => {
    try {
        const teacherId = req.userId;
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

/**
 * GET /view-report
 * Streams the most recent PDF report directly in the browser
 */
router.get("/view-report", authenticate, requireTeacher, async (req, res) => {
    try {
        const report = await OCresult.findOne({ teacherId: req.userId }).sort({ createdAt: -1 });

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
