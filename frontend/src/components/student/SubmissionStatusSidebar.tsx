import { format, isValid } from 'date-fns';
import { Check, AlertTriangle } from 'lucide-react';
import GlassmorphismCard from '@/components/ui/GlassmorphismCard'; // Added import for GlassmorphismCard

interface Assignment {
    id: string;
    title: string;
    deadline: Date;
    submitted: boolean;
    submittedAt?: Date;
    description?: string;
    type: 'Assignment' | 'Exam';
    submissionLate?: boolean;
}

interface Submission { // This interface needs to match what's being passed from StudentAssignmentView
    _id: string; 
    fileName?: string; 
    fileSize?: number; 
    submittedAt: Date;
    status?: 'processing' | 'checked' | 'error';
    similarity?: number | null; 
    late?: boolean; 
    score?: number;
}

interface SubmissionStatusSidebarProps {
    assignment: Assignment;
    submissions: Submission[];
    submissionGuidelines: string[]; 
    message: string;
}

const SubmissionStatusSidebar = ({ assignment, submissions, submissionGuidelines, message }: SubmissionStatusSidebarProps) => {
    const latestSubmission = submissions.length > 0 ? submissions[0] : null;

    return (
        <div>
            <GlassmorphismCard className="p-6 mb-6">
                <h3 className="text-md font-semibold mb-3">Submission Status</h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <span className={`text-sm font-medium ${
                            assignment.submitted
                                ? assignment.submissionLate
                                    ? 'text-amber-500'
                                    : 'text-green-500'
                                : 'text-amber-500'
                        }`}>
                            {assignment.submitted
                                ? assignment.submissionLate
                                    ? 'Submitted (Late)'
                                    : 'Submitted'
                                : 'Pending'
                            }
                        </span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Due Date</span>
                        <span className="text-sm font-medium">
                            {/* Added isValid check for assignment.deadline */}
                            {isValid(assignment.deadline) ? format(assignment.deadline, 'MMM d, h:mm a') : 'N/A'}
                        </span>
                    </div>

                    {/* Conditional rendering for submittedAt, with isValid check */}
                    {assignment.submitted && assignment.submittedAt && (
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Submitted On</span>
                            <span className="text-sm font-medium">
                                {/* Added isValid check for assignment.submittedAt */}
                                {isValid(assignment.submittedAt) ? format(assignment.submittedAt, 'MMM d, h:mm a') : 'N/A'}
                            </span>
                        </div>
                    )}

                    {latestSubmission && latestSubmission.status === 'checked' && (
                        <>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Similarity Score</span>
                                <span className={`text-sm font-medium ${
                                    (latestSubmission.similarity || 0) > 30 // Changed to similarity
                                        ? 'text-red-500'
                                        : (latestSubmission.similarity || 0) > 15
                                            ? 'text-amber-500'
                                            : 'text-green-500'
                                }`}>
                                    {latestSubmission.similarity}%
                                </span>
                            </div>

                            {/* Ensure score is a number before display */}
                            {assignment.type === 'Exam' && typeof latestSubmission.score === 'number' && (
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Exam Score</span>
                                    <span className="text-sm font-medium text-veri">
                                        {latestSubmission.score}/100
                                    </span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </GlassmorphismCard>

            <GlassmorphismCard className="p-6">
                <h3 className="text-md font-semibold mb-3">Submission Guidelines</h3>
                {/* Render submission guidelines dynamically if provided, otherwise default */}
                {submissionGuidelines && submissionGuidelines.length > 0 ? (
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        {submissionGuidelines.map((guideline, index) => (
                            <li key={index} className="flex items-start gap-2">
                                <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                <span>{guideline}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            <span>Submit files in PDF, Word, or Text format only</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            <span>Maximum file size: 10MB</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            <span>Include your name and roll number in the document</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            <span>You can submit multiple times</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            <span>Late submissions will be marked accordingly</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            <span>Only your last submission will be considered for evaluation</span>
                        </li>
                    </ul>
                )}

                {/* Display message if available */}
                {message && (
                    <p className="text-sm mt-4 text-primary font-medium">{message}</p>
                )}
            </GlassmorphismCard>
        </div>
    );
};

export default SubmissionStatusSidebar;