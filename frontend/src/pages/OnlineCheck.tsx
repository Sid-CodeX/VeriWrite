import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Upload, ExternalLink, AlertCircle, CheckCircle, File, FileText, X, ImageIcon } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
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
        sources: Array<{ url: string; similarity: number; title: string; level: string }>; 
    }>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (newFile: File) => {
        const acceptedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'image/jpeg',
            'image/png',
            'image/jpg',
        ];
        if (!acceptedTypes.includes(newFile.type)) {
            toast({
                title: "Invalid file type",
                description: "Please upload a PDF, DOCX, or TXT file.",
                variant: "destructive"
            });
            return;
        }
        
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

    const analyzeFile = async () => {
        if (!file) {
            toast({
                title: "No file selected",
                description: "Please upload a document to check for plagiarism.",
                variant: "destructive"
            });
            return;
        }

        setIsAnalyzing(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const apiUrl = import.meta.env.VITE_API_BASE_URL;

            if (!apiUrl) {
                throw new Error("API base URL is not defined.");
            }

            const response = await fetch(`${apiUrl}/api/onlinecheck/online-check`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to analyze file');
            }

            const result = await response.json();
            console.log("Backend API Response:", result);
            toast({
                title: "Analysis Complete",
                description: "We've completed the plagiarism analysis of your document.",
            });

            setResults({
                score: result.score,
                matches: result.matches.length,
                sources: result.matches.map((match: any) => ({
                    url: match.link,
                    similarity: match.similarity,
                    title: match.title,
                    level: match.level,
                })),
            });

        } catch (error: any) {
            console.error("Analysis Error:", error);
            toast({
                title: "Analysis Failed",
                description: error.message || "An error occurred during analysis.",
                variant: "destructive"
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const viewReport = async () => { // New function to view the report
        try {
            const apiUrl = import.meta.env.VITE_API_BASE_URL;

            if (!apiUrl) {
                throw new Error("API base URL is not defined.");
            }

            const response = await fetch(`${apiUrl}/api/onlinecheck/view-report`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch report');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank'); // Open in a new tab
            window.URL.revokeObjectURL(url); // Clean up the URL object

        } catch (error: any) {
            toast({
                title: "Failed to View Report",
                description: error.message || "An error occurred while trying to view the report.",
                variant: "destructive"
            });
        }
    };

    const downloadReport = async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_BASE_URL;

            if (!apiUrl) {
                throw new Error("API base URL is not defined.");
            }

            const response = await fetch(`${apiUrl}/api/onlinecheck/download-report`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to download report');
            }
    
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Online_Check_Report.pdf';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error: any) {
            toast({
                title: "Download Failed",
                description: error.message || "An error occurred while downloading the report.",
                variant: "destructive"
            });
        }
    };

    const clearFile = () => {
        setFile(null);
        setResults(null);
    };

    const getFileIcon = (fileName: string) => {
        const extension = fileName.split('.').pop()?.toLowerCase();

        switch (extension) {
            case 'pdf':
                return <FileText size={24} className="text-red-500" />;
            case 'docx':
            case 'doc':
                return <FileText size={24} className="text-blue-500" />;
            case 'jpg':
            case 'jpeg':
            case 'png':
                return <ImageIcon size={24} className="text-green-500" />;
            default:
                return <File size={24} className="text-gray-500" />;
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            
            <main className="container max-w-6xl mx-auto pt-28 pb-16 px-6 flex-grow">
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
                                    onClick={() => document.getElementById('file-input')?.click()}
                                >
                                    <input
                                        id="file-input"
                                        type="file"
                                        className="hidden"
                                        onChange={handleFileChange}
                                        accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,image/jpeg,image/png,image/jpg"
                                    /> 
                                    {!file ? (
                                        <div className="flex flex-col items-center">
                                            <Upload size={48} className="text-muted-foreground mb-4" />
                                            <h4 className="font-medium mb-2">Drag & drop your document here</h4>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                Supported formats: PDF, DOCX, JPG, JPEG, PNG (Max 10MB)
                                            </p>
                                            <label className="cursor-pointer" htmlFor="fileInput">
                                                <CustomButton variant="outline" size="sm" type="button">
                                                    Browse Files
                                                </CustomButton>
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
                                                    results.score < 20 ? "text-green-500" : 
                                                    results.score < 50 ? "text-amber-500" : "text-red-500"
                                                )}>
                                                    {results.score}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                                                <div 
                                                    className={cn(
                                                        "h-full rounded-full",
                                                        results.score < 20 ? "bg-green-500" : 
                                                        results.score < 50 ? "bg-amber-500" : "bg-red-500"
                                                    )}
                                                    style={{ width: `${results.score}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="font-medium mb-2">Online Sources</h4>
                                            {results.sources.length > 0 ? (
                                                <div className="space-y-2">
                                                    {results.sources.map((source, index) => (
                                                        <div key={index} className="bg-secondary/30 p-3 rounded-lg border border-border">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <p className="font-medium text-sm truncate w-48">{source.title}</p>
                                                                    <p className="text-xs text-muted-foreground truncate w-48">{source.url}</p>
                                                                </div>
                                                                <span className="text-xs font-bold px-2 py-1 rounded-full bg-veri/10 text-veri">
                                                                    {source.similarity.toFixed(2)}%
                                                                </span>
                                                                <span className="text-xs font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                                                    {source.level}
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
                                            results.score < 20 ? "bg-green-500/10 text-green-500" : 
                                            results.score < 50 ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"
                                        )}>
                                             
                                        </div>

                                        <CustomButton 
                                            variant="outline" 
                                            fullWidth
                                            onClick={viewReport}
                                        >
                                            View Detailed Report
                                        </CustomButton>

                                        <CustomButton
                                            variant="outline"
                                            fullWidth
                                            onClick={downloadReport}
                                        >
                                            Download Report
                                        </CustomButton>

                                    </div>
                                )}
                            </div>
                        </GlassmorphismCard>
                    </div>
                </div>

                <div className="mt-12">
                    <GlassmorphismCard>
                        <div className="p-8">
                            <h3 className="text-2xl font-semibold mb-8 text-center">How Our Plagiarism Detection Works</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div>
                                    <div className="flex flex-col space-y-6">
                                        {[
                                            {
                                                step: 1,
                                                title: "Upload Your Document",
                                                description: "Start by uploading your document in PDF, DOCX, or TXT format through our secure system."
                                            },
                                            {
                                                step: 2,
                                                title: "Text Extraction & Analysis",
                                                description: "Our advanced algorithms extract and analyze the text from your document, preparing it for comparison."
                                            },
                                            {
                                                step: 3,
                                                title: "Source Comparison",
                                                description: "The content is compared against billions of online sources, academic papers, and our extensive database."
                                            },
                                            {
                                                step: 4,
                                                title: "Detailed Reporting",
                                                description: "Receive a comprehensive analysis with similarity scores, matching sources, and highlighted passages."
                                            }
                                        ].map((item) => (
                                            <div key={item.step} className="flex">
                                                <div className="mr-6 flex-shrink-0">
                                                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-veri text-white font-bold text-lg">
                                                        {item.step}
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-semibold mb-2">{item.title}</h4>
                                                    <p className="text-muted-foreground">{item.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="bg-secondary/20 rounded-xl p-8 border border-border/50">
                                    <h4 className="text-xl font-semibold mb-6">Best Practices for Accurate Results</h4>
                                    
                                    <ul className="space-y-4">
                                        {[
                                            "Check drafts before final submission to catch issues early",
                                            "Review all highlighted matches, as some may be coincidental",
                                            "Use proper citations for all referenced materials",
                                            "For text-only checking, use the direct text input option",
                                            "Upload complete documents rather than fragments for context",
                                            "Consider checking translated work with our cross-language detection"
                                        ].map((tip, index) => (
                                            <li key={index} className="flex items-start">
                                                <CheckCircle size={20} className="text-veri mr-3 mt-0.5 flex-shrink-0" />
                                                <span className="text-muted-foreground">{tip}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    
                                    <div className="mt-8 p-4 bg-veri/10 rounded-lg border border-veri/20">
                                        <p className="text-sm text-center font-medium text-veri">
                                            Our detection engine gets smarter with every check, continuously improving accuracy and coverage
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </GlassmorphismCard>
                </div>
            </main>
            
            <Footer />
        </div>
    );
};

export default OnlineCheck;