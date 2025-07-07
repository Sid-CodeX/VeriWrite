import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Upload, ExternalLink, AlertCircle, CheckCircle, File, FileText, X, ImageIcon, Eye } from 'lucide-react';
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
                description: "Only PDF, Word documents, text files, and images (PNG, JPG, JPEG) are supported.",
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

    const viewReport = async () => {
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
            window.open(url, '_blank');
            window.URL.revokeObjectURL(url);

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
                return <FileText size={20} className="text-red-500" />;
            case 'docx':
            case 'doc':
                return <FileText size={20} className="text-blue-500" />;
            case 'jpg':
            case 'jpeg':
            case 'png':
                return <ImageIcon size={20} className="text-green-500" />;
            default:
                return <File size={20} className="text-gray-500" />;
        }
    };

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
                        <h1 className="text-3xl md:text-4xl font-bold mb-4">Online Plagiarism Check</h1>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Upload documents and check them against online sources to verify originality and identify
                            potential plagiarism in real-time.
                        </p>
                    </div>
                </div>

                {/* Main Upload and Results Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Upload Card */}
                    <div className="animate-scale-in">
                        <GlassmorphismCard className="h-full shadow-lg" intensity="medium">
                            <div
                                className={cn(
                                    "h-60 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-300",
                                    isDragging ? "border-veri bg-veri/10 scale-[0.99]" : "border-border hover:border-veri/50 hover:bg-secondary/50"
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
                                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                                />

                                {!file ? (
                                    <>
                                        <Upload size={40} className={cn(
                                            "mb-4 transition-all duration-300",
                                            isDragging ? "text-veri" : "text-muted-foreground"
                                        )} />
                                        <p className="text-foreground font-medium mb-1">
                                            {isDragging ? "Drop file here" : "Drag & drop file or click to browse"}
                                        </p>
                                        <p className="text-muted-foreground text-sm">
                                            Supported formats: PDF, Word documents, text files, and images (Max 10MB)
                                        </p>
                                    </>
                                ) : (
                                    <div className="flex items-center space-x-4 p-4 bg-secondary/20 rounded-md w-full max-w-sm">
                                        {getFileIcon(file.name)}
                                        <div className="flex-1 text-left">
                                            <p className="font-medium truncate max-w-[200px]">{file.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                        <button
                                            className="p-1 rounded-full hover:bg-secondary/50 text-muted-foreground"
                                            onClick={(e) => { e.stopPropagation(); clearFile(); }}
                                            aria-label="Remove file"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Conditionally render the button only if a file is present */}
                            {file && (
                                <div className="mt-6">
                                    <CustomButton
                                        onClick={analyzeFile}
                                        loading={isAnalyzing}
                                        fullWidth
                                        size="lg"
                                        className="bg-gradient-to-r from-veri to-veri/90 hover:shadow-md transition-shadow"
                                        disabled={!file}
                                    >
                                        {isAnalyzing ? "Analyzing Document..." : "Check for Plagiarism"}
                                    </CustomButton>
                                </div>
                            )}
                        </GlassmorphismCard>
                    </div>

                    {/* Analysis Results Card */}
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
                                            No results yet. Upload a document and run a plagiarism check to see results here.
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
                                            Analyzing document for plagiarism...
                                        </p>
                                    </div>
                                )}

                                {results && !isAnalyzing && (
                                    <div className="space-y-6 animate-fade-in">
                                        <div className="bg-secondary/30 p-4 rounded-lg border border-border">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-medium">Similarity Score</span>
                                                <span className={cn(
                                                    "font-bold text-lg",
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
                                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                                                    {results.sources.map((source, index) => (
                                                        <div key={index} className="bg-secondary/30 p-3 rounded-lg border border-border">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <p className="font-medium text-sm truncate max-w-[200px]">{source.title}</p>
                                                                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">{source.url}</p>
                                                                </div>
                                                                <span className={cn(
                                                                    "text-xs font-bold px-2 py-1 rounded-full",
                                                                    source.level === "Low" ? "bg-green-500/10 text-green-500" :
                                                                    source.level === "Medium" ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"
                                                                )}>
                                                                    {source.similarity.toFixed(2)}%
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
                                                icon={<FileText size={18} />}
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
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default OnlineCheck;