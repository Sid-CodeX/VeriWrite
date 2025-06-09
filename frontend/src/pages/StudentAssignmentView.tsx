import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CustomButton from '@/components/ui/CustomButton';

// Import your sub-components
import AssignmentDetails from '@/components/student/AssignmentDetails';
import ExamResult from '@/components/student/ExamResult';
import FileUploader from '@/components/student/FileUploader';
import PreviousSubmissions from '@/components/student/PreviousSubmissions';
import SubmissionStatusSidebar from '@/components/student/SubmissionStatusSidebar';
import TeachersRemark from '@/components/student/TeachersRemark';

// --- REVISED INTERFACES (Ensure these are correct and align with backend) ---
interface StudentSubmission {
    _id: string;
    fileName: string;
    fileSize: number;
    submittedAt: string; // Keep as string from backend, convert to Date when needed
    plagiarismPercent?: number;
    teacherRemark?: string;
    score?: number;
    markDistribution?: {
        section: string;
        maxMarks: number;
        scored: number;
    }[];
    status: 'processing' | 'checked' | 'error';
    late: boolean;
    submitted: boolean;
}

interface AssignmentDetailsResponse {
    late?: boolean; // Added late here, as it might be directly on the assignment object for overall status
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
    submissions: StudentSubmission[]; // This array comes directly from backend
    submissionStatus: 'Submitted' | 'Pending' | 'Not Submitted' | 'Overdue';
    submittedAt: string | null; // This will be from the latest valid submission
    fileName: string | null; // This will be from the latest valid submission
}

// Interface for PreviousSubmissions component (expects Date objects)
interface PreviousSubmissionPropsType {
    _id: string;
    fileName: string;
    fileSize: number;
    submittedAt: Date; // Converted to Date for child component
    status: 'processing' | 'checked' | 'error';
    similarity?: number;
    late?: boolean;
    score?: number;
    teacherRemark?: string;
    submitted: boolean;
}

// Interface for AssignmentDetails component (expects Date objects)
interface AssignmentDetailsPropsType {
    id: string;
    title: string;
    deadline: Date;
    submitted: boolean;
    submittedAt?: Date;
    description?: string;
    type: 'Assignment' | 'Exam';
    submissionLate?: boolean; // Renamed from late to submissionLate for clarity in this specific prop
    questionFile?: { originalName: string };
    onDownloadQuestionFile: () => void;
    onViewQuestionFile: () => void;
    isPastDeadline: boolean;
}

const StudentAssignmentView: React.FC = () => {
    const { courseId, assignmentId } = useParams<{ courseId: string; assignmentId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user } = useAuth(); // Ensure user object has `id` property

    const [assignment, setAssignment] = useState<AssignmentDetailsResponse | null>(null);
    const [submissions, setSubmissions] = useState<StudentSubmission[]>([]); // This state holds raw backend submissions
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [questionFileDisplayName, setQuestionFileDisplayName] = useState<string | undefined>(undefined);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    // Memoize getAuthToken to prevent unnecessary re-renders or re-creations
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
            navigate('/login'); // Redirect to login if token is missing
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
                `${API_BASE_URL}/studentassignment/${assignmentId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = response.data;
            setAssignment(data);
            setSubmissions(data.submissions || []);

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
                `${API_BASE_URL}/studentassignment/download-question/${assignmentId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    responseType: 'blob', 
                }
            );

            // Create a URL for the blob and trigger download
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
                `${API_BASE_URL}/studentassignment/view-question/${assignmentId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    responseType: 'blob', 
                }
            );

            // Use the content-type from the response header if available, otherwise fallback
            const contentType = response.headers['content-type'] || assignment.questionFile.contentType;
            const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
            window.open(url, '_blank');
            // A small timeout helps ensure the new tab has time to load the content before revocation.
            setTimeout(() => window.URL.revokeObjectURL(url), 1000 * 60); // Revoke after 1 minute

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

        if (!user?.id) {
            toast({
                title: "User ID Missing",
                description: "Could not identify your user ID for submission.",
                variant: "destructive",
            });
            return;
        }

        setIsUploading(true);

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('assignmentId', assignment.assignmentId);
        formData.append('studentId', user.id); 

        try {
            const uploadResponse = await axios.post(`${API_BASE_URL}/studentassignment/submit`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                },
            });

            toast({
                title: "Submission successful",
                description: uploadResponse.data.message || "Your file has been uploaded successfully.",
                variant: "default",
            });

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

    const handleDownloadSubmission = useCallback(async (submissionId: string) => {
        try {
            const token = getAuthToken();
            if (!token) {
                toast({
                    title: "Authentication Required",
                    description: "Please log in to download submissions.",
                    variant: "destructive",
                });
                navigate('/login');
                return;
            }

            const response = await axios.get(`${API_BASE_URL}/studentassignment/submission/download/${submissionId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                responseType: 'blob',
            });

            const submission = submissions.find(sub => sub._id === submissionId);
            const fileName = submission?.fileName || `submission_${submissionId}.pdf`;

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast({
                title: "Download Initiated",
                description: `Downloading "${fileName}"...`,
                variant: "default",
            });

        } catch (err) {
            console.error("Error downloading submission file:", err);
            if (axios.isAxiosError(err) && err.response) {
                const errorMessage = err.response.data.error || "Could not download the submission file. Please try again.";
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
    }, [API_BASE_URL, toast, submissions, getAuthToken, navigate]);

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
        submitted: assignment.submissionStatus === 'Submitted',
        submittedAt: validSubmittedAtDate,
        submissionLate: assignment.submissionStatus === 'Submitted' && assignment.deadlinePassed && assignment.late, // Assuming 'late' directly from assignment response if available for latest submission
        questionFile: questionFileDisplayName ? { originalName: questionFileDisplayName } : undefined,
        onDownloadQuestionFile: handleDownloadQuestionFile,
        onViewQuestionFile: handleViewQuestionFile,
        isPastDeadline: assignment.deadlinePassed,
        type: assignment.type,
    };

    // Filter and map submissions for components
    const filteredAndMappedSubmissions: PreviousSubmissionPropsType[] = submissions
        .filter(sub => sub.submitted && sub.fileName && new Date(sub.submittedAt).getTime() > 0) // Filter out truly unsubmitted and invalid date entries
        .map(sub => ({
            _id: sub._id,
            fileName: sub.fileName,
            fileSize: typeof sub.fileSize === 'number' ? sub.fileSize : 0,
            submittedAt: new Date(sub.submittedAt),
            status: sub.status,
            similarity: sub.plagiarismPercent,
            late: sub.late,
            score: sub.score,
            teacherRemark: sub.teacherRemark,
            submitted: sub.submitted,
        }));

    // Sort the filtered submissions to ensure the latest is at the top
    filteredAndMappedSubmissions.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());

    const latestSubmission = filteredAndMappedSubmissions.length > 0
        ? filteredAndMappedSubmissions[0]
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

                            {/* Only show TeachersRemark if there's a valid latest submission with a non-empty remark */}
                            {latestSubmission && latestSubmission.teacherRemark && latestSubmission.teacherRemark !== "No remarks" && (
                                <TeachersRemark remark={latestSubmission.teacherRemark} />
                            )}

                            {/* Only show ExamResult if it's an Exam and there's a valid latest submission with a score */}
                            {assignment.type === 'Exam' && latestSubmission && typeof latestSubmission.score === 'number' && (
                                <ExamResult submission={latestSubmission} />
                            )}

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
                                    onDownloadSubmission={handleDownloadSubmission}
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
