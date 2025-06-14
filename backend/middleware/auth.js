const jwt = require("jsonwebtoken");

// Authenticates a user using JWT.
// Attaches userId and role to the request object if the token is valid.
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized: No token provided or invalid format." });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        req.role = decoded.role;
        next();
    } catch (err) {
        console.error("Authentication error:", err.message);
        return res.status(401).json({ error: "Unauthorized: Invalid token." });
    }
};

// Allows access only to users with the 'teacher' role.
const requireTeacher = (req, res, next) => {
    if (req.role !== "teacher") {
        return res.status(403).json({ error: "Access denied: Teachers only." });
    }
    next();
};

// Allows access only to users with the 'student' role.
const requireStudent = (req, res, next) => {
    if (req.role !== "student") {
        return res.status(403).json({ error: "Access denied: Students only." });
    }
    next();
};

module.exports = { authenticate, requireTeacher, requireStudent };
