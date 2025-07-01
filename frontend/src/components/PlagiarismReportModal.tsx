import React, { useState, useEffect } from 'react';
import {
    X, Download, Copy, ExternalLink, AlertCircle, BarChart, FileText, ListChecks, Save
} from 'lucide-react';
import CustomButton from '@/components/ui/CustomButton';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import axios from 'axios';

// Base API URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ---------------------- Interfaces ----------------------

// Represents a top match detail between students
interface MatchDetail {
    matchedStudentId: string;
    matchedText: string;
    plagiarismPercent: number;
    name?: string;
    email?: string;
}

// Represents a row entry in the "all matches" table
interface AllMatchEntry {
    matchedStudentId: string;
    plagiarismPercent: number;
    name?: string;
    email?: string;
}

// Represents a student plagiarism report structure
interface StudentReportData {
    studentUserId: string;
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
    teacherRemark: string;
    assignmentId: string;
}

// Props for the plagiarism modal component
interface PlagiarismReportModalProps {
    student: StudentReportData;
    assignmentTitle: string;
    assignmentType: 'Assignment' | 'Exam';
    onClose: () => void;
    onDownloadReport: () => void;
    isGeneratingPdf: boolean;
    onRemarkUpdated: (studentId: string, newRemark: string) => void;
}

// ---------------------- Main Component ----------------------

