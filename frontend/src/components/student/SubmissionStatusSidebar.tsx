
import { format } from 'date-fns';
import { Check, AlertTriangle } from 'lucide-react';
import GlassmorphismCard from '@/components/ui/GlassmorphismCard';

interface Assignment {
  id: string;
  title: string;
  deadline: Date;
  submitted: boolean;
  submittedAt?: Date;
  description?: string;
  type: 'assignment' | 'exam';
  submissionLate?: boolean;
}

interface Submission {
  id: string;
  status: 'processing' | 'checked' | 'error';
  similarity?: number;
  score?: number;
}

interface SubmissionStatusSidebarProps {
  assignment: Assignment;
  submissions: Submission[];
}

const SubmissionStatusSidebar = ({ assignment, submissions }: SubmissionStatusSidebarProps) => {
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
              {format(assignment.deadline, 'MMM d, yyyy')}
            </span>
          </div>
          
          {assignment.submitted && assignment.submittedAt && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Submitted On</span>
              <span className="text-sm font-medium">
                {format(assignment.submittedAt, 'MMM d, yyyy')}
              </span>
            </div>
          )}
          
          {latestSubmission && latestSubmission.status === 'checked' && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Similarity Score</span>
                <span className={`text-sm font-medium ${
                  (latestSubmission.similarity || 0) > 30
                    ? 'text-red-500'
                    : (latestSubmission.similarity || 0) > 15
                    ? 'text-amber-500'
                    : 'text-green-500'
                }`}>
                  {latestSubmission.similarity}%
                </span>
              </div>
              
              {assignment.type === 'exam' && latestSubmission.score && (
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
      </GlassmorphismCard>
    </div>
  );
};

export default SubmissionStatusSidebar;
