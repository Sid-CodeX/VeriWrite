import React, { useState, useEffect } from 'react'; // Added useEffect for textarea and useState for remark
import { X, Download, Copy, ExternalLink, AlertCircle, BarChart, FileText, ListChecks, Save } from 'lucide-react'; // Added Save icon
import CustomButton from '@/components/ui/CustomButton';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import axios from 'axios'; // Import axios for API call

// Define the API base URL from your environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// --- Interfaces (Consider moving these to a shared types file like src/types/plagiarism.ts or similar) ---
interface MatchDetail {
    matchedStudentId: string;
    matchedText: string;
    plagiarismPercent: number;
    name?: string; // Add optional name
    email?: string; // Add optional email
}

interface AllMatchEntry {
    matchedStudentId: string;
    plagiarismPercent: number;
    name?: string; // Add optional name
    email?: string; // Add optional email
}

interface StudentReportData { // Renamed from 'Student' to avoid confusion with AuthContext's User
    studentUserId: string; // This corresponds to User._id
    name: string;
    email: string;
    submissionDate: Date | null;
    documentName: string | null;
    plagiarismScore: number | null;
    reportGenerated: boolean;
    extractedText: string | null;
    wordCount: number;
    topMatches: MatchDetail[];
    allMatches: AllMatchEntry[];
    teacherRemark: string; // Added teacherRemark to the interface
    assignmentId: string; // Added assignmentId so we can pass it for the API call
}

interface PlagiarismReportModalProps {
    student: StudentReportData; // Use the new interface name
    assignmentTitle: string;
    assignmentType: 'Assignment' | 'Exam';
    onClose: () => void;
    onDownloadReport: () => void;
    isGeneratingPdf: boolean;
    // New prop to trigger a refresh in the parent AssignmentView
    onRemarkUpdated: (studentId: string, newRemark: string) => void;
}

