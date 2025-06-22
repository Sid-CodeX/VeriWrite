const jwt = require("jsonwebtoken");

/**
 * Middleware: Authenticate user via JWT.
 * 
 * - Verifies the presence and validity of a Bearer token in the Authorization header.
 * - On success: attaches `userId` and `role` to `req` for downstream use.
 * - On failure: responds with 401 Unauthorized.
 * 
 * @access Private
 */
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized: Missing or malformed token." });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        req.role = decoded.role;
        next();
    } catch (err) {
        console.error(`Authentication Error: ${err.message}`);
        return res.status(401).json({ error: "Unauthorized: Invalid or expired token." });
    }
};

/**
 * Middleware: Authorize access for teacher role.
 * 
 * - Ensures the authenticated user has role 'teacher'.
 * - Responds with 403 Forbidden if not a teacher.
 * 
 * @access Private (Teachers only)
 */
const requireTeacher = (req, res, next) => {
    if (req.role !== "teacher") {
        return res.status(403).json({ error: "Access denied: Teachers only." });
    }
    next();
};

/**
 * Middleware: Authorize access for student role.
 * 
 * - Ensures the authenticated user has role 'student'.
 * - Responds with 403 Forbidden if not a student.
 * 
 * @access Private (Students only)
 */
const requireStudent = (req, res, next) => {
    if (req.role !== "student") {
        return res.status(403).json({ error: "Access denied: Students only." });
    }
    next();
};

module.exports = {
    authenticate,
    requireTeacher,
    requireStudent,
};
