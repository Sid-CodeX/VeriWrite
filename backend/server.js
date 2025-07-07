const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs").promises; // Add this line
const app = express();

dotenv.config();

const authRoutes = require("./routes/auth");
const ocrUploadRoutes = require("./routes/OCRuploadcheck");
const courseRoutes = require("./routes/classroom");
const onlineCheckRoutes = require("./routes/OCRonlinecheck");
const assignmentRoutes = require("./routes/assignment");
const studentClassroomRoutes = require('./routes/studentclassroom');
const studentAssignmentRoutes = require("./routes/studentassignment");
const plagiarismReportRoutes = require('./routes/plagiarismReportRoutes');

// Middleware
app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));
app.use(cors({ origin: process.env.CLIENT_URL || "*" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/uploadcheck", ocrUploadRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/onlinecheck", onlineCheckRoutes);
app.use("/uploads/assignments", express.static(path.join(__dirname, "uploads/assignments")));
app.use("/api/assignment", assignmentRoutes);
app.use('/api/studentcourses', studentClassroomRoutes);
app.use("/api/studentassignment", studentAssignmentRoutes);
app.use('/api/plagiarism-reports', plagiarismReportRoutes);

// Health Check
app.get("/", (req, res) => res.status(200).json({ message: "VeriWrite API is running!" }));

// Periodic Cleanup: Delete old reports every 1 hour
setInterval(async () => {
    try {
        await fs.rm("temp/reports", { recursive: true, force: true });
        console.log("Old reports deleted successfully.");
    } catch (err) {
        console.error("Error deleting reports:", err);
    }
}, 1000 * 60 * 60); // Runs every 1 hour

// MongoDB Connection with Error Handling
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000, // Timeout if MongoDB is unreachable
        });

        console.log("MongoDB Connected Successfully");
    } catch (err) {
        console.error("MongoDB Connection Error:", err);
        process.exit(1); // Exit process with failure
    }
};

// Graceful Shutdown Handling
process.on("SIGINT", async () => {
    console.log("Closing MongoDB Connection...");
    await mongoose.connection.close();
    console.log("MongoDB Disconnected. Exiting...");
    process.exit(0);
});

// Health Check for Render
app.get("/healthz", (req, res) => {
  res.status(200).json({ status: "ok", message: "VeriWrite backend healthy" });
});

// Start Database Connection
connectDB();

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));