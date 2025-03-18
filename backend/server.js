const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

dotenv.config();

const authRoutes = require("./routes/auth"); // Ensure correct path
const ocrUploadRoutes = require("./routes/OCRuploadcheck"); // Ensure correct filename
const courseRoutes = require("./routes/courseRoutes");

const app = express();

// ✅ Middleware
app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));
app.use(cors({ origin: process.env.CLIENT_URL || "*" }));

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/ocr", ocrUploadRoutes);
app.use("/api/courses", courseRoutes);

// ✅ Health Check
app.get("/", (req, res) => res.status(200).json({ message: "✅ VeriWrite API is running!" }));

// ✅ MongoDB Connection with Error Handling
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout if MongoDB is unreachable
    });
    
    console.log("✅ MongoDB Connected Successfully");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1); // Exit process with failure
  }
};

// ✅ Graceful Shutdown Handling
process.on("SIGINT", async () => {
  console.log("🛑 Closing MongoDB Connection...");
  await mongoose.connection.close();
  console.log("✅ MongoDB Disconnected. Exiting...");
  process.exit(0);
});

// ✅ Start Database Connection
connectDB();

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
