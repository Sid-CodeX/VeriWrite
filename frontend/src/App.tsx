// UI providers and utilities
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Auth context and route protection
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Page components
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Classroom from "./pages/Classroom";
import CourseView from "./pages/CourseView";
import AssignmentView from "./pages/AssignmentView";
import StudentDashboard from "./pages/StudentDashboard";
import StudentCourseView from "./pages/StudentCourseView";
import StudentAssignmentView from "./pages/StudentAssignmentView";
import UploadCheck from "./pages/UploadCheck";
import OnlineCheck from "./pages/OnlineCheck";
import Contact from "./pages/Contact";
import AboutUs from "./pages/AboutUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

// React Query client instance
const queryClient = new QueryClient();

const App = () => (
    <QueryClientProvider client={queryClient}>
        <TooltipProvider>
            <Toaster /> {/* Radix UI toaster for notifications */}
            <Sonner />  {/* Sonner toaster for custom toast notifications */}
            <BrowserRouter>
                <AuthProvider> {/* Provides auth context to the app */}
                    <Routes>
                        {/* Public routes */}
                        <Route path="/" element={<Index />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route path="/about-us" element={<AboutUs />} />
                        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                        <Route path="/terms-of-service" element={<TermsOfService />} />

                        {/* Protected: accessible to all authenticated users */}
                        <Route
                            path="/profile"
                            element={
                                <ProtectedRoute>
                                    <Profile />
                                </ProtectedRoute>
                            }
                        />

                        {/* Teacher-only routes */}
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

                        {/* Student-only routes */}
                        <Route
                            path="/student-dashboard"
                            element={
                                <ProtectedRoute requiredRole="student">
                                    <StudentDashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/student-course/:courseId"
                            element={
                                <ProtectedRoute requiredRole="student">
                                    <StudentCourseView />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/student-assignment/:courseId/:assignmentId"
                            element={
                                <ProtectedRoute requiredRole="student">
                                    <StudentAssignmentView />
                                </ProtectedRoute>
                            }
                        />

                        {/* Fallback for unknown routes */}
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </AuthProvider>
            </BrowserRouter>
        </TooltipProvider>
    </QueryClientProvider>
);

export default App;
