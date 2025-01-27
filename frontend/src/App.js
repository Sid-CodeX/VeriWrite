import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import Classroom from "./components/Classroom";
import DocumentUpload from "./components/DocumentUpload";
import OnlineSearch from "./components/OnlineSearch";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/classroom" element={<Classroom />} />
          <Route path="/upload-documents" element={<DocumentUpload />} />
          <Route path="/online-search" element={<OnlineSearch />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
