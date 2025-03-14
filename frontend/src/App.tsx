
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Classroom from "./pages/Classroom";
import CourseView from "./pages/CourseView";
import AssignmentView from "./pages/AssignmentView";
import StudentDashboard from "./pages/StudentDashboard";
import UploadCheck from "./pages/UploadCheck";
import OnlineCheck from "./pages/OnlineCheck";
import Contact from "./pages/Contact";
import AboutUs from "./pages/AboutUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            
            {/* Protected routes - Teacher */}
            <Route 
              path="/classroom" 
              element={
                <ProtectedRoute requiredRole="teacher">
                  <Classroom />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/classroom/:courseId" 
              element={
                <ProtectedRoute requiredRole="teacher">
                  <CourseView />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/classroom/:courseId/assignment/:assignmentId" 
              element={
                <ProtectedRoute requiredRole="teacher">
                  <AssignmentView />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/upload-check" 
              element={
                <ProtectedRoute requiredRole="teacher">
                  <UploadCheck />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/online-check" 
              element={
                <ProtectedRoute requiredRole="teacher">
                  <OnlineCheck />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected routes - Student */}
            <Route 
              path="/student-dashboard" 
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Catch all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
