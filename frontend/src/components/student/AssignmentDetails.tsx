// frontend/src/components/student/AssignmentDetails.tsx

import { format, isValid } from 'date-fns'; // Import isValid
import { Calendar, Check, AlertTriangle, Clock, FileText } from 'lucide-react';
import GlassmorphismCard from '@/components/ui/GlassmorphismCard';
import CustomButton from '@/components/ui/CustomButton';

interface Assignment {
  id: string;
  title: string;
  deadline: Date;
  submitted: boolean;
  submittedAt?: Date;
  description?: string;
  type: 'Assignment' | 'Exam';
  submissionLate?: boolean;
  questionFile?: { originalName: string };
}

interface AssignmentDetailsProps {
  assignment: Assignment;
  isPastDeadline: boolean;
  onDownloadQuestionFile: () => void;
  onViewQuestionFile: () => void;
}

const AssignmentDetails = ({ assignment, isPastDeadline, onDownloadQuestionFile, onViewQuestionFile }: AssignmentDetailsProps) => {
  // Check if deadline is a valid Date object before formatting
  const formattedDeadline = isValid(assignment.deadline)
    ? format(assignment.deadline, 'MMMM d, h:mm a')
    : 'N/A'; // Or a placeholder like 'Invalid Date'

  // Check if submittedAt exists AND is a valid Date object before formatting
  const formattedSubmittedAt = assignment.submittedAt && isValid(assignment.submittedAt)
    ? format(assignment.submittedAt, 'MMMM d, h:mm a')
    : 'N/A'; // Or a placeholder

  return (
    <GlassmorphismCard className="p-6 mb-6">
      <h2 className="text-lg font-semibold mb-2">Description</h2>
      <div className="prose prose-sm max-w-none text-muted-foreground mb-4 whitespace-pre-line">
        {assignment.description || 'No description provided.'}
      </div>

      {assignment.questionFile && (
        <div className="mb-4">
          <h3 className="text-md font-semibold mb-2">Question File</h3>
          <div className="flex items-center justify-between p-3 border rounded-md bg-secondary/20">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium">{assignment.questionFile.originalName}</span>
            </div>
            <div className="flex gap-2">
              <CustomButton
                variant="outline"
                size="sm"
                onClick={onViewQuestionFile}
                className="ml-4"
              >
                View
              </CustomButton>
              <CustomButton
                variant="outline"
                size="sm"
                onClick={onDownloadQuestionFile}
              >
                Download
              </CustomButton>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            Due: {formattedDeadline} {/* Use the checked variable */}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {assignment.submitted ? (
            <>
              <Check className="h-4 w-4 text-green-500" />
              <span className={`text-sm ${assignment.submissionLate ? 'text-amber-500' : 'text-green-500'}`}>
                Submitted on {formattedSubmittedAt} {/* Use the checked variable */}
                {assignment.submissionLate && ' (Late)'}
              </span>
            </>
          ) : isPastDeadline ? (
            <>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-amber-500">
                Deadline passed {assignment.type === 'Assignment' && '(Late submission allowed)'}
              </span>
            </>
          ) : (
            <>
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Submission pending</span>
            </>
          )}
        </div>
      </div>
    </GlassmorphismCard>
  );
};

export default AssignmentDetails;