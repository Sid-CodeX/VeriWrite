const { AzureKeyCredential, DocumentAnalysisClient } = require("@azure/ai-form-recognizer");
const fs = require("fs");

// Load environment variables
const endpoint = process.env.AZURE_OCR_ENDPOINT;
const apiKey = process.env.AZURE_OCR_KEY;

// Initialize Azure OCR client
const client = new DocumentAnalysisClient(endpoint, new AzureKeyCredential(apiKey));

async function extractTextFromImage(imagePath) {
    try {
        const imageBuffer = fs.readFileSync(imagePath);

        // Send image for OCR processing
        const poller = await client.beginAnalyzeDocument("prebuilt-read", imageBuffer);
        const result = await poller.pollUntilDone();

        if (!result || !result.pages) {
            return "";
        }

        // Extract and return the text
        return result.pages
            .map(page => page.lines.map(line => line.content).join("\n"))
            .join("\n");
    } catch (error) {
        console.error("OCR Error:", error);
        return "";
    }
}

module.exports = { extractTextFromImage };
