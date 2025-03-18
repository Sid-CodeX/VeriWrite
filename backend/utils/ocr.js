const axios = require("axios");
const fs = require("fs");

const extractTextFromImage = async (filePath) => {
  try {
    const imageBuffer = fs.readFileSync(filePath);
    const response = await axios.post(
      "https://centralindia.api.cognitive.microsoft.com/vision/v3.2/read/analyze",
      imageBuffer,
      {
        headers: {
          "Ocp-Apim-Subscription-Key": process.env.AZURE_OCR_KEY,
          "Content-Type": "application/octet-stream",
        },
      }
    );

    if (response.status === 202) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const resultResponse = await axios.get(response.headers["operation-location"], {
        headers: { "Ocp-Apim-Subscription-Key": process.env.AZURE_OCR_KEY },
      });

      if (resultResponse.data.status === "succeeded") {
        return resultResponse.data.analyzeResult.readResults
          .map((page) => page.lines.map((line) => line.text).join("\n"))
          .join("\n");
      }
    }
    return "";
  } catch (error) {
    console.error("Azure OCR Error:", error.response?.data || error.message);
    return "";
  }
};

module.exports = { extractTextFromImage };
