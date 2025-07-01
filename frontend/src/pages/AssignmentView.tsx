import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Users, ArrowLeft, FileText, Download, Eye, BarChart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import Navbar from '@/components/Navbar';
import CustomButton from '@/components/ui/CustomButton';
import GlassmorphismCard from '@/components/ui/GlassmorphismCard';
import Footer from '@/components/Footer';
import PlagiarismReportModal from '@/components/PlagiarismReportModal';
import ExtractedTextModal from '@/components/ExtractedTextModal';
import { format } from 'date-fns';

// IMPORTANT: Replace 'fetch' with your custom 'api' instance from '@/lib/api'
// import api from '@/lib/api'; // <--- Make sure you have this import
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // Still useful for non-Axios calls or reference

// --- Interfaces (Consider moving these to a shared types file like src/types/assignment.ts) ---
interface MatchDetail {
    matchedStudentId: string;
    matchedText: string;
    plagiarismPercent: number;
    name?: string;
    email?: string;
}

interface StudentSubmissionBackend {
    studentId: string; // This is the actual student's User ID
    name: string;
    email: string;
    status: "Submitted" | "Pending";
    submittedDate: string | null;
    fileName: string;
    fileSize: number;
    extractedText: string | null;
    plagiarismPercent: number | string;
    wordCount: number;
    isChecked: boolean; // Indicates if plagiarism check has been run and results are available
    late: boolean;
    teacherRemark: string; // ADDED: Teacher's remark from backend
    minHashSignature: number[];
    topMatches: {
        matchedStudentId: string;
        matchedText: string;
        plagiarismPercent: number;
        name?: string;
        email?: string;
    }[];
    allMatches: {
        matchedStudentId: string;
        plagiarismPercent: number;
        name?: string;
        email?: string;
    }[];
}

interface Student {
    studentUserId: string; // The actual User ID of the student (primary identifier now)
    name: string;
    email: string;
    submissionDate: Date | null;
    documentName: string | null;
    plagiarismScore: number | null;
    reportGenerated: boolean; // Based on isChecked from backend
    extractedText: string | null;
    wordCount: number;
    topMatches: {
        matchedStudentId: string;
        matchedText: string;
        plagiarismPercent: number;
        name?: string;
        email?: string;
    }[];
    allMatches: {
        matchedStudentId: string;
        plagiarismPercent: number;
        name?: string;
        email?: string;
    }[];
    teacherRemark: string; // ADDED: Teacher's remark for display and passing to modal
}

interface Assignment {
    id: string;
    title: string;
    deadline: Date;
    type: 'Assignment' | 'Exam';
    description?: string;
    canSubmitLate: boolean;
}

interface Course {
    id: string;
    name: string;
}

