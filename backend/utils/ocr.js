const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");

const extractTextFromImage = async (filePath) => {
    try {
        const imageBuffer = fs.readFileSync(filePath);

        const response = await axios.post(
            "https://centralindia.api.cognitive.microsoft.com/vision/v3.2/read/analyze", // Correct API
            imageBuffer,
            {
                headers: {
                    "Ocp-Apim-Subscription-Key": process.env.AZURE_OCR_KEY,  // Ensure you use the correct API Key
                    "Content-Type": "application/octet-stream",
                },
            }
        );

        if (response.status === 202) {
            const operationUrl = response.headers["operation-location"];

            // Poll for the result
            await new Promise((resolve) => setTimeout(resolve, 2000));

            const resultResponse = await axios.get(operationUrl, {
                headers: {
                    "Ocp-Apim-Subscription-Key": process.env.AZURE_OCR_KEY,
                },
            });

            if (resultResponse.data.status === "succeeded") {
                return resultResponse.data.analyzeResult.readResults
                    .map((page) => page.lines.map((line) => line.text).join("\n"))
                    .join("\n");
            }
        }

        return ""; // Return empty string if no text found
    } catch (error) {
        console.error("Azure OCR Error:", error.response?.data || error.message);
        return "";
    }
};

module.exports = { extractTextFromImage };
