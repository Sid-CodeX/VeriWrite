// frontend/src/pages/StudentAssignmentView.tsx

import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

import { ArrowLeft, FileText, Calendar, Clock, Check, AlertTriangle, File, X, Award } from 'lucide-react';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CustomButton from '@/components/ui/CustomButton';

// Import your sub-components (AssignmentDetails, ExamResult, etc.)
import AssignmentDetails from '@/components/student/AssignmentDetails';
import ExamResult from '@/components/student/ExamResult';
import FileUploader from '@/components/student/FileUploader';
import PreviousSubmissions from '@/components/student/PreviousSubmissions';
import SubmissionStatusSidebar from '@/components/student/SubmissionStatusSidebar';
import TeachersRemark from '@/components/student/TeachersRemark';

// --- REVISED INTERFACES ---
interface AssignmentDetailsResponse {
    assignmentId: string;
    classroom: {
        id: string;
        name: string;
    };
    title: string;
    description?: string;
    type: 'assignment' | 'exam';
    deadline: string; // ISO string
    deadlinePassed: boolean;
    submissionStatus: 'Submitted' | 'Pending';
    submittedAt?: string | null; // ISO string or null
    fileName?: string | null; // Name of the submitted file if submitted
    canSubmitLate: boolean;
    message: string;
    submissionGuidelines: string[];
    questionFileUrl?: string;
    questionFileOriginalName?: string;
    // teacherRemark is typically on the submission, not the assignment itself,
    // so it's better to fetch it with submissions or access from the latest submission.
    // teacherRemark?: string | null; // Removed as it's typically tied to a submission
}

interface StudentSubmission {
    _id: string; // Changed from 'id' to '_id' to match common backend ObjectId naming and your PreviousSubmissions
    fileName: string;
    submittedAt: string; // Keep as string here, convert to Date when passing to components
    plagiarismPercent?: number; // Renamed from similarity to match potential backend naming
    teacherRemark?: string;
    score?: number;
    markDistribution?: {
        section: string;
        maxMarks: number;
        scored: number;
    }[];
    status: 'processing' | 'checked' | 'error';
    late: boolean;
    fileSize: number;
}