// Component to display plagiarism score badge
const PlagiarismBadge: React.FC<{ score: number | null | string }> = ({ score }) => {
    if (score === null || score === "Not checked" || score === "—") {
        return <span className="text-xs text-muted-foreground">Not checked</span>;
    }

    const numericScore = typeof score === 'string' ? parseFloat(score) : score;

    let backgroundColor = '';
    let textColor = 'text-white';

    if (numericScore >= 0 && numericScore <= 40) {
        backgroundColor = 'bg-green-500';
    } else if (numericScore > 40 && numericScore <= 60) {
        backgroundColor = 'bg-amber-500';
        textColor = 'text-black';
    } else if (numericScore > 60 && numericScore <= 80) {
        backgroundColor = 'bg-orange-500';
    } else if (numericScore > 80 && numericScore <= 100) {
        backgroundColor = 'bg-red-500';
    } else {
        backgroundColor = 'bg-gray-500';
    }

    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${backgroundColor} ${textColor}`}>
            {numericScore}%
        </span>
    );
};

const AssignmentView = () => {
    const { courseId, assignmentId } = useParams<{ courseId: string, assignmentId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [course, setCourse] = useState<Course | null>(null);
    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [isCheckingAllPlagiarism, setIsCheckingAllPlagiarism] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    // Updated type to ensure assignmentId is always present when opening the report modal
    const [selectedStudentForReport, setSelectedStudentForReport] = useState<(Student & { assignmentId: string }) | null>(null);
    const [showExtractedTextModal, setShowExtractedTextModal] = useState(false);
    const [selectedStudentForExtractedText, setSelectedStudentForExtractedText] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    // State to control visibility of download report button
    const [showDownloadReportButton, setShowDownloadReportButton] = useState(false); // Set to false to hide by default

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const fetchAssignmentDetails = useCallback(async () => {
        setLoading(true);
        setError(null);

        if (!assignmentId) {
            setError("Assignment ID is missing.");
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError("You are not logged in. Please log in to view assignment details.");
                console.error("No authentication token found. Redirecting to login.");
                // Use navigate('/auth') instead of '/api/auth/login' for frontend routing
                setTimeout(() => navigate('/auth'), 2000);
                setLoading(false);
                return;
            }

            // --- FIX: Use axios or your custom 'api' instance here for consistency and interceptor benefits ---
            // If you've set up '@/lib/api', uncomment the line below and remove the fetch call
            // import api from '@/lib/api';
            // const response = await api.get(`/api/assignment/view/${assignmentId}`);
            const response = await fetch(`${API_BASE_URL}/api/assignment/view/${assignmentId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                let errorMessage = `Failed to fetch assignment details: ${errorData.message || response.statusText}`;

                if (response.status === 401) {
                    errorMessage = "Unauthorized: Your session may have expired. Please log in again.";
                    localStorage.removeItem('token');
                    // Use navigate('/auth') instead of '/api/auth/login' for frontend routing
                    setTimeout(() => navigate('/auth'), 2000);
                } else if (response.status === 403) {
                    errorMessage = "Forbidden: You do not have permission to view this assignment.";
                } else if (response.status === 404) {
                    errorMessage = "Assignment not found.";
                }

                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log("Fetched Assignment Details Data:", data); // LOG: Inspect this for 'classroomId' structure

            setAssignment({
                id: assignmentId,
                title: data.assignmentTitle,
                deadline: new Date(data.dueDate),
                type: data.assignmentType,
                description: data.description,
                canSubmitLate: data.canSubmitLate ?? true,
            });

            // --- FIX: Ensure course name is correctly extracted ---
            // Your backend's /api/assignment/view/:assignmentId route should return classroomId.name
            // If it returns classroomId as an object that contains name, this is correct.
            // If classroomId is just an ID string, you'd need to fetch course details separately.
            // Assuming data.classroomId.name is available as per your backend route's population.
            setCourse({
                id: courseId || data.classroomId?._id || 'unknown-course', // Fallback for ID
                name: data.classroomId?.name || 'Unknown Course', // This is the key fix for "Unknown Course"
            });

            const mappedStudents: Student[] = data.studentSubmissions.map((sub: StudentSubmissionBackend) => ({
                studentUserId: sub.studentId,
                name: sub.name,
                email: sub.email,
                submissionDate: sub.submittedDate ? new Date(sub.submittedDate) : null,
                documentName: sub.fileName,
                plagiarismScore: typeof sub.plagiarismPercent === 'number' ? sub.plagiarismPercent : null,
                reportGenerated: sub.isChecked,
                extractedText: sub.extractedText,
                wordCount: sub.wordCount,
                topMatches: sub.topMatches || [],
                allMatches: sub.allMatches || [],
                teacherRemark: sub.teacherRemark || '', // Ensure remark is initialized
            }));
            setStudents(mappedStudents);

        } catch (err) {
            console.error("Error fetching assignment details:", err);
            setError((err as Error).message || "An unexpected error occurred.");
            toast({
                title: "Error",
                description: (err as Error).message || "Failed to load assignment details.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [assignmentId, courseId, toast, navigate]); // Added navigate to dependencies

    useEffect(() => {
        fetchAssignmentDetails();
    }, [fetchAssignmentDetails]);

    // Handler to update a student's remark in the local state
    const handleRemarkUpdated = useCallback(async (studentId: string, newRemark: string) => { // Made async
        setStudents(prevStudents =>
            prevStudents.map(student =>
                student.studentUserId === studentId
                    ? { ...student, teacherRemark: newRemark }
                    : student
            )
        );
        toast({
            title: "Remark Saved",
            description: "Student remark updated successfully.",
            variant: "success",
        });

        // --- FIX: Force a re-fetch of assignment details after remark update ---
        // This ensures the AssignmentView and all its child components (like the modal itself when re-opened,
        // or any other part of the UI that displays remarks) get the latest data from the server.
        await fetchAssignmentDetails(); // Call fetchAssignmentDetails to re-fetch all data
        // --- END FIX ---

    }, [toast, fetchAssignmentDetails]); // Add fetchAssignmentDetails to dependencies


    const handleCheckAllPlagiarism = async () => {
        setIsCheckingAllPlagiarism(true);
        setError(null);

        if (!assignmentId) {
            toast({
                title: "Error",
                description: "Assignment ID is missing, cannot initiate plagiarism check.",
                variant: "destructive",
            });
            setIsCheckingAllPlagiarism(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error("Authentication token not found. Please log in.");
            }

            toast({
                title: "Plagiarism check initiated",
                description: "Sending request to generate reports for all submitted assignments...",
                variant: "default",
            });

            // --- FIX: Use axios or your custom 'api' instance here for consistency and interceptor benefits ---
            // const response = await api.post(`/api/assignment/check-plagiarism/${assignmentId}`);
            const response = await fetch(`${API_BASE_URL}/api/assignment/check-plagiarism/${assignmentId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                let errorMessage = `Failed to initiate plagiarism check: ${errorData.error || errorData.message || 'Invalid request'}`;

                if (response.status === 401) {
                    errorMessage = "Unauthorized: Your session may have expired. Please log in again.";
                    localStorage.removeItem('token');
                    // Use navigate('/auth') instead of '/api/auth/login' for frontend routing
                    setTimeout(() => navigate('/auth'), 2000);
                } else if (response.status === 400) {
                    errorMessage = `Bad Request: ${errorData.error || errorData.message || 'Invalid request'}`;
                }

                throw new Error(errorMessage);
            }

            const data = await response.json();
            toast({
                title: "Plagiarism check complete",
                description: data.message || "Reports have been generated for submitted assignments.",
                variant: "success",
            });

            await fetchAssignmentDetails(); // Re-fetch to get updated plagiarism percentages and flags

        } catch (err) {
            console.error("Error during plagiarism check:", err);
            setError((err as Error).message || "An unexpected error occurred during plagiarism check.");
            toast({
                title: "Plagiarism Check Failed",
                description: (err as Error).message || "Failed to complete plagiarism check.",
                variant: "destructive",
            });
        } finally {
            setIsCheckingAllPlagiarism(false);
        }
    };

    const handleDownloadPlagiarismPdf = async (studentUserId: string, studentName: string, assignmentTitle: string) => {
        setIsGeneratingPdf(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error("Authentication token not found. Please log in.");
            }

            toast({
                title: "Generating PDF...",
                description: "Your plagiarism report is being generated and will download shortly.",
                variant: "default",
            });

            // --- FIX: Use axios or your custom 'api' instance here for consistency and interceptor benefits ---
            // const response = await api.get(`/api/plagiarism-reports/${assignmentId}/${studentUserId}/download`, { responseType: 'blob' });
            const response = await fetch(`${API_BASE_URL}/api/plagiarism-reports/${assignmentId}/${studentUserId}/download`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`Failed to download report: ${errorData.message || response.statusText}`);
            }

            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `plagiarism_report_${studentName.replace(/\s/g, '_')}_${assignmentTitle.replace(/\s/g, '_')}.pdf`;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1];
                }
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            toast({
                title: "Download Complete",
                description: "Plagiarism report downloaded successfully!",
                variant: "success",
            });

        } catch (err) {
            console.error("Error downloading PDF:", err);
            toast({
                title: "Download Failed",
                description: (err as Error).message || "Failed to download plagiarism report.",
                variant: "destructive",
            });
        } finally {
            setIsGeneratingPdf(false);
        }
    };


    // Handler for viewing the full plagiarism report
    const handleViewReport = (student: Student) => {
        if (!student.reportGenerated) {
            toast({
                title: "Report Not Available",
                description: "Plagiarism report has not been generated for this student yet.",
                variant: "info",
            });
            return;
        }
        // Pass the assignmentId along with the student data
        if (assignmentId) {
            setSelectedStudentForReport({ ...student, assignmentId: assignmentId });
            setShowReportModal(true);
        } else {
            toast({
                title: "Error",
                description: "Assignment ID is missing, cannot open report.",
                variant: "destructive",
            });
        }
    };

    // Handler for viewing just the extracted text
    const handleViewExtractedText = (student: Student) => {
        // Only allow viewing extracted text if a submission exists and text was extracted.
        if (!student.submissionDate || !student.extractedText) {
            toast({
                title: "No Submission",
                description: "This student has not submitted an assignment or text could not be extracted.",
                variant: "info",
            });
            return;
        }
        setSelectedStudentForExtractedText(student);
        setShowExtractedTextModal(true);
    };


    if (loading) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-grow pt-24 pb-16 px-6">
                    <div className="container max-w-6xl mx-auto">
                        <p>Loading assignment details...</p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-grow pt-24 pb-16 px-6">
                    <div className="container max-w-6xl mx-auto">
                        <p className="text-red-500">Error: {error}</p>
                        <CustomButton
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/classroom/${courseId}`)}
                            icon={<ArrowLeft className="h-4 w-4" />}
                        >
                            Back to Course
                        </CustomButton>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    // --- Start of JSX rendering ---
    // This block handles the case where assignment or course data might be null after loading
    // (e.g., if an error occurred but was caught, or if data is truly not found)
    if (!assignment || !course) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-grow pt-24 pb-16 px-6">
                    <div className="container max-w-6xl mx-auto text-center">
                        <p className="text-lg text-muted-foreground">Assignment or Course details not found after loading.</p>
                        <CustomButton
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/classroom/${courseId}`)}
                            className="mt-4"
                        >
                            Back to Course
                        </CustomButton>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const submittedCount = students.filter(s => s.submissionDate).length;
    const pendingCount = students.length - submittedCount;
    const checkedCount = students.filter(s => s.reportGenerated).length;

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />

            <main className="flex-grow pt-24 pb-16 px-6">
                <div className="container max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div className="flex items-center gap-3">
                            <CustomButton
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/classroom/${courseId}`)}
                                icon={<ArrowLeft className="h-4 w-4" />}
                            >
                                Back to Course
                            </CustomButton>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-3xl font-bold">{assignment.title}</h1>
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                                        assignment.type === 'Exam'
                                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                    }`}>
                                        {assignment.type === 'Exam' ? 'Exam' : 'Assignment'}
                                    </span>
                                </div>
                                <p className="text-muted-foreground mt-1">{course.name}</p>
                            </div>
                        </div>
                    </div>

                    <GlassmorphismCard className="mb-8 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Details</h3>
                                {assignment.description && (
                                    <p className="text-muted-foreground mb-4">{assignment.description}</p>
                                )}
                                <div className="flex flex-wrap gap-x-6 gap-y-3">
                                    <div className="flex items-center gap-1 text-sm">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span>Due: <strong>{format(assignment.deadline, 'MMM d,yyyy p')}</strong></span>
                                    </div>
                                    <div className="flex items-center gap-1 text-sm">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                        <span>Class size: <strong>{students.length} students</strong></span>
                                    </div>
                                    {/* --- ADDED: Display Late Submission Info using canSubmitLate --- */}
                                    <div className="flex items-center gap-1 text-sm">
                                        {assignment.canSubmitLate ? (
                                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                                Late Submissions Allowed
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                                Late Submissions Not Allowed
                                            </span>
                                        )}
                                    </div>
                                    {/* --- END ADDED --- */}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{submittedCount}</p>
                                    <p className="text-xs text-blue-700 dark:text-blue-500">Submitted</p>
                                </div>
                                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 text-center">
                                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pendingCount}</p>
                                    <p className="text-xs text-amber-700 dark:text-amber-500">Pending</p>
                                </div>
                                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{checkedCount}</p>
                                    <p className="text-xs text-green-700 dark:text-green-500">Checked</p>
                                </div>
                            </div>
                        </div>
                    </GlassmorphismCard>

                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-xl font-bold">Student Submissions</h2>
                        <CustomButton
                            onClick={handleCheckAllPlagiarism}
                            loading={isCheckingAllPlagiarism}
                            disabled={isCheckingAllPlagiarism}
                            icon={<BarChart className="h-4 w-4" />}
                        >
                            {isCheckingAllPlagiarism ? 'Checking All...' : 'Check All Plagiarism'}
                        </CustomButton>
                    </div>

                    <div className="overflow-x-auto">
                        <div className="inline-block min-w-full align-middle">
                            <div className="overflow-hidden border border-border rounded-lg">
                                <table className="min-w-full divide-y divide-border">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Student
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Submission
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Plagiarism
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-background divide-y divide-border">
                                        {students.map((student) => (
                                            <tr key={student.studentUserId} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div>
                                                            <div className="text-sm font-medium">{student.name}</div>
                                                            <div className="text-xs text-muted-foreground">{student.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {student.submissionDate ? (
                                                        <div>
                                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                                                Submitted
                                                            </span>
                                                            <div className="text-xs text-muted-foreground mt-1">
                                                                {format(student.submissionDate, 'MMM d,yyyy')}
                                                                {/* --- ADDED: Display (Late) if applicable and assignment allows --- */}
                                                                {assignment.canSubmitLate && student.submissionDate > assignment.deadline && (
                                                                    <span className="text-red-500 ml-1">(Late)</span>
                                                                )}
                                                                {/* --- END ADDED --- */}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                                                            Pending
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {/* Conditional rendering for "Submission" (file name) link */}
                                                    {student.documentName && student.documentName !== "No submission" ? (
                                                        <CustomButton
                                                            variant="link"
                                                            size="sm"
                                                            onClick={() => handleViewExtractedText(student)}
                                                            className="p-0 h-auto text-sm"
                                                        >
                                                            <FileText className="h-4 w-4 mr-1.5 text-muted-foreground" />
                                                            <span className="truncate max-w-[150px]">{student.documentName}</span>
                                                        </CustomButton>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">No submission</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <PlagiarismBadge score={student.plagiarismScore} />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    {/* Conditional rendering for "Actions" (View/Download plagiarism report buttons) */}
                                                    {student.submissionDate && student.reportGenerated ? (
                                                        <div className="flex justify-end gap-2">
                                                            <CustomButton
                                                                variant="outline"
                                                                size="sm"
                                                                icon={<Eye className="h-3.5 w-3.5" />}
                                                                onClick={() => handleViewReport(student)}
                                                            >
                                                                View
                                                            </CustomButton>
                                                            {/* --- HIDE DOWNLOAD REPORT BUTTON --- */}
                                                            {showDownloadReportButton && ( // Only render if showDownloadReportButton is true
                                                                <CustomButton
                                                                    variant="outline"
                                                                    size="sm"
                                                                    icon={<Download className="h-3.5 w-3.5" />}
                                                                    onClick={() => handleDownloadPlagiarismPdf(
                                                                        student.studentUserId,
                                                                        student.name,
                                                                        assignment.title
                                                                    )}
                                                                    loading={isGeneratingPdf}
                                                                    disabled={isGeneratingPdf}
                                                                >
                                                                    {isGeneratingPdf ? 'Downloading...' : 'Download'}
                                                                </CustomButton>
                                                            )}
                                                            {/* --- END HIDE --- */}
                                                        </div>
                                                    ) : (
                                                        student.submissionDate ? (
                                                            <span className="text-xs text-muted-foreground">Report pending</span>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground italic">Not submitted</span>
                                                        )
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Conditional rendering for the Plagiarism Report Modal */}
            {showReportModal && selectedStudentForReport && assignment && (
                <PlagiarismReportModal
                    student={selectedStudentForReport}
                    assignmentTitle={assignment.title}
                    assignmentType={assignment.type}
                    onClose={() => setShowReportModal(false)}
                    onDownloadReport={() => handleDownloadPlagiarismPdf(selectedStudentForReport.studentUserId, selectedStudentForReport.name, assignment.title)}
                    isGeneratingPdf={isGeneratingPdf}
                    onRemarkUpdated={handleRemarkUpdated} // ADDED: Pass the callback here
                />
            )}

            {/* Conditional rendering for the NEW Extracted Text Modal */}
            {showExtractedTextModal && selectedStudentForExtractedText && assignment && (
                <ExtractedTextModal
                    student={selectedStudentForExtractedText}
                    assignmentTitle={assignment.title}
                    onClose={() => setShowExtractedTextModal(false)}
                />
            )}

            <Footer />
        </div>
    );
};

export default AssignmentView;
