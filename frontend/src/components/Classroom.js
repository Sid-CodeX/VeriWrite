import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Classroom.css";

function Classroom() {
  const [isSignUp, setIsSignUp] = useState(false); // Toggle between login and signup
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    role: "",        // New role field
    organization: "", // New organization/school field
  });
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Check if it's signup or login
    const endpoint = isSignUp
      ? "http://localhost:5000/api/auth/signup"
      : "http://localhost:5000/api/auth/login";

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
      .then((res) => {
        if (res.ok) {
          if (!isSignUp) {
            navigate("/dashboard"); // Redirect to dashboard on successful login
          } else {
            alert("Signup successful! Please log in.");
            setIsSignUp(false); // Switch to login mode
          }
        } else {
          return res.json().then((data) => {
            throw new Error(data.message || "Something went wrong.");
          });
        }
      })
      .catch((err) => alert(err.message));
  };

  return (
    <div className="classroom-container">
      <div className="auth-form">
        <h2>{isSignUp ? "Sign Up" : "Login"}</h2>
        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <>
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select your role</option>
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="organization">Organization/School</label>
                <input
                  type="text"
                  id="organization"
                  name="organization"
                  value={formData.organization}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>
          <button type="submit" className="btn-submit">
            {isSignUp ? "Sign Up" : "Login"}
          </button>
        </form>
        <p className="toggle-auth">
          {isSignUp
            ? "Already have an account? "
            : "Not signed up yet? "}
          <span onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? "Login here." : "Sign up here."}
          </span>
        </p>
      </div>
    </div>
  );
}

export default Classroom;
