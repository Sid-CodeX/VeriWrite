
import { format } from 'date-fns';
import { Calendar, Check, AlertTriangle, Clock } from 'lucide-react';
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

interface AssignmentDetailsProps {
  assignment: Assignment;
  isPastDeadline: boolean;
}

const AssignmentDetails = ({ assignment, isPastDeadline }: AssignmentDetailsProps) => {
  return (
    <GlassmorphismCard className="p-6 mb-6">
      <h2 className="text-lg font-semibold mb-2">Description</h2>
      <div className="prose prose-sm max-w-none text-muted-foreground mb-4 whitespace-pre-line">
        {assignment.description}
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            Due: {format(assignment.deadline, 'MMMM d, yyyy')}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {assignment.submitted ? (
            <>
              <Check className="h-4 w-4 text-green-500" />
              <span className={`text-sm ${assignment.submissionLate ? 'text-amber-500' : 'text-green-500'}`}>
                Submitted on {format(assignment.submittedAt!, 'MMMM d, yyyy')}
                {assignment.submissionLate && ' (Late)'}
              </span>
            </>
          ) : isPastDeadline ? (
            <>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-amber-500">Deadline passed (Late submission allowed)</span>
            </>
          ) : (
            <>
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-amber-500">Submission pending</span>
            </>
          )}
        </div>
      </div>
    </GlassmorphismCard>
  );
};

export default AssignmentDetails;
