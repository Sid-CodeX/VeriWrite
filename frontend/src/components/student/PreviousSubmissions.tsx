// src/components/student/PreviousSubmissions.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, FileText, CheckCircle, XCircle, Clock, Hourglass } from 'lucide-react';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

// This interface must match PreviousSubmissionPropsType from StudentAssignmentView.tsx
interface StudentSubmission {
    _id: string;
    fileName: string;
    fileSize: number;
    submittedAt: Date;
    status?: 'processing' | 'checked' | 'error'; // Made optional to match StudentAssignmentView.tsx's PreviousSubmissionPropsType
    similarity?: number;
    late?: boolean;
    score?: number;
    teacherRemark?: string;
    submitted: boolean;
}

interface PreviousSubmissionsProps {
    submissions: StudentSubmission[];
    assignmentType: 'Assignment' | 'Exam';
    // Removed onDownloadSubmission prop as the download button is removed
    // onDeleteSubmission?: (submissionId: string) => void; // If you add this functionality later
}

const PreviousSubmissions: React.FC<PreviousSubmissionsProps> = ({
    submissions,
    assignmentType,
    // Removed onDownloadSubmission from destructuring
    // onDeleteSubmission,
}) => {

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <Card className="mb-6 shadow-md">
            <CardHeader>
                <CardTitle className="text-xl font-semibold">Previous Submissions</CardTitle>
            </CardHeader>
            <CardContent>
                {submissions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No previous submissions found.</p>
                ) : (
                    <div className="space-y-4">
                        {submissions.map((submission) => (
                            <div key={submission._id} className="border rounded-md p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="flex-grow">
                                    <div className="flex items-center gap-2 mb-1">
                                        <FileText className="h-5 w-5 text-gray-500" />
                                        <span className="font-medium text-lg">{submission.fileName}</span>
                                        {submission.late && (
                                            <Badge variant="destructive" className="ml-2">Late</Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Submitted on: {format(submission.submittedAt, 'PPP pp')}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        File Size: {formatFileSize(submission.fileSize)}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                        {/* Conditionally render based on status */}
                                        {submission.status === 'checked' && (
                                            <>
                                                <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                                                    <CheckCircle className="h-3 w-3 mr-1" /> Checked
                                                </Badge>
                                                {assignmentType === 'Assignment' && typeof submission.similarity === 'number' && (
                                                    <Badge variant={submission.similarity !== undefined && submission.similarity > 20 ? "destructive" : "secondary"}>
                                                        Plagiarism: {submission.similarity}%
                                                    </Badge>
                                                )}
                                                {assignmentType === 'Exam' && typeof submission.score === 'number' && (
                                                    <Badge>
                                                        Score: {submission.score}
                                                    </Badge>
                                                )}
                                            </>
                                        )}
                                        {submission.status === 'processing' && (
                                            <Badge variant="secondary">
                                                <Hourglass className="h-3 w-3 animate-spin mr-1" /> Processing...
                                            </Badge>
                                        )}
                                        {submission.status === 'error' && (
                                            <Badge variant="destructive">
                                                <XCircle className="h-3 w-3 mr-1" /> Error
                                            </Badge>
                                        )}
                                        {/* Removed the 'Status: N/A' badge condition */}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {/* Removed the Download Button as per requirement */}
                                    {/*
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onDownloadSubmission(submission._id)}
                                    >
                                        <Download className="h-4 w-4 mr-2" /> Download
                                    </Button>
                                    */}
                                    {/* Add a view button if you have a viewer service */}
                                    {/* <Button variant="outline" size="sm">
                                        <ExternalLink className="h-4 w-4 mr-2" /> View
                                    </Button> */}
                                    {/* {onDeleteSubmission && (
                                        <Button variant="destructive" size="sm" onClick={() => onDeleteSubmission(submission._id)}>
                                            Delete
                                        </Button>
                                    )} */}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default PreviousSubmissions;