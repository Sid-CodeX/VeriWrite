import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, AlertCircle, CheckCircle, FileDown, Eye, Trash2, ImageIcon } from 'lucide-react'; // Added ImageIcon here
import Navbar from '@/components/Navbar';
import CustomButton from '@/components/ui/CustomButton';
import GlassmorphismCard from '@/components/ui/GlassmorphismCard';
import { cn } from '@/lib/utils';
import Footer from '@/components/Footer';

const UploadCheck = () => {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Corrected type definition for results based on the usage in JSX
  const [results, setResults] = useState<null | {
    file1: string;
    file2: string;
    similarity: string;
    level: string; // Ensure this matches what your backend sends
    text1: { text: string; highlight: boolean }[];
    text2: { text: string; highlight: boolean }[];
  }[]>(null);

  const [activeStep, setActiveStep] = useState<number>(0);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (newFiles: File[]) => {
    // Filter for acceptable file types
    const acceptedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/png',
      'image/jpeg',
      'image/jpg',
    ];
    const validFiles = newFiles.filter(file => acceptedTypes.includes(file.type));

    if (validFiles.length !== newFiles.length) {
      toast({
        title: "Invalid file type",
        description: "Only PDF, Word documents, text files, and images (PNG, JPG, JPEG) are supported.", // Updated description
        variant: "destructive"
      });
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const analyzeFiles = async () => {
    if (files.length === 0) {
      toast({
        title: "Error",
        description: "Please upload at least one document to check for plagiarism.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      files.forEach(file => formData.append("files", file));

      const token = localStorage.getItem("token"); // get the token from local storage.
      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const uploadResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/uploadcheck/upload-and-check`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!uploadResponse.ok) {
        // Attempt to parse error data even if response is not ok
        let errorDetails = "Failed to upload files.";
        try {
          const errorData = await uploadResponse.json();
          errorDetails = errorData.error || errorDetails;
        } catch (parseError) {
          // If JSON parsing fails, use a generic message
          errorDetails = `Failed to process response from server (Status: ${uploadResponse.status}).`;
          console.error("Error parsing backend error response:", parseError);
        }
        throw new Error(errorDetails);
      }

      const uploadData = await uploadResponse.json();
      setResults(uploadData.results);

      toast({
        title: "Success",
        description: "Plagiarism analysis completed..",
      });
    } catch (error: any) { // Type the error as any for easier handling of various error types
      console.error("Error during plagiarism analysis:", error); // Log the full error for debugging
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred during analysis.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }; // Correctly closed the analyzeFiles function here. No extra semicolons or braces.


  const viewReport = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/uploadcheck/view-report`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let errorDetails = "Failed to fetch report.";
        try {
          const errorData = await response.json();
          errorDetails = errorData.error || errorDetails;
        } catch (parseError) {
          errorDetails = `Failed to process report response (Status: ${response.status}).`;
          console.error("Error parsing backend report error response:", parseError);
        }
        throw new Error(errorDetails);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank'); // Open in a new tab
      // URL.revokeObjectURL(url); // Don't revoke immediately, as the new tab might still need it. Revoke on tab close or after a delay if needed.
    } catch (error: any) {
      console.error("Error viewing report:", error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred while viewing the report.",
        variant: "destructive",
      });
    }
  };

  const downloadReport = async () => {
    try {
      const token = localStorage.getItem("token"); // get the token from local storage.
      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const downloadResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/uploadcheck/download-report`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!downloadResponse.ok) {
        let errorDetails = "Failed to download report.";
        try {
          const errorData = await downloadResponse.json();
          errorDetails = errorData.error || errorDetails;
        } catch (parseError) {
          errorDetails = `Failed to process download response (Status: ${downloadResponse.status}).`;
          console.error("Error parsing backend download error response:", parseError);
        }
        throw new Error(errorDetails);
      }

      const blob = await downloadResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'plagiarism_report.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url); // Revoke after click

      toast({
        title: "Success",
        description: "Report downloaded successfully.",
      });
    } catch (error: any) {
      console.error("Error downloading report:", error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred while downloading the report.",
        variant: "destructive",
      });
    }
  };

  // Steps for the "How It Works" section
  const steps = [
    {
      title: "Upload Documents",
      description: "Upload your documents in PDF, Word, or text format for analysis.",
      icon: <Upload className="text-veri" size={24} />
    },
    {
      title: "Analyze Content",
      description: "Our system compares your text against billions of documents and web pages.",
      icon: <CheckCircle className="text-veri" size={24} />
    },
    {
      title: "Review Results",
      description: "Get detailed similarity scores and source information in an easy-to-read report.",
      icon: <FileText className="text-veri" size={24} />
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30">
      <Navbar />

      <main className="container max-w-6xl mx-auto pt-28 pb-16 px-6 relative">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-10 -left-20 w-96 h-96 bg-veri/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/3 -right-20 w-96 h-96 bg-write/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 left-1/4 w-72 h-72 bg-veri/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Upload & Check Documents</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Upload your documents to check for plagiarism against our comprehensive database.
              We support PDF, Word documents, text files, and images.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <GlassmorphismCard className="h-full shadow-lg animate-scale-in" intensity="medium">
              <div
                className={cn(
                  "h-60 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-300",
                  isDragging ? "border-veri bg-veri/10 scale-[0.99]" : "border-border hover:border-veri/50 hover:bg-secondary/50"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                />

                <Upload size={40} className={cn(
                  "mb-4 transition-all duration-300",
                  isDragging ? "text-veri" : "text-muted-foreground"
                )} />
                <p className="text-foreground font-medium mb-1">
                  {isDragging ? "Drop files here" : "Drag & drop files or click to browse"}
                </p>
                <p className="text-muted-foreground text-sm">
                  Supports PDF, Word documents, text files, and images (Max 10MB)
                </p>
              </div>

              {files.length > 0 && (
                <div className="mt-6 animate-slide-up">
                  <h3 className="text-lg font-medium mb-4">Uploaded Documents ({files.length})</h3>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2 scrollbar-thin">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border hover:border-border/80 hover:bg-secondary/40 transition-all"
                      >
                        <div className="flex items-center">
                          {/* Use ImageIcon for image files, FileText for others */}
                          {file.type.startsWith('image/') ? (
                            <ImageIcon className="text-veri mr-3" size={20} />
                          ) : (
                            <FileText className="text-veri mr-3" size={20} />
                          )}
                          <div>
                            <p className="font-medium truncate max-w-[300px]">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-2 rounded-full hover:bg-destructive/10"
                          aria-label="Remove file"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    <CustomButton
                      onClick={analyzeFiles}
                      loading={isAnalyzing}
                      fullWidth
                      size="lg"
                      className="bg-gradient-to-r from-veri to-veri/90 hover:shadow-md transition-shadow"
                    >
                      {isAnalyzing ? "Analyzing Documents..." : "Check for Plagiarism"}
                    </CustomButton>
                  </div>
                </div>
              )}
            </GlassmorphismCard>
          </div>

          <div className="animate-slide-in" style={{ animationDelay: '200ms' }}>
            <GlassmorphismCard className="h-full shadow-lg" intensity="medium">
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <span className="bg-veri/10 text-veri p-1.5 rounded-md mr-2">
                    <CheckCircle size={18} />
                  </span>
                  Analysis Results
                </h3>

                {!results && !isAnalyzing && (
                  <div className="flex flex-col items-center justify-center h-60 text-center">
                    <AlertCircle size={40} className="text-muted-foreground mb-4 opacity-60" />
                    <p className="text-muted-foreground">
                      No results yet. Upload documents and run a plagiarism check to see results here.
                    </p>
                  </div>
                )}

                {isAnalyzing && (
                  <div className="flex flex-col items-center justify-center h-60 text-center">
                    <div className="w-16 h-16 relative mb-4">
                      <div className="absolute top-0 left-0 w-full h-full border-4 border-veri/30 rounded-full"></div>
                      <div className="absolute top-0 left-0 w-full h-full border-4 border-t-transparent border-veri rounded-full animate-spin"></div>
                    </div>
                    <p className="text-muted-foreground">
                      Analyzing documents for plagiarism...
                    </p>
                  </div>
                )}

                {results && !isAnalyzing && (
                  <div className="space-y-6 animate-fade-in">
                    {results.map((result, index) => (
                      <div key={index} className="bg-secondary/30 p-5 rounded-lg border border-border">
                        <h4 className="font-medium mb-4">Comparison {index + 1}</h4>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Files Compared:</span>
                          <span>{result.file1} vs {result.file2}</span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Similarity:</span>
                          <span className={cn(
                            "font-bold text-lg",
                            result.level === "Low" ? "text-green-500" :
                            result.level === "Medium" ? "text-amber-500" : "text-red-500"
                          )}>
                            {result.similarity} ({result.level})
                          </span>
                        </div>
                        {index < results.length - 1 && <hr className="my-4 border-border/50" />}
                      </div>
                    ))}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <CustomButton
                        variant="outline"
                        fullWidth
                        icon={<Eye size={18} />}
                        onClick={viewReport}
                      >
                        View Report
                      </CustomButton>
                      <CustomButton
                        fullWidth
                        icon={<FileDown size={18} />}
                        onClick={downloadReport}
                      >
                        Download PDF
                      </CustomButton>
                    </div>
                  </div>
                )}
              </div>
            </GlassmorphismCard>
          </div>

          <div className="mt-12 animate-slide-up" style={{ animationDelay: '400ms' }}>
            <GlassmorphismCard>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-6">How It Works</h3>

                {/* Interactive stepper */}
                <div className="relative">
                  {/* Progress line */}
                  <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-gradient-to-b from-veri/50 via-veri/30 to-veri/10 z-0"></div>

                  <div className="space-y-8">
                    {steps.map((step, index) => (
                      <div
                        key={index}
                        className={`relative flex items-start gap-4 p-4 rounded-xl transition-all duration-300 ${
                          activeStep === index ? 'bg-veri/5 shadow-sm transform scale-102' : 'hover:bg-veri/5'
                        }`}
                        onMouseEnter={() => setActiveStep(index)}
                      >
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center z-10 transition-all duration-500 ${
                          activeStep === index
                            ? 'bg-veri/20 shadow-veri/20 shadow-md'
                            : 'bg-veri/10'
                        }`}>
                          {step.icon}
                        </div>

                        <div className="flex-1">
                          <h4 className={`font-medium text-lg mb-2 transition-colors ${
                            activeStep === index ? 'text-veri' : ''
                          }`}>
                            {step.title}
                          </h4>
                          <p className="text-muted-foreground">
                            {step.description}
                          </p>
                        </div>

                        {activeStep === index && (
                          <div className="absolute -inset-px bg-veri/5 rounded-xl -z-10 animate-pulse opacity-50"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </GlassmorphismCard>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}; 

export default UploadCheck;