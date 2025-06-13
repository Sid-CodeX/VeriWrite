import React from 'react';
import { X, Download, Copy, ExternalLink, AlertCircle, BarChart } from 'lucide-react';
import CustomButton from '@/components/ui/CustomButton';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

// --- Interfaces (Consider moving these to a shared types file like src/types/assignment.ts) ---
interface MatchDetail {
  matchedStudentId: string;
  matchedText: string;
  plagiarismPercent: number;
  name?: string;
  email?: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  submissionDate: Date | null;
  documentName: string | null;
  plagiarismScore: number | null;
  reportGenerated: boolean;
  extractedText: string | null;
  wordCount: number;
  topMatches: MatchDetail[];
  allMatches: {
    matchedStudentId: string;
    plagiarismPercent: number;
    name?: string;
    email?: string;
  }[];
}

interface PlagiarismReportModalProps {
  student: Student;
  assignmentTitle: string;
  assignmentType: 'Assignment' | 'Exam';
  onClose: () => void;
  onDownloadReport: (options: { filename: string; elementId: string; studentName: string; assignmentTitle: string; }) => void;
  isGeneratingPdf: boolean;
}

const PlagiarismReportModal: React.FC<PlagiarismReportModalProps> = ({
  student,
  assignmentTitle,
  assignmentType,
  onClose,
  onDownloadReport,
  isGeneratingPdf,
}) => {
  const { toast } = useToast();

  const handleCopyText = (text: string | null) => {
    if (text) {
      navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Extracted text copied to clipboard.",
      });
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

            // Add text before the match
            if (matchStartIndex > lastIndex) {
              newSegments.push(segment.substring(lastIndex, matchStartIndex));
            }

            // Add the highlighted match
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
          // Add remaining text after the last match in the segment
          if (lastIndex < segment.length) {
            newSegments.push(segment.substring(lastIndex));
          }
        } else {
          newSegments.push(segment); // Keep non-string segments (already highlighted)
        }
      });
      segments = newSegments;
    });

    return <>{segments}</>;
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div
        id="plagiarism-report-content" // ID for PDF generation
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
              <p className="text-muted-foreground"><strong>Submitted:</strong> {student.submissionDate ? format(student.submissionDate, 'MMM d, yyyy HH:mm') : 'N/A'}</p>
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

          {/* Top Matches */}
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
                        {match.name || `Student ID: ${match.matchedStudentId.substring(0, 8)}...`}
                      </span>
                      <span className="text-sm font-semibold text-red-600">
                        {match.plagiarismPercent}% Match
                      </span>
                    </div>
                    <p className="text-muted-foreground text-xs line-clamp-2">
                      "{match.matchedText}"
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No significant top matches found or report is pending.</p>
            )}
          </div>

          {/* Extracted Text with Highlighting */}
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-3 flex items-center">
              <Copy className="h-5 w-5 mr-2 text-primary" /> Submitted Text
              <CustomButton
                variant="ghost"
                size="sm"
                className="ml-auto flex items-center gap-1 text-xs"
                onClick={() => handleCopyText(student.extractedText)}
                disabled={!student.extractedText}
              >
                <Copy className="h-3.5 w-3.5" /> Copy Text
              </CustomButton>
            </h3>
            <div className="relative bg-card border border-border rounded-lg p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto custom-scrollbar">
              {student.extractedText ? (
                renderHighlightedText(student.extractedText, student.topMatches)
              ) : (
                <p className="text-muted-foreground">No text extracted or available for this submission.</p>
              )}
            </div>
          </div>

          {/* All Matches (Optional: can be made more detailed or hidden by default) */}
          {student.allMatches && student.allMatches.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3 flex items-center">
                <BarChart className="h-5 w-5 mr-2 text-primary" /> All Matches Overview
              </h3>
              <ul className="space-y-2">
                {student.allMatches.map((match, index) => (
                  <li key={index} className="flex justify-between items-center p-2 bg-card rounded-lg border border-border">
                    <span className="text-sm">
                      {match.name || `Student ID: ${match.matchedStudentId.substring(0, 8)}...`}
                    </span>
                    <span className="text-sm font-semibold text-red-500">
                      {match.plagiarismPercent}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>

        <div className="flex justify-end gap-4 mt-auto p-5 border-t border-border bg-gradient-to-l from-primary/5 to-accent/5">
          <CustomButton
            onClick={() => onDownloadReport({
              filename: `plagiarism_report_${student.name.replace(/\s/g, '_')}_${assignmentTitle.replace(/\s/g, '_')}.pdf`,
              elementId: 'plagiarism-report-content',
              studentName: student.name,
              assignmentTitle: assignmentTitle,
            })}
            disabled={isGeneratingPdf}
            className="flex items-center gap-2 px-6 py-3 rounded-lg"
          >
            {isGeneratingPdf ? (
              <>
                <span className="animate-spin mr-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
                </span>
                Generating PDF...
              </>
            ) : (
              <>
                <Download size={18} /> Download Report
              </>
            )}
          </CustomButton>
          <CustomButton variant="secondary" onClick={onClose} className="px-6 py-3 rounded-lg">
            Close
          </CustomButton>
        </div>
      </div>
    </div>
  );
};

export default PlagiarismReportModal;