const PlagiarismReportModal: React.FC<PlagiarismReportModalProps> = ({
    student,
    assignmentTitle,
    assignmentType,
    onClose,
    onDownloadReport,
    isGeneratingPdf,
    onRemarkUpdated, // Destructure new prop
}) => {
    const { toast } = useToast();
    const [currentRemark, setCurrentRemark] = useState(student.teacherRemark || 'No remarks'); // State for the remark
    const [isSavingRemark, setIsSavingRemark] = useState(false); // Loading state for saving remark

    // Update local state if the remark prop changes (e.g., parent re-fetches data)
    useEffect(() => {
        setCurrentRemark(student.teacherRemark || 'No remarks');
    }, [student.teacherRemark]);


    const handleCopyText = (text: string | null) => {
        if (text) {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                toast({
                    title: "Copied!",
                    description: "Extracted text copied to clipboard.",
                });
            } catch (err) {
                console.error('Failed to copy text using execCommand:', err);
                toast({
                    title: "Failed to Copy",
                    description: "Could not copy text to clipboard.",
                    variant: "destructive",
                });
            } finally {
                document.body.removeChild(textArea);
            }
        } else {
            toast({
                title: "No Text to Copy",
                description: "There is no extracted text available for this submission.",
                variant: "destructive",
            });
        }
    };

    const getPlagiarismScoreColor = (score: number | null) => {
        if (score === null) return 'text-gray-500'; // Not checked or unavailable
        if (score <= 40) return 'text-green-600';
        if (score <= 60) return 'text-amber-600';
        if (score <= 80) return 'text-orange-600';
        return 'text-red-600';
    };

    const renderHighlightedText = (originalText: string, matches: MatchDetail[]) => {
        if (!originalText || matches.length === 0) return originalText;

        let segments: (string | JSX.Element)[] = [originalText];

        matches.forEach(match => {
            const newSegments: (string | JSX.Element)[] = [];
            const matchLower = match.matchedText.toLowerCase();

            segments.forEach(segment => {
                if (typeof segment === 'string') {
                    let lastIndex = 0;
                    let matchStartIndex;
                    const segmentLower = segment.toLowerCase();

                    while ((matchStartIndex = segmentLower.indexOf(matchLower, lastIndex)) !== -1) {
                        const matchEndIndex = matchStartIndex + match.matchedText.length;

                        if (matchStartIndex > lastIndex) {
                            newSegments.push(segment.substring(lastIndex, matchStartIndex));
                        }

                        newSegments.push(
                            <mark
                                key={`${match.matchedStudentId}-${matchStartIndex}`}
                                title={`Matched with: ${match.name || 'Unknown Student'} (${match.plagiarismPercent}%)`}
                                className="bg-red-300 dark:bg-red-700/50 rounded px-0.5"
                            >
                                {segment.substring(matchStartIndex, matchEndIndex)}
                            </mark>
                        );
                        lastIndex = matchEndIndex;
                    }
                    if (lastIndex < segment.length) {
                        newSegments.push(segment.substring(lastIndex));
                    }
                } else {
                    newSegments.push(segment);
                }
            });
            segments = newSegments;
        });

        return <>{segments}</>;
    };

    const handleSaveRemark = async () => {
        setIsSavingRemark(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast({ title: "Auth Error", description: "No token found. Please log in.", variant: "destructive" });
                return;
            }

            // --- API Call to update remark (Placeholder for now) ---
            const response = await axios.put(`${API_BASE_URL}/api/assignment/submission/remark/${student.assignmentId}/${student.studentUserId}`,
                { teacherRemark: currentRemark },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.status === 200) {
                toast({ title: "Success", description: "Teacher remark saved successfully!", variant: "success" });
                // Call the prop to notify parent to re-fetch or update its state
                onRemarkUpdated(student.studentUserId, currentRemark);
            } else {
                toast({ title: "Error", description: response.data?.error || "Failed to save remark.", variant: "destructive" });
            }

        } catch (error: any) {
            console.error("Error saving remark:", error);
            toast({ title: "Error", description: error.response?.data?.error || "An error occurred while saving remark.", variant: "destructive" });
        } finally {
            setIsSavingRemark(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div
                className="relative w-full max-w-4xl max-h-[90vh] bg-background border border-border rounded-lg shadow-2xl flex flex-col animate-scale-in-content overflow-hidden"
            >
                <div className="flex justify-between items-center p-5 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <BarChart className="h-6 w-6 text-primary" />
                        Plagiarism Report
                        <span className={`text-sm ml-2 px-2 py-0.5 rounded-full ${
                            assignmentType === 'Exam'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                        }`}>
                            {assignmentType === 'Exam' ? 'Exam' : 'Assignment'}
                        </span>
                    </h2>
                    <CustomButton variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-6 w-6" />
                    </CustomButton>
                </div>

                <div className="p-6 overflow-y-auto flex-grow text-sm custom-scrollbar">
                    {/* Report Summary */}
                    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-muted/30 p-4 rounded-lg">
                            <h3 className="font-semibold text-base mb-2">Submission Details</h3>
                            <p className="text-muted-foreground"><strong>Student:</strong> {student.name}</p>
                            <p className="text-muted-foreground"><strong>Email:</strong> {student.email}</p>
                            <p className="text-muted-foreground"><strong>Assignment:</strong> {assignmentTitle}</p>
                            <p className="text-muted-foreground"><strong>Submitted:</strong> {student.submissionDate ? format(new Date(student.submissionDate), 'MMM d,yyyy HH:mm') : 'N/A'}</p>
                            <p className="text-muted-foreground"><strong>Document:</strong> {student.documentName || 'N/A'}</p>
                            <p className="text-muted-foreground"><strong>Word Count:</strong> {student.wordCount !== null ? student.wordCount : 'N/A'}</p>
                        </div>
                        <div className="bg-muted/30 p-4 rounded-lg flex flex-col justify-between">
                            <div>
                                <h3 className="font-semibold text-base mb-2">Plagiarism Score</h3>
                                <p className={`text-5xl font-bold ${getPlagiarismScoreColor(student.plagiarismScore)}`}>
                                    {student.plagiarismScore !== null ? `${student.plagiarismScore}%` : 'N/A'}
                                </p>
                                {student.plagiarismScore === null && (
                                    <p className="text-sm text-muted-foreground flex items-center mt-2">
                                        <AlertCircle className="h-4 w-4 mr-1 text-amber-500" /> Report not fully generated or available.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Teacher Remark Section */}
                    <div className="mb-6 bg-muted/30 p-4 rounded-lg">
                        <h3 className="font-semibold text-lg mb-3 flex items-center">
                            <ListChecks className="h-5 w-5 mr-2 text-primary" /> Teacher's Remark
                        </h3>
                        <textarea
                            className="w-full p-3 border border-border rounded-md bg-background text-foreground focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                            rows={4}
                            placeholder="Add your remark here..."
                            value={currentRemark}
                            onChange={(e) => setCurrentRemark(e.target.value)}
                        />
                        <div className="flex justify-end mt-4">
                            <CustomButton
                                onClick={handleSaveRemark}
                                loading={isSavingRemark}
                                disabled={isSavingRemark}
                                icon={<Save className="h-4 w-4" />}
                            >
                                {isSavingRemark ? 'Saving...' : 'Save Remark'}
                            </CustomButton>
                        </div>
                    </div>

                    {/* Top Matches - Displaying Name and Email (already done, just confirming backend data) */}
                    <div className="mb-6">
                        <h3 className="font-semibold text-lg mb-3 flex items-center">
                            <ExternalLink className="h-5 w-5 mr-2 text-primary" /> Top Plagiarism Matches
                        </h3>
                        {student.topMatches && student.topMatches.length > 0 ? (
                            <ul className="space-y-3">
                                {student.topMatches.map((match, index) => (
                                    <li key={index} className="p-3 bg-card rounded-lg border border-border">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-medium">
                                                Match with: {match.name || 'Unknown Student'} ({match.email || 'N/A'})
                                            </span>
                                            <span className={`font-bold ${getPlagiarismScoreColor(match.plagiarismPercent)}`}>
                                                {match.plagiarismPercent}%
                                            </span>
                                        </div>
                                        <div className="bg-muted/50 p-2 rounded text-xs break-words whitespace-pre-wrap max-h-[150px] overflow-y-auto custom-scrollbar">
                                            <p className="font-mono text-muted-foreground">{match.matchedText}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-muted-foreground">No significant matches found in top results.</p>
                        )}
                    </div>

                    {/* Submitted Text with Highlights */}
                    <div className="mb-6">
                        <h3 className="font-semibold text-lg mb-3 flex items-center">
                            <FileText className="h-5 w-5 mr-2 text-primary" /> Submitted Text
                        </h3>
                        {student.extractedText ? (
                            <div className="relative bg-muted/30 p-4 rounded-lg border border-border">
                                <div className="absolute top-2 right-2 flex gap-2">
                                    <CustomButton
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleCopyText(student.extractedText)}
                                        aria-label="Copy text"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </CustomButton>
                                </div>
                                <div className="text-sm break-words whitespace-pre-wrap max-h-[300px] overflow-y-auto custom-scrollbar pr-10">
                                    {renderHighlightedText(student.extractedText, student.topMatches || [])}
                                </div>
                            </div>
                        ) : (
                            <p className="text-muted-foreground">No extracted text available for this submission.</p>
                        )}
                    </div>

                    {/* NEW: All Matches Table */}
                    <div className="mb-6">
                        <h3 className="font-semibold text-lg mb-3 flex items-center">
                            <ListChecks className="h-5 w-5 mr-2 text-primary" /> All Plagiarism Matches
                        </h3>
                        {student.allMatches && student.allMatches.length > 0 ? (
                            <div className="overflow-x-auto custom-scrollbar rounded-lg border border-border">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-muted/50 uppercase text-muted-foreground sticky top-0 z-10">
                                        <tr>
                                            <th scope="col" className="px-4 py-3">Student Name</th>
                                            <th scope="col" className="px-4 py-3">Student Email</th>
                                            <th scope="col" className="px-4 py-3 text-right">Plagiarism %</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {student.allMatches.map((match, index) => (
                                            <tr key={index} className="bg-card border-b border-border hover:bg-muted/30">
                                                <td className="px-4 py-3 font-medium text-foreground">
                                                    {match.name || 'Unknown Student'}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {match.email || 'N/A'}
                                                </td>
                                                <td className={`px-4 py-3 text-right font-bold ${getPlagiarismScoreColor(match.plagiarismPercent)}`}>
                                                    {match.plagiarismPercent}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-muted-foreground">No additional matches found beyond top results (or no submissions to compare against).</p>
                        )}
                    </div>

                </div> {/* End of scrollable content */}

                <div className="flex justify-end p-4 border-t border-border bg-background/90 backdrop-blur-sm gap-3">
                    <CustomButton
                        variant="outline"
                        onClick={onClose}
                    >
                        Close
                    </CustomButton>
                    <CustomButton
                        icon={<Download className="h-4 w-4" />}
                        onClick={onDownloadReport}
                        loading={isGeneratingPdf}
                        disabled={isGeneratingPdf}
                    >
                        {isGeneratingPdf ? 'Downloading...' : 'Download PDF'}
                    </CustomButton>
                </div>
            </div>
        </div>
    );
};

export default PlagiarismReportModal;
