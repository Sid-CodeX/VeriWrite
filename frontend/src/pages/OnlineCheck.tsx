
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Upload, ExternalLink, AlertCircle, CheckCircle, File, FileText, X } from 'lucide-react';
import Navbar from '@/components/Navbar';
import CustomButton from '@/components/ui/CustomButton';
import GlassmorphismCard from '@/components/ui/GlassmorphismCard';
import { cn } from '@/lib/utils';

const OnlineCheck = () => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<null | { 
    score: number; 
    matches: number;
    sources: Array<{ url: string; similarity: number; title: string }>;
  }>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (newFile: File) => {
    // Check if file is PDF, DOCX, or other acceptable format
    const acceptedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    
    if (!acceptedTypes.includes(newFile.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF, DOCX, or TXT file.",
        variant: "destructive"
      });
      return;
    }
    
    // Check file size (max 10MB)
    if (newFile.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive"
      });
      return;
    }
    
    setFile(newFile);
    setResults(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const analyzeFile = () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please upload a document to check for plagiarism.",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    
    // Simulate plagiarism check with timeout
    setTimeout(() => {
      setIsAnalyzing(false);
      
      // Generate mock results
      const mockScore = Math.floor(Math.random() * 40);
      const mockMatches = Math.floor(Math.random() * 5) + 1;
      
      const mockSources = Array.from({ length: mockMatches }, (_, i) => ({
        url: `https://example${i + 1}.com/article${Math.floor(Math.random() * 100)}`,
        similarity: Math.floor(Math.random() * 30) + 10,
        title: `Sample Academic Article ${i + 1}`
      }));
      
      setResults({
        score: mockScore,
        matches: mockMatches,
        sources: mockSources
      });
      
      toast({
        title: "Analysis Complete",
        description: "We've completed the plagiarism analysis of your document.",
      });
    }, 2500);
  };

  const clearFile = () => {
    setFile(null);
    setResults(null);
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch(extension) {
      case 'pdf':
        return <FileText size={24} className="text-red-500" />;
      case 'docx':
      case 'doc':
        return <FileText size={24} className="text-blue-500" />;
      default:
        return <File size={24} className="text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container max-w-6xl mx-auto pt-28 pb-16 px-6">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Online Plagiarism Check</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Upload documents and check them against online sources to verify originality and identify 
            potential plagiarism in real-time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <GlassmorphismCard className="h-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Upload Document to Check</h3>
                  {file && (
                    <div>
                      <CustomButton 
                        variant="ghost" 
                        size="sm" 
                        onClick={clearFile}
                      >
                        Clear
                      </CustomButton>
                    </div>
                  )}
                </div>

                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center transition-all",
                    isDragging 
                      ? "border-veri bg-veri/5"
                      : "border-border hover:border-veri/50 hover:bg-secondary/30",
                    file ? "bg-secondary/30" : ""
                  )}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {!file ? (
                    <div className="flex flex-col items-center">
                      <Upload size={48} className="text-muted-foreground mb-4" />
                      <h4 className="font-medium mb-2">Drag & drop your document here</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Supported formats: PDF, DOCX, TXT (Max 10MB)
                      </p>
                      <label className="cursor-pointer">
                        <CustomButton 
                          variant="outline"
                          size="sm"
                          type="button"
                        >
                          Browse Files
                        </CustomButton>
                        <input 
                          type="file" 
                          className="hidden" 
                          onChange={handleFileChange}
                          accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-4">
                      {getFileIcon(file.name)}
                      <div className="flex-1 text-left">
                        <p className="font-medium truncate max-w-md">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button 
                        className="p-1 rounded-full hover:bg-secondary/50 text-muted-foreground"
                        onClick={clearFile}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <CustomButton 
                    onClick={analyzeFile} 
                    loading={isAnalyzing}
                    fullWidth 
                    size="lg"
                    icon={<Upload size={18} />}
                    disabled={!file}
                  >
                    {isAnalyzing ? "Analyzing Document..." : "Check for Plagiarism"}
                  </CustomButton>
                </div>
              </div>
            </GlassmorphismCard>
          </div>

          <div>
            <GlassmorphismCard className="h-full">
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-4">Analysis Results</h3>
                
                {!results && !isAnalyzing && (
                  <div className="flex flex-col items-center justify-center h-60 text-center">
                    <AlertCircle size={40} className="text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No results yet. Upload a document and run a plagiarism check to see results here.
                    </p>
                  </div>
                )}

                {isAnalyzing && (
                  <div className="flex flex-col items-center justify-center h-60 text-center">
                    <div className="w-12 h-12 border-4 border-t-transparent border-veri rounded-full animate-spin mb-4"></div>
                    <p className="text-muted-foreground">
                      Analyzing document for plagiarism...
                    </p>
                  </div>
                )}

                {results && !isAnalyzing && (
                  <div className="space-y-6">
                    <div className="bg-secondary/30 p-4 rounded-lg border border-border">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Similarity Score</span>
                        <span className={cn(
                          "font-bold",
                          results.score < 15 ? "text-green-500" : 
                          results.score < 25 ? "text-amber-500" : "text-red-500"
                        )}>
                          {results.score}%
                        </span>
                      </div>
                      <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full",
                            results.score < 15 ? "bg-green-500" : 
                            results.score < 25 ? "bg-amber-500" : "bg-red-500"
                          )}
                          style={{ width: `${results.score}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Online Sources</h4>
                      {results.sources.length > 0 ? (
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                          {results.sources.map((source, index) => (
                            <div key={index} className="bg-secondary/30 p-3 rounded-lg border border-border">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-sm truncate w-48">{source.title}</p>
                                  <p className="text-xs text-muted-foreground truncate w-48">{source.url}</p>
                                </div>
                                <span className="text-xs font-bold px-2 py-1 rounded-full bg-veri/10 text-veri">
                                  {source.similarity}%
                                </span>
                              </div>
                              <div className="mt-2 flex justify-end">
                                <button 
                                  className="text-xs flex items-center text-veri hover:underline"
                                  onClick={() => window.open(source.url, '_blank')}
                                >
                                  View Source
                                  <ExternalLink size={10} className="ml-1" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No matching sources found.</p>
                      )}
                    </div>
                    
                    <div className={cn(
                      "p-3 rounded-lg flex items-center space-x-2",
                      results.score < 15 ? "bg-green-500/10 text-green-500" : 
                      results.score < 25 ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"
                    )}>
                      <CheckCircle size={18} />
                      <span className="text-sm font-medium">
                        {results.score < 15 ? "Low similarity - likely original content" : 
                         results.score < 25 ? "Moderate similarity - review highlighted sections" : 
                         "High similarity - significant matching content detected"}
                      </span>
                    </div>

                    <CustomButton 
                      variant="outline" 
                      fullWidth
                    >
                      View Detailed Report
                    </CustomButton>
                  </div>
                )}
              </div>
            </GlassmorphismCard>
          </div>
        </div>

        <div className="mt-12">
          <GlassmorphismCard>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">Document Plagiarism Detection</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-medium mb-3">How It Works</h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start">
                      <span className="inline-block w-5 h-5 rounded-full bg-veri/10 text-veri flex items-center justify-center mr-2 mt-0.5 text-xs font-bold">1</span>
                      <span>Upload your document (PDF, DOCX, or TXT format)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-5 h-5 rounded-full bg-veri/10 text-veri flex items-center justify-center mr-2 mt-0.5 text-xs font-bold">2</span>
                      <span>Our algorithms extract and analyze the text from your document</span>
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-5 h-5 rounded-full bg-veri/10 text-veri flex items-center justify-center mr-2 mt-0.5 text-xs font-bold">3</span>
                      <span>The content is compared against billions of online sources</span>
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-5 h-5 rounded-full bg-veri/10 text-veri flex items-center justify-center mr-2 mt-0.5 text-xs font-bold">4</span>
                      <span>Receive a detailed analysis with similarity scores and matching sources</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-lg font-medium mb-3">Best Practices</h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start">
                      <CheckCircle size={16} className="text-veri mr-2 mt-0.5" />
                      <span>Check drafts before final submission to catch issues early</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle size={16} className="text-veri mr-2 mt-0.5" />
                      <span>Review all highlighted matches, some may be coincidental</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle size={16} className="text-veri mr-2 mt-0.5" />
                      <span>Use proper citations for all referenced materials</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle size={16} className="text-veri mr-2 mt-0.5" />
                      <span>For text-only checking, use the "Text Check" feature</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </GlassmorphismCard>
        </div>
      </main>
    </div>
  );
};

export default OnlineCheck;
