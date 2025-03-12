const { ComputerVisionClient } = require("@azure/cognitiveservices-vision-computervision");
const { ApiKeyCredentials } = require("@azure/ms-rest-js");
const fs = require("fs");

const computerVisionClient = new ComputerVisionClient(
    new ApiKeyCredentials({ inHeader: { "Ocp-Apim-Subscription-Key": process.env.AZURE_OCR_KEY } }),
    process.env.AZURE_OCR_ENDPOINT
);

async function extractTextFromImage(imagePath) {
    try {
        const imageBuffer = fs.readFileSync(imagePath);
        const result = await computerVisionClient.readInStream(imageBuffer);
        const operationLocation = result.operationLocation.split("/").pop();

        let recognitionResult;
        do {
            recognitionResult = await computerVisionClient.getReadResult(operationLocation);
        } while (recognitionResult.status === "running");

        if (recognitionResult.status === "succeeded") {
            return recognitionResult.analyzeResult.readResults.map(page =>
                page.lines.map(line => line.text).join("\n")
            ).join("\n");
        }
        return "";
    } catch (error) {
        console.error("OCR Error:", error);
        return "";
    }
}

module.exports = { extractTextFromImage };
