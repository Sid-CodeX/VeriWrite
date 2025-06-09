import { useState, useRef } from 'react';
import { Upload, X, AlertTriangle } from 'lucide-react';
import CustomButton from '@/components/ui/CustomButton';
import GlassmorphismCard from '@/components/ui/GlassmorphismCard';
import { useToast } from '@/hooks/use-toast';

interface FileUploaderProps {
  isPastDeadline: boolean;
  canSubmitLate: boolean; // <--- ADD THIS LINE
  onFileSelect: (file: File | null) => void;
  onSubmit: () => void;
  selectedFile: File | null;
  isUploading: boolean;
  submissionMessage?: string;
}

const FileUploader = ({
  isPastDeadline,
  canSubmitLate, // <--- Destructure this prop here
  onFileSelect,
  onSubmit,
  selectedFile,
  isUploading,
  submissionMessage,
}: FileUploaderProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Check file type
      const fileType = file.type;
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];

      if (!validTypes.includes(fileType)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF, Word or Text file",
          variant: "destructive",
        });
        return;
      }

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      onFileSelect(file);
    }
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Format file size for display
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Determine if submission is allowed (considering deadline and canSubmitLate)
  const isSubmissionAllowed = !isPastDeadline || (isPastDeadline && canSubmitLate);

  return (
    <GlassmorphismCard className="p-6">
      <h2 className="text-lg font-semibold mb-4">Submit Your Work</h2>

      {/* Conditionally render submissionMessage if it exists */}
      {submissionMessage && (
        <p className="text-sm text-muted-foreground mb-4">{submissionMessage}</p>
      )}

      {isPastDeadline && (
        <div className="bg-amber-500/10 p-4 rounded-md mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <p className="font-medium text-amber-500">Deadline has passed</p>
              <p className="text-sm text-muted-foreground">
                {canSubmitLate
                  ? "The deadline for this assignment has passed. You can still submit, but it will be marked as late."
                  : "The deadline for this assignment has passed. Submissions are no longer accepted."
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {isSubmissionAllowed ? ( // Only show uploader if submission is allowed
        <div>
          <div
            className="border-2 border-dashed border-border rounded-md p-8 text-center cursor-pointer hover:bg-muted/10 transition-colors mb-6"
            onClick={handleBrowseClick}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt"
            />

            <div className="flex flex-col items-center">
              <Upload className="h-12 w-12 text-muted-foreground mb-3" />

              {selectedFile ? (
                <div className="animate-fade-in">
                  <p className="font-medium mb-1">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    {formatFileSize(selectedFile.size)}
                  </p>
                  <div className="flex justify-center gap-3">
                    <CustomButton
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onFileSelect(null);
                      }}
                      icon={<X className="h-4 w-4" />}
                    >
                      Remove
                    </CustomButton>
                    <CustomButton
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSubmit();
                      }}
                      loading={isUploading}
                      icon={<Upload className="h-4 w-4" />}
                    >
                      Submit
                    </CustomButton>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-lg font-medium mb-2">
                    Drag and drop your file here
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    or click to browse from your computer
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supported formats: PDF, Word, Text (Max 10MB)
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-border rounded-md p-8 text-center bg-muted/5 mb-6">
          <p className="text-lg font-medium text-muted-foreground">Submissions Closed</p>
          <p className="text-sm text-muted-foreground mt-2">The deadline has passed and late submissions are not allowed for this assignment.</p>
        </div>
      )}
    </GlassmorphismCard>
  );
};

export default FileUploader;