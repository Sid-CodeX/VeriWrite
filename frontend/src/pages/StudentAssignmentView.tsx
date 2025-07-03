import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CustomButton from '@/components/ui/CustomButton';

// Sub-components
import AssignmentDetails from '@/components/student/AssignmentDetails';
import ExamResult from '@/components/student/ExamResult';
import FileUploader from '@/components/student/FileUploader';
import PreviousSubmissions from '@/components/student/PreviousSubmissions';
import SubmissionStatusSidebar from '@/components/student/SubmissionStatusSidebar';
import TeachersRemark from '@/components/student/TeachersRemark'; // Ensure this path is correct

// INTERFACES
interface StudentSubmission {
    _id: string;
    fileName: string;
    fileSize: number;
    submittedAt: string;
    plagiarismPercent?: number | null;
    teacherRemark?: string | null; // Changed to allow null
    score?: number;
    markDistribution?: {
        section: string;
        maxMarks: number;
        scored: number;
    }[];
    status?: 'processing' | 'checked' | 'error'; // Keeping this as optional as per the error analysis
    late: boolean;
    submitted: boolean;
}

interface AssignmentDetailsResponse {
    latestSubmissionIsLate: boolean;
    assignmentId: string;
    classroom: {
        id: string;
        name: string;
    };
    title: string;
    description?: string;
    type: 'Assignment' | 'Exam';
    deadline: string;
    deadlinePassed: boolean;
    canSubmitLate: boolean;
    message: string;
    submissionGuidelines: string[];
    questionFile?: {
        originalName: string;
        contentType: string;
    };
    submissions: StudentSubmission[];
    submissionStatus: 'Submitted' | 'Pending' | 'Not Submitted' | 'Overdue' | 'Submitted (Late)';
    submittedAt: string | null;
    fileName: string | null;
    // Add these if they are consistently part of the main assignment object from the backend
    latestSubmissionTeacherRemark?: string | null; // Ensure this is available at the top level if used
    latestSubmissionPlagiarismPercent?: number | null; // Ensure this is available at the top level if used
}

// Ensure this matches the props expected by PreviousSubmissions component
// IMPORTANT: 'status' is now optional to resolve the TypeScript error.
interface PreviousSubmissionPropsType {
    _id: string;
    fileName: string;
    fileSize: number;
    submittedAt: Date;
    status?: 'processing' | 'checked' | 'error'; // Made optional to match the incoming data
    similarity?: number | null;
    late?: boolean;
    score?: number;
    teacherRemark?: string;
    submitted: boolean;
}

// Ensure this matches the props expected by AssignmentDetails component
interface AssignmentDetailsPropsType {
    id: string;
    title: string;
    deadline: Date;
    submitted: boolean;
    submittedAt?: Date;
    description?: string;
    type: 'Assignment' | 'Exam';
    submissionLate?: boolean;
    questionFile?: { originalName: string };
    onDownloadQuestionFile: () => void;
    onViewQuestionFile: () => void;
    isPastDeadline: boolean;
}


// Helper function for plagiarism classification
const getPlagiarismCategory = (percent: number | null | undefined): string => {
    if (percent === undefined || percent === null) {
        return "N/A";
    }
    if (percent >= 50) return "High";
    if (percent >= 20) return "Medium";
    return "Low";
};


