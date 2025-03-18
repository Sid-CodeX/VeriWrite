const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

dotenv.config();

const authRoutes = require("./routes/auth");
const ocrUploadRoutes = require("./routes/OCRuploadcheck"); // Ensure the file exists

const app = express();

// ✅ Middleware
app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));
app.use(cors({ origin: process.env.CLIENT_URL || "*" }));

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/ocr", ocrUploadRoutes);

// ✅ Health Check
app.get("/", (req, res) => res.status(200).json({ message: "✅ VeriWrite API is running!" }));

// ✅ MongoDB Connection with Error Handling
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB Connected Successfully");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1); // Exit process with failure
  }
};

// ✅ Start Database Connection
connectDB();

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
