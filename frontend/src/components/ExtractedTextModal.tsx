import React from 'react';
import { X, Copy, FileText } from 'lucide-react';
import CustomButton from '@/components/ui/CustomButton';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

// Define interface for the student data needed by this modal
interface StudentForExtractedTextModal {
  id: string;
  name: string;
  email: string;
  documentName: string | null;
  extractedText: string | null;
  submissionDate: Date | null;
}

interface ExtractedTextModalProps {
  student: StudentForExtractedTextModal;
  assignmentTitle: string;
  onClose: () => void;
}

const ExtractedTextModal: React.FC<ExtractedTextModalProps> = ({
  student,
  assignmentTitle,
  onClose,
}) => {
  const { toast } = useToast();

  const handleCopyText = (text: string | null) => {
    if (text) {
      // document.execCommand('copy') is used for clipboard functionality
      // as navigator.clipboard.writeText() might not work in some iframe environments.
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-background border border-border rounded-lg shadow-2xl flex flex-col animate-scale-in-content overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-border bg-gradient-to-r from-blue-500/5 to-teal-500/5">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Extracted Text: {student.documentName || 'N/A'}
          </h2>
          <CustomButton variant="ghost" size="icon" onClick={onClose}>
            <X className="h-6 w-6" />
          </CustomButton>
        </div>

        <div className="p-6 overflow-y-auto flex-grow text-sm custom-scrollbar">
          {/* Submission Details */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-muted/30 p-4 rounded-lg">
              <h3 className="font-semibold text-base mb-2">Submission Info</h3>
              <p className="text-muted-foreground"><strong>Student:</strong> {student.name}</p>
              <p className="text-muted-foreground"><strong>Email:</strong> {student.email}</p>
              <p className="text-muted-foreground"><strong>Assignment:</strong> {assignmentTitle}</p>
              <p className="text-muted-foreground">
                <strong>Submitted:</strong>{' '}
                {student.submissionDate ? format(student.submissionDate, 'MMM d, yyyy HH:mm') : 'N/A'}
              </p>
            </div>
            <div className="bg-muted/30 p-4 rounded-lg flex items-center justify-center">
              {student.extractedText ? (
                <CustomButton
                  onClick={() => handleCopyText(student.extractedText)}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" /> Copy Extracted Text
                </CustomButton>
              ) : (
                <p className="text-muted-foreground">No text to copy.</p>
              )}
            </div>
          </div>

          {/* Extracted Text Content */}
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-3 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary" /> Document Content
            </h3>
            <div className="relative bg-card border border-border rounded-lg p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto custom-scrollbar">
              {student.extractedText ? (
                student.extractedText
              ) : (
                <p className="text-muted-foreground">No text extracted or available for this submission.</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-auto p-5 border-t border-border bg-gradient-to-l from-blue-500/5 to-teal-500/5">
          <CustomButton variant="secondary" onClick={onClose} className="px-6 py-3 rounded-lg">
            Close
          </CustomButton>
        </div>
      </div>
    </div>
  );
};

export default ExtractedTextModal;