const StudentAssignmentView: React.FC = () => {
    const { courseId, assignmentId } = useParams<{ courseId: string; assignmentId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user } = useAuth();

    const [assignment, setAssignment] = useState<AssignmentDetailsResponse | null>(null);
    const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [questionFileDisplayName, setQuestionFileDisplayName] = useState<string | undefined>(undefined);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const getAuthToken = useCallback(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn("No authentication token found in localStorage.");
            toast({
                title: "Authentication Missing",
                description: "Please log in to view assignment details.",
                variant: "destructive",
            });
        }
        return token;
    }, [toast]);

    const fetchAssignmentDetails = useCallback(async () => {
        const token = getAuthToken();
        if (!token) {
            setError("Authentication required. Please log in.");
            setLoading(false);
            navigate('/login');
            return;
        }

        if (!user || !assignmentId) {
            setError("User or assignment ID missing. Cannot fetch details.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await axios.get<AssignmentDetailsResponse>(
                `${API_BASE_URL}/api/studentassignment/${assignmentId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = response.data;
            setAssignment(data);
            // Filter out submissions that are not truly submitted
            // and sort them by submission time (most recent first)
            const filteredAndSortedSubmissions = (data.submissions || [])
                .filter(s => s.submitted && s.submittedAt && new Date(s.submittedAt).getTime() > 0)
                .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

            setSubmissions(filteredAndSortedSubmissions);

            if (data.questionFile && data.questionFile.originalName) {
                setQuestionFileDisplayName(data.questionFile.originalName);
            } else {
                setQuestionFileDisplayName(undefined);
            }

        } catch (err) {
            console.error("Error fetching assignment details:", err);
            if (axios.isAxiosError(err) && err.response) {
                const errorMessage = err.response.data.error || `Failed to load assignment details: ${err.response.statusText}`;
                setError(errorMessage);
                toast({
                    title: "Error",
                    description: errorMessage,
                    variant: "destructive",
                });
                if (err.response.status === 401 || err.response.status === 403) {
                    navigate('/login');
                }
            } else {
                setError("Failed to load assignment details. Please try again.");
                toast({
                    title: "Error",
                    description: "Failed to load assignment details. Please try again.",
                    variant: "destructive",
                });
            }
        } finally {
            setLoading(false);
        }
    }, [user, assignmentId, toast, API_BASE_URL, getAuthToken, navigate]);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchAssignmentDetails();
    }, [fetchAssignmentDetails]);

    const handleDownloadQuestionFile = useCallback(async () => {
        if (!assignmentId || !questionFileDisplayName) {
            toast({
                title: "No File",
                description: "No question file available for this assignment.",
                variant: "default",
            });
            return;
        }

        try {
            const token = getAuthToken();
            if (!token) {
                toast({
                    title: "Authentication Required",
                    description: "Please log in to download the file.",
                    variant: "destructive",
                });
                navigate('/login');
                return;
            }

            const response = await axios.get(
                `${API_BASE_URL}/api/studentassignment/download-question/${assignmentId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    responseType: 'blob',
                }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', questionFileDisplayName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast({
                title: "Downloading...",
                description: `Initiating download for ${questionFileDisplayName}.`,
                variant: "default",
            });

        } catch (err) {
            console.error("Error downloading question file:", err);
            if (axios.isAxiosError(err) && err.response) {
                const errorMessage = err.response.data.error || "Could not download the question file. Please try again.";
                toast({
                    title: "Download Failed",
                    description: errorMessage,
                    variant: "destructive",
                });
                if (err.response.status === 401 || err.response.status === 403) {
                    navigate('/login');
                }
            } else {
                toast({
                    title: "Download Failed",
                    description: "An unexpected error occurred during download.",
                    variant: "destructive",
                });
            }
        }
    }, [assignmentId, questionFileDisplayName, toast, API_BASE_URL, getAuthToken, navigate]);

    const handleViewQuestionFile = useCallback(async () => {
        if (!assignmentId || !questionFileDisplayName || !assignment?.questionFile?.contentType) {
            toast({
                title: "No File",
                description: "No question file available for viewing or content type is missing.",
                variant: "default",
            });
            return;
        }

        try {
            const token = getAuthToken();
            if (!token) {
                toast({
                    title: "Authentication Required",
                    description: "Please log in to view the file.",
                    variant: "destructive",
                });
                navigate('/login');
                return;
            }

            const response = await axios.get(
                `${API_BASE_URL}/api/studentassignment/view-question/${assignmentId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    responseType: 'blob',
                }
            );

            const contentType = response.headers['content-type'] || assignment.questionFile.contentType;
            const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
            window.open(url, '_blank');
            setTimeout(() => window.URL.revokeObjectURL(url), 1000 * 60);

            toast({
                title: "Opening...",
                description: `Opening ${questionFileDisplayName} in a new tab.`,
                variant: "default",
            });

        } catch (err) {
            console.error("Error viewing question file:", err);
            if (axios.isAxiosError(err) && err.response) {
                const errorMessage = err.response.data.error || "Could not open the question file for viewing. Please try again.";
                toast({
                    title: "View Failed",
                    description: errorMessage,
                    variant: "destructive",
                });
                if (err.response.status === 401 || err.response.status === 403) {
                    navigate('/login');
                }
            } else {
                toast({
                    title: "View Failed",
                    description: "An unexpected error occurred while trying to view the file.",
                    variant: "destructive",
                });
            }
        }
    }, [assignmentId, questionFileDisplayName, assignment?.questionFile?.contentType, toast, API_BASE_URL, getAuthToken, navigate]);


    const handleSubmit = async () => {
        const token = getAuthToken();
        if (!token) {
            toast({
                title: "Authentication Required",
                description: "Please log in to submit your assignment.",
                variant: "destructive",
            });
            navigate('/login');
            return;
        }

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

        try {
            const uploadResponse = await axios.post(
                `${API_BASE_URL}/api/studentassignment/${assignment.assignmentId}/submit`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            toast({
                title: "Submission successful",
                description: uploadResponse.data.message || "Your file has been uploaded successfully.",
                variant: "default",
            });

            // Re-fetch details to update submission status and display latest submission
            fetchAssignmentDetails();

        } catch (err) {
            console.error("Error submitting file:", err);
            if (axios.isAxiosError(err) && err.response) {
                const errorMessage = err.response.data.error || "Failed to upload your file. Please try again.";
                toast({
                    title: "Submission failed",
                    description: errorMessage,
                    variant: "destructive",
                });
                if (err.response.status === 401 || err.response.status === 403) {
                    navigate('/login');
                }
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

    // Removed handleDownloadSubmission as it's no longer used or passed to PreviousSubmissions

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
                        <CustomButton
                            variant="link"
                            onClick={() => navigate('/login')}
                            className="mt-2"
                        >
                            Go to Login
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

    const validSubmittedAtDate = assignment.submittedAt && typeof assignment.submittedAt === 'string' && assignment.submittedAt.trim() !== ''
        ? new Date(assignment.submittedAt)
        : undefined;

    const assignmentDetailsProps: AssignmentDetailsPropsType = {
        id: assignment.assignmentId,
        title: assignment.title,
        description: assignment.description,
        deadline: new Date(assignment.deadline),
        submitted: assignment.submissionStatus.includes('Submitted'),
        submittedAt: validSubmittedAtDate,
        submissionLate: assignment.latestSubmissionIsLate,
        questionFile: questionFileDisplayName ? { originalName: questionFileDisplayName } : undefined,
        onDownloadQuestionFile: handleDownloadQuestionFile,
        onViewQuestionFile: handleViewQuestionFile,
        isPastDeadline: assignment.deadlinePassed,
        type: assignment.type,
    };

    const filteredAndMappedSubmissions: PreviousSubmissionPropsType[] = submissions.map(sub => ({
        _id: sub._id,
        fileName: sub.fileName,
        fileSize: typeof sub.fileSize === 'number' ? sub.fileSize : 0,
        submittedAt: new Date(sub.submittedAt),
        status: sub.status, // This is now correctly handled as optional in PreviousSubmissionPropsType
        similarity: sub.plagiarismPercent,
        late: sub.late,
        score: sub.score,
        teacherRemark: sub.teacherRemark || undefined,
        submitted: sub.submitted,
    }));

    const latestSubmission = submissions.length > 0
        ? submissions[0]
        : undefined;

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
                                assignment={assignmentDetailsProps}
                                isPastDeadline={assignment.deadlinePassed}
                                onDownloadQuestionFile={handleDownloadQuestionFile}
                                onViewQuestionFile={handleViewQuestionFile}
                            />

                            {/* Display Plagiarism Percentage and Category for latest submission */}
                            {latestSubmission && typeof latestSubmission.plagiarismPercent === 'number' && (
                                <div className="mb-6 p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-800">
                                    <h3 className="text-lg font-semibold mb-2">Plagiarism Report</h3>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        Plagiarism Percentage: <span className="font-medium">{latestSubmission.plagiarismPercent.toFixed(2)}%</span> (
                                        <span className={`font-semibold ${
                                            getPlagiarismCategory(latestSubmission.plagiarismPercent) === 'High' ? 'text-red-600' :
                                            getPlagiarismCategory(latestSubmission.plagiarismPercent) === 'Medium' ? 'text-yellow-600' :
                                            'text-green-600'
                                        }`}>
                                            {getPlagiarismCategory(latestSubmission.plagiarismPercent)}
                                        </span>)
                                    </p>
                                </div>
                            )}

                            {/* Only show TeachersRemark if there's a valid latest submission */}
                            {latestSubmission && (
                                <TeachersRemark remark={latestSubmission.teacherRemark || "No remarks"} />
                            )}

                            {/* Only show ExamResult if it's an Exam and there's a valid latest submission with a score */}
                            {assignment.type === 'Exam' && latestSubmission && typeof latestSubmission.score === 'number' && (
                                <ExamResult submission={latestSubmission} />
                            )}

                            {/* FileUploader component */}
                            <FileUploader
                                isPastDeadline={assignment.deadlinePassed}
                                canSubmitLate={assignment.canSubmitLate}
                                onFileSelect={setSelectedFile}
                                onSubmit={handleSubmit}
                                selectedFile={selectedFile}
                                isUploading={isUploading}
                                submissionMessage={assignment.message}
                            />

                            {/* Conditionally render PreviousSubmissions ONLY if there are valid, filtered submissions */}
                            {filteredAndMappedSubmissions.length > 0 && (
                                <PreviousSubmissions
                                    submissions={filteredAndMappedSubmissions}
                                    assignmentType={assignment.type}
                                    // onDownloadSubmission is removed as per your request
                                />
                            )}
                        </div>

                        <div>
                            <SubmissionStatusSidebar
                                assignment={assignmentDetailsProps}
                                submissions={filteredAndMappedSubmissions}
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