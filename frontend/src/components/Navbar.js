import React from "react";
import { Link } from "react-router-dom";
import "../styles/Navbar.css";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="logo">VeriWrite</Link>
        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/classroom">Classroom</Link></li>
          <li><Link to="/upload-documents">Upload Documents</Link></li>
          <li><Link to="/online-search">Online Search</Link></li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;