const StudentAssignmentView = () => {
    const { courseId, assignmentId } = useParams<{ courseId: string, assignmentId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user } = useAuth();

    const [assignment, setAssignment] = useState<AssignmentDetailsResponse | null>(null);
    const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const fetchAssignmentDetails = useCallback(async () => {
        if (!user || !assignmentId) {
            setError("Authentication failed or assignment ID missing.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(`${API_BASE_URL}/studentassignment/${assignmentId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            const data = response.data;
            setAssignment(data);

            // Assuming your backend response for a single assignment detail might not return *all* submissions.
            // If you have a dedicated endpoint for all submissions, call it here.
            // For now, if the main assignment route returns previous submissions in an array, use that.
            // Otherwise, we'll construct a mock latest submission from the main data.

            // OPTION 1: If your backend returns an array of 'submissions' directly on the assignment detail route
            if (Array.isArray(data.submissions)) {
                setSubmissions(data.submissions.map((sub: any) => ({
                    _id: sub._id,
                    fileName: sub.fileName,
                    fileSize: sub.fileSize,
                    submittedAt: sub.submittedAt, // Keep as string, convert in component if needed
                    status: sub.status,
                    plagiarismPercent: sub.plagiarismPercent,
                    late: sub.late,
                    score: sub.score,
                    teacherRemark: sub.teacherRemark,
                    markDistribution: sub.markDistribution
                })));
            }
            // OPTION 2: If the backend only returns the *latest* submission details directly on the assignment object
            // and you need to simulate a previous submission for display.
            else if (data.submissionStatus === 'Submitted' && data.submittedAt && data.fileName) {
                const latestSubmission: StudentSubmission = {
                    _id: data.submissionId || 'temp-sub-id-' + Date.now(), // Ensure backend provides submissionId or generate a temp one
                    fileName: data.fileName,
                    submittedAt: data.submittedAt,
                    status: data.status || 'checked', // Assuming 'checked' for already submitted, or 'processing' if just uploaded
                    late: data.deadlinePassed, // If submitted after deadline
                    plagiarismPercent: data.plagiarismPercent, // Use plagiarismPercent if backend provides it
                    teacherRemark: data.teacherRemark || undefined, // Use data.teacherRemark if it's sent from backend
                    score: data.score, // Use score if backend provides it
                    markDistribution: data.markDistribution,
                    fileSize: data.fileSize || 0 // Placeholder, as backend doesn't provide this on main route for single assignment
                };
                setSubmissions([latestSubmission]);
            } else {
                setSubmissions([]);
            }

        } catch (err) {
            console.error("Error fetching assignment details:", err);
            if (axios.isAxiosError(err) && err.response) {
                setError(err.response.data.error || `Failed to load assignment details: ${err.response.statusText}`);
            } else {
                setError("Failed to load assignment details. Please try again.");
            }
            toast({
                title: "Error",
                description: "Failed to load assignment details.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [user, assignmentId, toast, API_BASE_URL]);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchAssignmentDetails();
    }, [fetchAssignmentDetails]);

    const handleSubmit = async () => {
        if (!selectedFile || !assignment) {
            toast({
                title: "Missing information",
                description: "Please select a file and ensure assignment details are loaded.",
                variant: "destructive",
            });
            return;
        }

        setIsUploading(true);

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('assignmentId', assignment.assignmentId);

        try {
            const uploadResponse = await axios.post(`${API_BASE_URL}/studentassignment/submit`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            toast({
                title: "Submission successful",
                description: uploadResponse.data.message || "Your file has been uploaded successfully.",
                variant: "default",
            });

            fetchAssignmentDetails(); // Re-fetch to update status and latest submission

        } catch (err) {
            console.error("Error submitting file:", err);
            if (axios.isAxiosError(err) && err.response) {
                toast({
                    title: "Submission failed",
                    description: err.response.data.error || "Failed to upload your file. Please try again.",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Submission failed",
                    description: "An unexpected error occurred during upload. Please try again.",
                    variant: "destructive",
                });
            }
        } finally {
            setSelectedFile(null);
            setIsUploading(false);
        }
    };

    const isPastDeadline = assignment?.deadlinePassed ?? false;

    // --- Handle question file download ---
    const handleDownloadQuestionFile = useCallback(() => {
        if (assignment?.questionFileUrl) {
            window.open(assignment.questionFileUrl, '_blank'); // Opens the URL in a new tab
            toast({
                title: "Downloading...",
                description: `Initiating download for ${assignment.questionFileOriginalName || 'question file'}.`,
                variant: "default",
            });
        } else {
            toast({
                title: "No File",
                description: "No question file available for this assignment.",
                variant: "default",
            });
        }
    }, [assignment, toast]);

    // --- NEW: Handle submission file download ---
    const handleDownloadSubmission = useCallback(async (submissionId: string) => {
        try {
            // Your backend should have an endpoint like `/api/studentassignment/submission/download/:submissionId`
            // that serves the file.
            const response = await axios.get(`${API_BASE_URL}/studentassignment/submission/download/${submissionId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                responseType: 'blob', // Important: responseType must be 'blob' for file downloads
            });

            const submission = submissions.find(sub => sub._id === submissionId);
            const fileName = submission?.fileName || `submission_${submissionId}.pdf`; // Fallback filename

            // Create a Blob URL and trigger the download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName); // Set the download filename
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url); // Clean up the Blob URL

            toast({
                title: "Download Initiated",
                description: `Downloading "${fileName}"...`,
                variant: "default",
            });

        } catch (err) {
            console.error("Error downloading submission file:", err);
            if (axios.isAxiosError(err) && err.response) {
                toast({
                    title: "Download Failed",
                    description: err.response.data.error || "Could not download the submission file. Please try again.",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Download Failed",
                    description: "An unexpected error occurred during download.",
                    variant: "destructive",
                });
            }
        }
    }, [API_BASE_URL, toast, submissions]); // Add submissions to dependencies to find the filename


    if (loading) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-grow pt-24 pb-16 px-6">
                    <div className="container max-w-4xl mx-auto text-center">
                        <p className="text-lg text-muted-foreground">Loading assignment details...</p>
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
                    <div className="container max-w-4xl mx-auto text-center text-red-500">
                        <p className="text-lg">{error}</p>
                        <CustomButton
                            variant="outline"
                            onClick={fetchAssignmentDetails}
                            className="mt-4"
                        >
                            Retry
                        </CustomButton>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (!assignment) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-grow pt-24 pb-16 px-6">
                    <div className="container max-w-4xl mx-auto text-center">
                        <p className="text-lg text-muted-foreground">Assignment not found or invalid ID.</p>
                        <CustomButton
                            variant="outline"
                            onClick={() => navigate(`/student-course/${courseId}`)}
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

    // Determine the latest submission and its teacher remark for AssignmentDetails and TeachersRemark components
    const latestSubmission = submissions.length > 0 ? submissions[0] : null;


    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />

            <main className="flex-grow pt-24 pb-16 px-6">
                <div className="container max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 mb-8">
                        <CustomButton
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/student-course/${courseId}`)}
                            icon={<ArrowLeft className="h-4 w-4" />}
                        >
                            Back to Course
                        </CustomButton>
                        <div>
                            <h1 className="text-2xl font-bold">{assignment.title}</h1>
                            <p className="text-muted-foreground mt-1">{assignment.classroom.name}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        <div className="lg:col-span-2">
                            <AssignmentDetails
                                assignment={{
                                    id: assignment.assignmentId,
                                    title: assignment.title,
                                    description: assignment.description,
                                    deadline: new Date(assignment.deadline),
                                    type: assignment.type,
                                    submitted: assignment.submissionStatus === 'Submitted',
                                    submittedAt: assignment.submittedAt ? new Date(assignment.submittedAt) : undefined,
                                    submissionLate: assignment.submissionStatus === 'Submitted' && assignment.deadlinePassed,
                                    // Removed teacherRemark from here, as it's tied to submission, not assignment details
                                    questionFile: assignment.questionFileOriginalName ? { originalName: assignment.questionFileOriginalName } : undefined
                                }}
                                isPastDeadline={isPastDeadline}
                                onDownloadQuestionFile={handleDownloadQuestionFile}
                            />

                            {/* Pass teacher remark to TeachersRemark component from the latest submission */}
                            {latestSubmission?.teacherRemark && (
                                <TeachersRemark remark={latestSubmission.teacherRemark} />
                            )}

                            {/* Conditional rendering for ExamResult */}
                            {assignment.type === 'exam' && latestSubmission?.score !== undefined && (
                                <ExamResult submission={latestSubmission} />
                            )}

                            {/* Conditional rendering for FileUploader */}
                            {((assignment.submissionStatus === 'Pending') || (assignment.submissionStatus === 'Submitted' && assignment.canSubmitLate)) && (
                                <FileUploader
                                    isPastDeadline={isPastDeadline}
                                    onFileSelect={setSelectedFile}
                                    onSubmit={handleSubmit}
                                    selectedFile={selectedFile}
                                    isUploading={isUploading}
                                    submissionMessage={assignment.message}
                                />
                            )}

                            {/* Conditional rendering for PreviousSubmissions */}
                            {submissions.length > 0 && (
                                <PreviousSubmissions
                                    submissions={submissions.map(sub => ({
                                        // Map StudentSubmission to Submission for PreviousSubmissions component
                                        _id: sub._id, // Use _id as per updated PreviousSubmissions.tsx
                                        fileName: sub.fileName,
                                        fileSize: sub.fileSize,
                                        submittedAt: new Date(sub.submittedAt), // Convert to Date object
                                        status: sub.status,
                                        similarity: sub.plagiarismPercent, // Map plagiarismPercent to similarity
                                        late: sub.late,
                                        score: sub.score
                                    }))}
                                    assignmentType={assignment.type}
                                    onDownloadSubmission={handleDownloadSubmission} // Pass the new handler
                                />
                            )}
                        </div>

                        {/* SubmissionStatusSidebar */}
                        <div>
                            <SubmissionStatusSidebar
                                assignment={{
                                    id: assignment.assignmentId,
                                    title: assignment.title,
                                    deadline: new Date(assignment.deadline),
                                    submitted: assignment.submissionStatus === 'Submitted',
                                    submittedAt: assignment.submittedAt ? new Date(assignment.submittedAt) : undefined,
                                    type: assignment.type,
                                    submissionLate: assignment.submissionStatus === 'Submitted' && assignment.deadlinePassed,
                                }}
                                submissions={submissions.map(sub => ({
                                    // Map StudentSubmission to the expected type for SubmissionStatusSidebar
                                    _id: sub._id,
                                    fileName: sub.fileName,
                                    submittedAt: new Date(sub.submittedAt),
                                    status: sub.status,
                                    late: sub.late,
                                    fileSize: sub.fileSize,
                                    plagiarismPercent: sub.plagiarismPercent, // Ensure this is mapped correctly
                                    score: sub.score // Ensure score is passed for exams
                                }))}
                                submissionGuidelines={assignment.submissionGuidelines}
                                message={assignment.message}
                            />
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default StudentAssignmentView;