const PlagiarismReportModal: React.FC<PlagiarismReportModalProps> = ({
    student,
    assignmentTitle,
    assignmentType,
    onClose,
    onDownloadReport,
    isGeneratingPdf,
    onRemarkUpdated,
}) => {
    const { toast } = useToast();

    // Local state for teacher's remark and loading state
    const [currentRemark, setCurrentRemark] = useState(student.teacherRemark || 'No remarks');
    const [isSavingRemark, setIsSavingRemark] = useState(false);

    // Update remark state when prop changes (e.g., on parent re-fetch)
    useEffect(() => {
        setCurrentRemark(student.teacherRemark || 'No remarks');
    }, [student.teacherRemark]);

    // Copies extracted text to clipboard
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
                console.error('Copy failed:', err);
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
                description: "No extracted text available.",
                variant: "destructive",
            });
        }
    };

    // Returns tailwind class for color-coded plagiarism score
    const getPlagiarismScoreColor = (score: number | null) => {
        if (score === null) return 'text-gray-500';
        if (score <= 40) return 'text-green-600';
        if (score <= 60) return 'text-amber-600';
        if (score <= 80) return 'text-orange-600';
        return 'text-red-600';
    };

    // Highlights matched text segments inside the original submission
    const renderHighlightedText = (originalText: string, matches: MatchDetail[]) => {
        if (!originalText || matches.length === 0) return originalText;

        let segments: (string | JSX.Element)[] = [originalText];

        matches.forEach(match => {
            const matchLower = match.matchedText.toLowerCase();
            const newSegments: (string | JSX.Element)[] = [];

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
                                title={`Matched with: ${match.name || 'Unknown'} (${match.plagiarismPercent}%)`}
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

    // Handles saving the teacher's remark to the backend
    const handleSaveRemark = async () => {
        setIsSavingRemark(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast({
                    title: "Auth Error",
                    description: "No token found. Please log in.",
                    variant: "destructive"
                });
                return;
            }

            const response = await axios.put(
                `${API_BASE_URL}/api/assignment/submission/remark/${student.assignmentId}/${student.studentUserId}`,
                { teacherRemark: currentRemark },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.status === 200) {
                toast({
                    title: "Success",
                    description: "Remark saved successfully.",
                    variant: "success"
                });
                onRemarkUpdated(student.studentUserId, currentRemark);
            } else {
                toast({
                    title: "Error",
                    description: response.data?.error || "Failed to save remark.",
                    variant: "destructive"
                });
            }
        } catch (error: any) {
            console.error("Save remark error:", error);
            toast({
                title: "Error",
                description: error.response?.data?.error || "An error occurred while saving the remark.",
                variant: "destructive"
            });
        } finally {
            setIsSavingRemark(false);
        }
    };

    // ---------------------- Render JSX ----------------------

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-4xl max-h-[90vh] bg-background border border-border rounded-lg shadow-2xl flex flex-col animate-scale-in-content overflow-hidden">

                {/* Modal Header */}
                <div className="flex justify-between items-center p-5 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <BarChart className="h-6 w-6 text-primary" />
                        Plagiarism Report
                        <span className={`text-sm ml-2 px-2 py-0.5 rounded-full ${
                            assignmentType === 'Exam'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                        }`}>
                            {assignmentType}
                        </span>
                    </h2>
                    <CustomButton variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-6 w-6" />
                    </CustomButton>
                </div>

                {/* Scrollable Modal Content */}
                <div className="p-6 overflow-y-auto flex-grow text-sm custom-scrollbar">

                    {/* Submission Info & Plagiarism Score */}
                    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Submission Details */}
                        <div className="bg-muted/30 p-4 rounded-lg">
                            <h3 className="font-semibold text-base mb-2">Submission Details</h3>
                            <p><strong>Student:</strong> {student.name}</p>
                            <p><strong>Email:</strong> {student.email}</p>
                            <p><strong>Assignment:</strong> {assignmentTitle}</p>
                            <p><strong>Submitted:</strong> {student.submissionDate ? format(new Date(student.submissionDate), 'MMM d, yyyy HH:mm') : 'N/A'}</p>
                            <p><strong>Document:</strong> {student.documentName || 'N/A'}</p>
                            <p><strong>Word Count:</strong> {student.wordCount ?? 'N/A'}</p>
                        </div>

                        {/* Plagiarism Score */}
                        <div className="bg-muted/30 p-4 rounded-lg">
                            <h3 className="font-semibold text-base mb-2">Plagiarism Score</h3>
                            <p className={`text-5xl font-bold ${getPlagiarismScoreColor(student.plagiarismScore)}`}>
                                {student.plagiarismScore !== null ? `${student.plagiarismScore}%` : 'N/A'}
                            </p>
                            {student.plagiarismScore === null && (
                                <p className="text-sm text-muted-foreground mt-2 flex items-center">
                                    <AlertCircle className="h-4 w-4 mr-1 text-amber-500" />
                                    Report not generated or unavailable.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Teacher Remark Editor */}
                    <div className="mb-6 bg-muted/30 p-4 rounded-lg">
                        <h3 className="font-semibold text-lg mb-3 flex items-center">
                            <ListChecks className="h-5 w-5 mr-2 text-primary" /> Teacher's Remark
                        </h3>
                        <textarea
                            className="w-full p-3 border border-border rounded-md bg-background text-foreground focus:ring-1 focus:ring-primary"
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

                    {/* Top Plagiarism Matches */}
                    <div className="mb-6">
                        <h3 className="font-semibold text-lg mb-3 flex items-center">
                            <ExternalLink className="h-5 w-5 mr-2 text-primary" /> Top Plagiarism Matches
                        </h3>
                        {student.topMatches.length > 0 ? (
                            <ul className="space-y-3">
                                {student.topMatches.map((match, idx) => (
                                    <li key={idx} className="p-3 bg-card rounded-lg border border-border">
                                        <div className="flex justify-between mb-1">
                                            <span className="font-medium">
                                                Match with: {match.name || 'Unknown'} ({match.email || 'N/A'})
                                            </span>
                                            <span className={`font-bold ${getPlagiarismScoreColor(match.plagiarismPercent)}`}>
                                                {match.plagiarismPercent}%
                                            </span>
                                        </div>
                                        <div className="bg-muted/50 p-2 rounded text-xs whitespace-pre-wrap max-h-[150px] overflow-y-auto">
                                            <p className="font-mono text-muted-foreground">{match.matchedText}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-muted-foreground">No significant top matches found.</p>
                        )}
                    </div>

                    {/* Extracted Submitted Text */}
                    <div className="mb-6">
                        <h3 className="font-semibold text-lg mb-3 flex items-center">
                            <FileText className="h-5 w-5 mr-2 text-primary" /> Submitted Text
                        </h3>
                        {student.extractedText ? (
                            <div className="relative bg-muted/30 p-4 rounded-lg border border-border">
                                <div className="absolute top-2 right-2">
                                    <CustomButton variant="ghost" size="icon" onClick={() => handleCopyText(student.extractedText)}>
                                        <Copy className="h-4 w-4" />
                                    </CustomButton>
                                </div>
                                <div className="text-sm whitespace-pre-wrap max-h-[300px] overflow-y-auto pr-10">
                                    {renderHighlightedText(student.extractedText, student.topMatches)}
                                </div>
                            </div>
                        ) : (
                            <p className="text-muted-foreground">No extracted text available.</p>
                        )}
                    </div>

                    {/* All Matches Table */}
                    <div className="mb-6">
                        <h3 className="font-semibold text-lg mb-3 flex items-center">
                            <ListChecks className="h-5 w-5 mr-2 text-primary" /> All Plagiarism Matches
                        </h3>
                        {student.allMatches.length > 0 ? (
                            <div className="overflow-x-auto rounded-lg border border-border">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-muted/50 uppercase text-muted-foreground sticky top-0">
                                        <tr>
                                            <th className="px-4 py-3">Student Name</th>
                                            <th className="px-4 py-3">Student Email</th>
                                            <th className="px-4 py-3 text-right">Plagiarism %</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {student.allMatches.map((match, idx) => (
                                            <tr key={idx} className="bg-card border-b border-border hover:bg-muted/30">
                                                <td className="px-4 py-3">{match.name || 'Unknown Student'}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{match.email || 'N/A'}</td>
                                                <td className={`px-4 py-3 text-right font-bold ${getPlagiarismScoreColor(match.plagiarismPercent)}`}>
                                                    {match.plagiarismPercent}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-muted-foreground">No additional matches found.</p>
                        )}
                    </div>

                </div>

                {/* Modal Footer */}
                <div className="flex justify-end p-4 border-t border-border bg-background/90 gap-3">
                    <CustomButton variant="outline" onClick={onClose}>Close</CustomButton>
                </div>
            </div>
        </div>
    );
};

export default PlagiarismReportModal;
