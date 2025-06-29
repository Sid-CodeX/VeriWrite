// Import required modules
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs/promises");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const { extractTextFromImage } = require("../utils/ocr");
const UCresult = require("../models/UCresult");
const OCRuploadcheck = require("../models/OCRuploadcheck");
const PDFDocument = require("pdfkit");
const { authenticate, requireTeacher } = require("../middleware/auth");

const router = express.Router();
const upload = multer({ dest: "temp/" }); // Configure Multer to store uploaded files temporarily

/**
 * Calculates the percentage of similar words between two texts
 * @param {string} text1 - First text input
 * @param {string} text2 - Second text input
 * @returns {number} Similarity percentage
 */
const calculateSimilarity = (text1, text2) => {
    const words1 = new Set(text1.toLowerCase().match(/\b\w+\b/g) || []);
    const words2 = new Set(text2.toLowerCase().match(/\b\w+\b/g) || []);
    const commonWords = [...words1].filter(word => words2.has(word));
    return (commonWords.length / Math.max(words1.size, words2.size)) * 100;
};

/**
 * Highlights words from 'text' that are found in 'reference'
 * @param {string} text - The text to process
 * @param {string} reference - Reference text for matching
 * @returns {Array} Annotated word list with highlight boolean
 */
const highlightMatches = (text, reference) => {
    const words = text.split(/\b/);
    const refWords = new Set(reference.toLowerCase().match(/\b\w+\b/g) || []);
    return words.map(word => ({
        text: word,
        highlight: refWords.has(word.toLowerCase())
    }));
};

/**
 * POST /upload-and-check
 * - Accepts multiple files (PDF, DOCX, images)
 * - Extracts text using OCR or parsers
 * - Compares text pairwise to detect similarity
 * - Generates and stores a PDF plagiarism report
 */
router.post("/upload-and-check", authenticate, requireTeacher, upload.array("files", 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0)
            return res.status(400).json({ error: "No files uploaded" });

        const teacherId = req.userId;

        // Clean up any previous data
        await OCRuploadcheck.deleteMany({ teacherId });
        await UCresult.deleteMany({ teacherId });

        let extractedTexts = [];

        // Extract text from all uploaded files
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

                if (!extractedText.trim())
                    throw new Error(`No text extracted from ${file.originalname}`);

                // Save to DB for further comparison
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
                // Delete temp file after processing
                try {
                    await fs.unlink(filePath);
                } catch (err) {
                    console.error(`Failed to delete temp file: ${filePath}`, err);
                }
            }
        }

        let results = [];

        // Compare all pairs of uploaded documents for similarity
        for (let i = 0; i < extractedTexts.length; i++) {
            for (let j = i + 1; j < extractedTexts.length; j++) {
                const text1 = extractedTexts[i].extractedText;
                const text2 = extractedTexts[j].extractedText;

                const similarity = text1 === text2 ? 100 : calculateSimilarity(text1, text2);
                const highlightedText1 = highlightMatches(text1, text2);
                const highlightedText2 = highlightMatches(text2, text1);

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

        // Generate a PDF report summarizing all comparisons
        const doc = new PDFDocument({ margin: 50 });
        let pdfBuffers = [];
        doc.on("data", pdfBuffers.push.bind(pdfBuffers));
        doc.on("end", async () => {
            const pdfBuffer = Buffer.concat(pdfBuffers);

            // Save the report to DB
            await UCresult.create({ teacherId, results, reportFile: pdfBuffer });

            res.json({ message: "Plagiarism check completed", results });
        });

        // PDF content setup
        doc.fontSize(18).text("Plagiarism Report", { align: "center", underline: true }).moveDown();
        doc.fontSize(14).text(`Generated on: ${new Date().toLocaleString()}`, { align: "left" }).moveDown();

        results.forEach((result, index) => {
            doc.fillColor("black").fontSize(18).text(`Comparison ${index + 1}`, { bold: true }).moveDown();
            doc.fillColor("blue").fontSize(12).text(`File 1: ${result.file1}`);
            doc.text(`File 2: ${result.file2}`);
            doc.fillColor("black").text(`Similarity: ${result.similarity} (${result.level})`).moveDown();

            doc.fillColor("red").fontSize(14).text("Matched Content:").moveDown();
            doc.fillColor("black").font("Courier");

            // Text from file 1 with highlights
            doc.fillColor("blue").fontSize(14).text(`Matched Content from ${result.file1}:`).moveDown();
            result.text1.forEach(word => {
                doc.fillColor(word.highlight ? "red" : "black").text(word.text, { continued: true });
            });
            doc.moveDown(2);

            // Text from file 2 with highlights
            doc.fillColor("blue").text(`Matched Content from ${result.file2}:`).moveDown();
            result.text2.forEach(word => {
                doc.fillColor(word.highlight ? "red" : "black").text(word.text, { continued: true });
            });
            doc.moveDown(2);
        });

        doc.end();
    } catch (error) {
        console.error("Plagiarism Check Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

/**
 * GET /download-report
 * Downloads the most recent plagiarism report for the logged-in teacher
 */
router.get("/download-report", authenticate, requireTeacher, async (req, res) => {
    try {
        const report = await UCresult.findOne({ teacherId: req.userId });
        if (!report) return res.status(400).json({ error: "No report found" });

        res.setHeader("Content-Disposition", 'attachment; filename="plagiarism_report.pdf"');
        res.setHeader("Content-Type", "application/pdf");
        res.send(report.reportFile);
    } catch (error) {
        console.error("PDF Download Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

/**
 * GET /view-report
 * Opens the plagiarism report directly in the browser for the logged-in teacher
 */
router.get("/view-report", authenticate, requireTeacher, async (req, res) => {
    try {
        const report = await UCresult.findOne({ teacherId: req.userId });
        if (!report) return res.status(400).json({ error: "No report found" });

        res.setHeader("Content-Disposition", 'inline; filename="plagiarism_report.pdf"');
        res.setHeader("Content-Type", "application/pdf");
        res.send(report.reportFile);
    } catch (error) {
        console.error("PDF View Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
