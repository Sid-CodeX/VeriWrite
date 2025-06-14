
// routes/plagiarismReportRoutes.js
const express = require("express");
const router = express.Router();
const puppeteer = require('puppeteer'); // Import Puppeteer
const Assignment = require("../models/Assignment");
const User = require("../models/User");
const { authenticate, requireTeacher } = require("../middleware/auth");

// Helper to format date for the report
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

// Route to download plagiarism report PDF
router.get("/:submissionId/download", authenticate, requireTeacher, async (req, res) => {
  let browser; // Declare browser outside try-catch for finally block access
  try {
    const { submissionId } = req.params;

    const assignment = await Assignment.findOne({
      "submissions._id": submissionId
    })
    .populate("classroomId", "name")
    .lean();

    if (!assignment) {
      return res.status(404).json({ message: "Assignment or submission not found" });
    }

    const submission = assignment.submissions.find(
      (sub) => sub._id.toString() === submissionId
    );

    if (!submission) {
      return res.status(404).json({ message: "Submission not found within the assignment" });
    }

    const mainStudentUser = await User.findById(submission.studentId).select('name email').lean();
    const studentName = mainStudentUser ? mainStudentUser.name : submission.name || 'Unknown Student';
    const studentEmail = mainStudentUser ? mainStudentUser.email : submission.email || 'N/A';

    const uniqueMatchedStudentIds = new Set();
    (submission.topMatches || []).forEach(match => {
        if (match.matchedStudentId) uniqueMatchedStudentIds.add(match.matchedStudentId.toString());
    });
    (submission.allMatches || []).forEach(match => {
        if (match.matchedStudentId) uniqueMatchedStudentIds.add(match.matchedStudentId.toString());
    });

    const matchedUsersMap = new Map();
    if (uniqueMatchedStudentIds.size > 0) {
        const users = await User.find({ _id: { $in: Array.from(uniqueMatchedStudentIds) } }).select('name email').lean();
        users.forEach(user => {
            matchedUsersMap.set(user._id.toString(), { name: user.name, email: user.email });
        });
    }

    const reportData = {
      studentName: studentName,
      studentEmail: studentEmail,
      assignmentTitle: assignment.title,
      classroomName: assignment.classroomId ? assignment.classroomId.name : 'N/A',
      submittedDate: formatDate(submission.submittedAt),
      documentName: submission.fileName || 'N/A',
      wordCount: submission.wordCount ?? 'N/A',
      overallPlagiarismScore: submission.plagiarismPercent ?? 0,
      submittedText: submission.extractedText || 'No extracted text available.',
      topMatches: (submission.topMatches || []).map(match => {
          const matchedUserDetails = matchedUsersMap.get(match.matchedStudentId.toString());
          return {
              matchedStudentName: matchedUserDetails ? matchedUserDetails.name : 'Unknown Student',
              matchedStudentEmail: matchedUserDetails ? matchedUserDetails.email : 'N/A',
              matchedText: match.matchedText,
              plagiarismPercent: match.plagiarismPercent
          };
      })
    };

    // Construct HTML content for the PDF (same as before)
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <title>Plagiarism Report - ${reportData.studentName}</title>
          <style>
              body { font-family: Arial, sans-serif; margin: 20px; color: #333; line-height: 1.6; }
              h1, h2, h3 { color: #0056b3; margin-bottom: 10px; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 15px; }
              .header h1 { font-size: 2.2em; }
              .header h2 { font-size: 1.5em; color: #555; }
              .section { margin-bottom: 25px; border: 1px solid #e7e7e7; border-radius: 8px; padding: 15px; background-color: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
              .score-box { text-align: center; padding: 20px; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; margin-bottom: 20px; }
              .score { font-size: 3em; font-weight: bold; color: #dc3545; }
              .metadata p { margin: 8px 0; font-size: 0.95em; }
              .submitted-text-container { background-color: #f0f4f8; border: 1px solid #cce5ff; border-radius: 5px; padding: 15px; margin-top: 10px; }
              .submitted-text { white-space: pre-wrap; word-wrap: break-word; font-family: 'Courier New', Courier, monospace; font-size: 0.9em; line-height: 1.4; }
              .match-item { margin-bottom: 20px; padding: 15px; border: 1px solid #e0f2f7; background-color: #f0faff; border-radius: 6px; }
              .match-item:last-child { margin-bottom: 0; }
              .match-percent { font-weight: bold; color: #dc3545; margin-left: 10px; }
              .source-text-container { background-color: #e9f5f9; border-left: 4px solid #007bff; padding: 10px; margin-top: 10px; font-size: 0.85em; }
              .matched-text-highlight { background-color: #fffacd; padding: 1px 0; border-radius: 2px; }
              .footer { text-align: center; margin-top: 40px; font-size: 0.75em; color: #888; }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>Plagiarism Report for ${reportData.studentName}</h1>
              <h2>${reportData.assignmentTitle} (${reportData.classroomName})</h2>
          </div>

          <div class="section">
              <h3>Submission Details</h3>
              <div class="metadata">
                  <p><strong>Student Name:</strong> ${reportData.studentName}</p>
                  <p><strong>Student Email:</strong> ${reportData.studentEmail}</p>
                  <p><strong>Submitted On:</strong> ${reportData.submittedDate}</p>
                  <p><strong>Document Name:</strong> ${reportData.documentName}</p>
                  <p><strong>Word Count:</strong> ${reportData.wordCount}</p>
              </div>
          </div>

          <div class="section score-box">
              <h3>Overall Plagiarism Score</h3>
              <div class="score">${reportData.overallPlagiarismScore}%</div>
          </div>

          <div class="section">
              <h3>Submitted Text</h3>
              <div class="submitted-text-container">
                  <pre class="submitted-text">${reportData.submittedText}</pre>
              </div>
          </div>

          ${reportData.topMatches.length > 0 ? `
          <div class="section">
              <h3>Top Plagiarism Matches</h3>
              ${reportData.topMatches.map(match => `
                  <div class="match-item">
                      <p><strong>Matched Source:</strong> ${match.matchedStudentName} (${match.matchedStudentEmail}) <span class="match-percent">${match.plagiarismPercent}%</span></p>
                      <div class="source-text-container">
                          <strong>Matched Text:</strong>
                          <pre>${match.matchedText}</pre>
                      </div>
                  </div>
              `).join('')}
          </div>
          ` : ''}

          <div class="footer">
              Generated by VeriWrite on ${formatDate(new Date())}. All rights reserved.
          </div>
      </body>
      </html>
    `;

    // Puppeteer setup for PDF generation
    browser = await puppeteer.launch({
      headless: true, // Use 'new' for Puppeteer v21+
      args: ['--no-sandbox', '--disable-setuid-sandbox'] // Recommended for production environments
    });
    const page = await browser.newPage();

    // Set the HTML content
    await page.setContent(htmlContent, {
        waitUntil: 'networkidle0' // Wait until network is idle (all resources loaded)
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true, // Ensure background colors are printed
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      displayHeaderFooter: true,
      headerTemplate: `<div style="font-size: 9px; margin-left: 20mm; color: #999;">VeriWrite Plagiarism Report</div>`,
      footerTemplate: `<div style="font-size: 9px; margin-right: 20mm; text-align: right; color: #999;">Page <span class="pageNumber"></span>/<span class="totalPages"></span></div>`,
    });

    const fileName = `plagiarism_report_${studentName.replace(/\s/g, '_')}_${assignment.title.replace(/\s/g, '_')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error("Error generating plagiarism report with Puppeteer:", error);
    res.status(500).json({ message: "Server error during PDF generation" });
  } finally {
    if (browser) {
      await browser.close(); // Ensure the browser is closed
    }
  }
});

module.exports = router; 