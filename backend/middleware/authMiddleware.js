const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.header("Authorization");
        if (!authHeader) {
            return res.status(401).json({ error: "Access denied. No token provided." });
        }

        const token = authHeader.split(" ")[1]; // Extract token
        if (!token) {
            return res.status(401).json({ error: "Invalid token format." });
        }

        // Decode token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded Token:", decoded); // Debugging

        req.user = { id: decoded.userId, role: decoded.role }; // Corrected

        // Check if user exists in DB
        const user = await User.findById(req.user.id);
        console.log("User found in DB:", user); // Debugging

        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        next();
    } catch (error) {
        console.error("Authentication error:", error);
        return res.status(401).json({ error: "Invalid or expired token." });
    }
};

module.exports = authMiddleware;
