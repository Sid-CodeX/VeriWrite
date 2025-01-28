const { google } = require("googleapis");
const User = require("../models/User");

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.FRONTEND_URL}/dashboard`
);

exports.googleAuth = (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/classroom.courses.readonly"],
  });
  res.redirect(authUrl);
};

exports.googleCallback = async (req, res) => {
  const code = req.query.code;

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const classroom = google.classroom({ version: "v1", auth: oauth2Client });
    const courses = await classroom.courses.list();

    // Save access token and courses in the database
    const user = await User.findById(req.user.id);
    user.accessToken = tokens.access_token;
    await user.save();

    res.status(200).json({ courses: courses.data.courses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
