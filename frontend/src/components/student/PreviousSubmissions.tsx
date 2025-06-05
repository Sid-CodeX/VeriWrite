// frontend/src/components/student/PreviousSubmissions.tsx

import { format } from 'date-fns';
import { FileText, Check, AlertTriangle, X, Award, Download } from 'lucide-react';
import CustomButton from '@/components/ui/CustomButton';

interface Submission {
  _id: string;
  fileName: string;
  fileSize: number;
  submittedAt: Date;
  status: 'processing' | 'checked' | 'error';
  similarity?: number;
  late?: boolean;
  score?: number;
}

interface PreviousSubmissionsProps {
  submissions: Submission[];
  assignmentType: 'assignment' | 'exam';
  onDownloadSubmission: (submissionId: string) => void;
}

const PreviousSubmissions = ({ submissions, assignmentType, onDownloadSubmission }: PreviousSubmissionsProps) => {
  if (submissions.length === 0) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div>
      <h3 className="text-md font-medium mb-3">Previous Submissions</h3>
      <div className="space-y-3">
        {submissions.map((submission) => (
          <div
            key={submission._id}
            className="p-3 bg-secondary/40 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-background rounded-md">
                <FileText className="h-5 w-5 text-veri" />
              </div>
              <div>
                <p className="font-medium text-sm line-clamp-1">{submission.fileName}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                  <span>{formatFileSize(submission.fileSize)}</span>
                  <span>•</span>
                  <span>{format(submission.submittedAt, 'MMM d, h:mm a')}</span>
                  {submission.late && (
                    <>
                      <span>•</span>
                      <span className="text-amber-500">Late submission</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="ml-10 sm:ml-0 flex items-center gap-2">
              {submission.status === 'processing' ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-blue-800 dark:text-blue-300" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing
                </span>
              ) : submission.status === 'checked' ? (
                <div className="flex flex-col items-end gap-1">
                  {assignmentType === 'exam' && submission.score && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-veri/10 text-veri">
                      <Award className="mr-1" size={12} />
                      Score: {submission.score}/100
                    </span>
                  )}
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    (submission.similarity || 0) > 30
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      : (submission.similarity || 0) > 15
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                      : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  }`}>
                    {(submission.similarity || 0) > 30 ? (
                      <AlertTriangle className="mr-1" size={12} />
                    ) : (
                      <Check className="mr-1" size={12} />
                    )}
                    {submission.similarity}% similarity
                  </span>
                </div>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                  <X className="mr-1" size={12} />
                  Error
                </span>
              )}
                {/* Add download button if status is 'checked' and there's a file to download */}
              {submission.status === 'checked' && submission.fileName && (
                <CustomButton
                  variant="ghost"
                  size="sm"
                  onClick={() => onDownloadSubmission(submission._id)}
                  title="Download Submission"
                  icon={<Download className="h-4 w-4" />}
                >
                  {/* Add children prop here */}
                  <span className="sr-only">Download</span> 
                </CustomButton>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PreviousSubmissions;