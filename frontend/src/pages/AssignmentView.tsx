import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Users, ArrowLeft, FileText, Download, Eye, BarChart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import Navbar from '@/components/Navbar';
import CustomButton from '@/components/ui/CustomButton';
import GlassmorphismCard from '@/components/ui/GlassmorphismCard';
import Footer from '@/components/Footer';
import { format } from 'date-fns';

// Define the structure of a student submission as received from your backend
interface StudentSubmissionBackend {
  name: string;
  email: string;
  status: "Submitted" | "Pending";
  submittedDate: string | null; // Assuming ISO string from backend
  fileName: string;
  plagiarismPercent: number | string; // Can be number or "Not checked" / "—"
  extractedText: string | null;
  isChecked: boolean;
  topMatches: { // ADDED: Now provided by backend
    matchedStudentId: string;
    matchedText: string;
    plagiarismPercent: number;
    // Note: The backend might also return a 'name' for non-student matches,
    // but for 'matchedStudentId' cases, we rely on getStudentNameById.
    name?: string; // Optional name for non-student matches, if provided by backend
  }[];
  allMatches: { // ADDED: Now provided by backend
    name: string;
    plagiarismPercent: number;
  }[];
}

// Frontend Student interface, aligned with backend but with Date objects
interface Student {
  id: string; // Will use email as a unique ID for frontend display for now
  name: string;
  email: string;
  submissionDate: Date | null;
  documentName: string | null;
  plagiarismScore: number | null;
  reportGenerated: boolean;
  extractedText: string | null;
  topMatches: { // UPDATED: Now directly mapped from backend
    matchedStudentId: string;
    matchedText: string;
    plagiarismPercent: number;
    name?: string; // Optional name for non-student matches, if provided by backend
  }[];
  allMatches: { // UPDATED: Now directly mapped from backend
    name: string;
    plagiarismPercent: number;
  }[];
}

interface Assignment {
  id: string;
  title: string;
  deadline: Date;
  type: 'assignment' | 'exam';
  description?: string;
}

interface Course {
  id: string;
  name: string;
}

// Helper component for Plagiarism Score coloring
const PlagiarismBadge: React.FC<{ score: number | null | string }> = ({ score }) => {
  if (score === null || score === "Not checked" || score === "—") {
    return <span className="text-xs text-muted-foreground">Not checked</span>;
  }

  const numericScore = typeof score === 'string' ? parseFloat(score) : score;

  let backgroundColor = '';
  let textColor = 'text-white';

  if (numericScore >= 0 && numericScore <= 40) {
    backgroundColor = 'bg-green-500';
  } else if (numericScore > 40 && numericScore <= 60) {
    backgroundColor = 'bg-amber-500';
    textColor = 'text-black';
  } else if (numericScore > 60 && numericScore <= 80) {
    backgroundColor = 'bg-orange-500';
  } else if (numericScore > 80 && numericScore <= 100) {
    backgroundColor = 'bg-red-500';
  } else {
    backgroundColor = 'bg-gray-500';
  }

  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full ${backgroundColor} ${textColor}`}
    >
      {numericScore}%
    </span >
  );
};


const AssignmentView = () => {
  const { courseId, assignmentId } = useParams<{ courseId: string, assignmentId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isCheckingAllPlagiarism, setIsCheckingAllPlagiarism] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // MODIFICATION: Helper to get student name by ID for topMatches

  const getStudentNameById = useCallback((id: string) => {
    const student = students.find(s => s.id === id);
    return student ? student.name : 'Unknown Student';
  }, [students]); // Dependency array: recreate if 'students' state changes

  useEffect(() => {
    const fetchAssignmentDetails = async () => {
      setLoading(true);
      setError(null); 

      if (!assignmentId) {
        setError("Assignment ID is missing.");
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token'); // Get token from local storage
        if (!token) {
          // If no token, user is not authenticated
          setError("You are not logged in. Please log in to view assignment details.");
          console.error("No authentication token found. Redirecting to login.");
          
          setTimeout(() => {
            navigate('/api/auth/login'); 
          }, 2000);
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/assignment/view/${assignmentId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`, 
          },
        });

        if (!response.ok) {
          // Attempt to parse error message from backend
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          let errorMessage = `Failed to fetch assignment details: ${errorData.message || response.statusText}`;

          if (response.status === 401) {
            errorMessage = "Unauthorized: Your session may have expired. Please log in again.";
            // If 401, token is invalid or expired. Clear it and redirect to login.
            localStorage.removeItem('token');
            setTimeout(() => {
              navigate('/api/auth/login'); // Adjust '/login' to your actual login route
            }, 2000);
          } else if (response.status === 403) {
            errorMessage = "Forbidden: You do not have permission to view this assignment.";
          } else if (response.status === 404) {
            errorMessage = "Assignment not found.";
          }

          throw new Error(errorMessage);
        }

        const data = await response.json();

        // Map backend data to frontend state
        setAssignment({
          id: assignmentId,
          title: data.assignmentTitle,
          deadline: new Date(data.dueDate),
          type: data.assignmentType,
          description: data.description,
        });

        // Assuming courseId is available from route params, or derived from assignment data if needed
        setCourse({
          id: courseId || 'unknown-course', 
          name: data.classroomId?.name || 'Unknown Course', 
        });

        const mappedStudents: Student[] = data.studentSubmissions.map((sub: StudentSubmissionBackend) => ({
          id: sub.email, 
          name: sub.name,
          email: sub.email,
          submissionDate: sub.submittedDate ? new Date(sub.submittedDate) : null,
          documentName: sub.fileName,
          plagiarismScore: typeof sub.plagiarismPercent === 'number' ? sub.plagiarismPercent : null,
          reportGenerated: sub.isChecked,
          extractedText: sub.extractedText,
          topMatches: sub.topMatches || [], 
          allMatches: sub.allMatches || [], 
        }));
        setStudents(mappedStudents);

      } catch (err: any) {
        console.error("Error fetching assignment details:", err);
        setError(err.message || "An unexpected error occurred.");
        toast({
          title: "Error",
          description: err.message || "Failed to load assignment details.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAssignmentDetails();
  }, [assignmentId, courseId, toast, navigate]); // Depend on assignmentId, courseId, toast, and navigate

  const handleCheckAllPlagiarism = () => {
    setIsCheckingAllPlagiarism(true);

    // to trigger the plagiarism check for all submissions.
    setTimeout(() => {
      setStudents(prev => prev.map(student => {
        if (student.submissionDate && !student.reportGenerated) {
          const score = Math.floor(Math.random() * 95) + 5; // Generate score between 5 and 99
          const mockExtractedText = `This is a mock extracted text for ${student.name}'s submission. It would typically be the full content of their document. This text is generated to demonstrate the new 'Extracted Text' section in the plagiarism report modal. It aims to be long enough to require scrolling.
          
          Here's a second paragraph. The content here would be the actual text from the student's submitted document, cleaned and ready for display. This allows instructors to quickly review the submission without opening the original file.`;

          // These mock matches are for display purposes only, as your backend doesn't provide them.
          // They will be overwritten by actual backend data if available.
          const mockTopMatches = [
            { matchedStudentId: 'mock-id-1', matchedText: 'Sample matched sentence 1.', plagiarismPercent: Math.floor(Math.random() * 20) + 1 },
            { matchedStudentId: 'mock-id-2', matchedText: 'Sample matched sentence 2.', plagiarismPercent: Math.floor(Math.random() * 15) + 1 }
          ];

          const mockAllMatches = [
            { name: 'Online Source A', plagiarismPercent: Math.floor(Math.random() * 30) + 1 },
            { name: 'Another Student', plagiarismPercent: Math.floor(Math.random() * 40) + 1 },
          ];

          return {
            ...student,
            plagiarismScore: score,
            reportGenerated: true,
            extractedText: mockExtractedText,
            topMatches: mockTopMatches, 
            allMatches: mockAllMatches, 
          };
        }
        return student;
      }));

      setIsCheckingAllPlagiarism(false);

      toast({
        title: "Plagiarism check initiated",
        description: "Reports are being generated for all submitted assignments.",
      });
    }, 2500);
  };

  const handleViewReport = (student: Student) => {
    setSelectedStudent(student);
    setShowReportModal(true);
  };

  const handleDownloadReport = async (student: Student | null) => {
    if (!student) {
      toast({
        title: "Download Failed",
        description: "No student selected for report download.",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingPdf(true);
    toast({
      title: "Generating PDF Report...",
      description: `Please wait while the plagiarism report for ${student.name} is generated.`,
    });

    if (typeof window.html2pdf === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => {
        setTimeout(() => generatePdfContent(student), 100);
      };
      script.onerror = () => {
        setIsGeneratingPdf(false);
        toast({
          title: "Error",
          description: "Failed to load PDF generation library.",
          variant: "destructive"
        });
      };
      document.body.appendChild(script);
    } else {
      setTimeout(() => generatePdfContent(student), 100);
    }
  };

  const generatePdfContent = (student: Student) => {
    const element = document.getElementById('plagiarism-report-content');

    if (element) {
      const clonedElement = element.cloneNode(true) as HTMLElement;

      // Force scroll position to top for the cloned element
      clonedElement.scrollTop = 0;
      clonedElement.scrollLeft = 0;

      // Apply styles directly to the cloned element for PDF generation
      clonedElement.style.backgroundColor = '#ffffff';
      clonedElement.style.maxHeight = 'none';
      clonedElement.style.overflow = 'visible';
      clonedElement.style.height = 'auto';
      clonedElement.style.position = 'relative';
      clonedElement.style.visibility = 'visible';
      clonedElement.style.opacity = '1';
      clonedElement.style.width = '210mm'; // A4 width for consistent layout
      clonedElement.style.padding = '10mm'; // Add padding for better print layout

      // Select all elements that might have problematic backgrounds or text colors or overflow
      const elementsToFix = clonedElement.querySelectorAll(
        '.bg-white\\/10, .bg-white\\/5, .bg-white\\/20, .bg-muted\\/50, .bg-muted\\/30, .text-muted-foreground, .text-sm, .text-xs, .font-medium, .font-bold, .bg-background, .bg-muted, .max-h-60, .max-h-24, .overflow-y-auto, .overflow-x-auto'
      );

      elementsToFix.forEach((el) => {
        const htmlEl = el as HTMLElement;

        // Remove problematic background classes and set solid white or light grey
        if (htmlEl.classList.contains('bg-white/10') || htmlEl.classList.contains('bg-white/5') || htmlEl.classList.contains('bg-white/20') || htmlEl.classList.contains('bg-muted/50') || htmlEl.classList.contains('bg-muted/30')) {
          htmlEl.classList.remove('bg-white/10', 'bg-white/5', 'bg-white/20', 'bg-muted/50', 'bg-muted/30');
          htmlEl.style.backgroundColor = '#ffffff'; // Solid white background for content boxes
        } else if (htmlEl.classList.contains('bg-muted')) {
          htmlEl.classList.remove('bg-muted');
          htmlEl.style.backgroundColor = '#f0f0f0'; // Light grey for contrast
        } else if (htmlEl.classList.contains('bg-background')) {
          htmlEl.classList.remove('bg-background');
          htmlEl.style.backgroundColor = '#ffffff'; // Solid white for table rows
        }

        // Ensure text is black for most elements
        if (htmlEl.classList.contains('text-muted-foreground') || htmlEl.classList.contains('text-sm') || htmlEl.classList.contains('text-xs')) {
          htmlEl.style.color = '#000000'; // Force black text
        }
        // Ensure bold/medium text is also black
        if (htmlEl.classList.contains('font-medium') || htmlEl.classList.contains('font-bold')) {
            htmlEl.style.color = '#000000';
        }
        // Specific for the main report title and student name in the header of the modal
        const reportTitle = clonedElement.querySelector('h2');
        if (reportTitle) (reportTitle as HTMLElement).style.color = '#000000';
        const studentNameInHeader = clonedElement.querySelector('p.text-muted-foreground');
        if (studentNameInHeader) (studentNameInHeader as HTMLElement).style.color = '#000000';


        // Remove overflow and max-height from any nested scrollable elements
        if (htmlEl.classList.contains('max-h-60') || htmlEl.classList.contains('max-h-24') || htmlEl.classList.contains('overflow-y-auto') || htmlEl.classList.contains('overflow-x-auto')) {
          htmlEl.classList.remove('max-h-60', 'max-h-24', 'overflow-y-auto', 'overflow-x-auto');
          htmlEl.style.maxHeight = 'none';
          htmlEl.style.overflow = 'visible';
          htmlEl.style.height = 'auto';
        }
      });

      // Specifically handle the main submission details box's background and text color
      const submissionDetailsBox = clonedElement.querySelector('.mb-6.p-4.rounded-lg');
      if (submissionDetailsBox) {
        (submissionDetailsBox as HTMLElement).style.backgroundColor = '#212121'; // Dark background
        const textElementsInDetailsBox = submissionDetailsBox.querySelectorAll('p, span, div');
        textElementsInDetailsBox.forEach(el => {
          (el as HTMLElement).style.color = '#ffffff'; // White text
        });
        const scoreCircleText = submissionDetailsBox.querySelector('.absolute.inset-0.flex.items-center.justify-center.text-lg.font-bold span');
        if (scoreCircleText) {
            (scoreCircleText as HTMLElement).style.color = '#ffffff';
        }
      }

      // Ensure table headers and cells have solid backgrounds and readable text
      const tableHeaders = clonedElement.querySelectorAll('thead th');
      tableHeaders.forEach((th) => {
        (th as HTMLElement).style.backgroundColor = '#e0e0e0';
        (th as HTMLElement).style.color = '#000000';
      });

      const tableCells = clonedElement.querySelectorAll('tbody td');
      tableCells.forEach((td) => {
        (td as HTMLElement).style.backgroundColor = '#ffffff';
        (td as HTMLElement).style.color = '#000000';
      });

      // Remove the close button from the cloned element for the PDF
      const closeButton = clonedElement.querySelector('button.text-muted-foreground');
      if (closeButton) {
        closeButton.remove();
      }

      // Add a temporary style to hide the scrollbar during capture
      const style = document.createElement('style');
      style.innerHTML = `
        /* Hide scrollbars for PDF generation */
        .overflow-y-auto::-webkit-scrollbar,
        .overflow-x-auto::-webkit-scrollbar,
        .max-h-60::-webkit-scrollbar,
        .max-h-24::-webkit-scrollbar,
        body::-webkit-scrollbar {
          width: 0 !important;
          height: 0 !important;
          display: none !important;
        }
        .overflow-y-auto, .overflow-x-auto, .max-h-60, .max-h-24, body {
          scrollbar-width: none !important; /* Firefox */
          -ms-overflow-style: none !important;  /* IE and Edge */
        }
        /* Force text colors for PDF */
        .text-muted-foreground { color: #000000 !important; }
        .text-sm { color: #000000 !important; }
        .text-xs { color: #000000 !important; }
        .font-medium { color: #000000 !important; }
        .font-bold { color: #000000 !important; }
        /* Ensure specific backgrounds are solid */
        .bg-muted\\/50, .bg-muted\\/30 { background-color: #ffffff !important; }
        .bg-muted { background-color: #f0f0f0 !important; }
        .bg-background { background-color: #ffffff !important; }
        /* Ensure the main card background is white */
        #plagiarism-report-content { background-color: #ffffff !important; }
      `;
      clonedElement.appendChild(style);


      window.html2pdf(clonedElement, {
        margin: 10,
        filename: `plagiarism_report_${student.name.replace(/\s/g, '_')}_${assignment?.title.replace(/\s/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          logging: true,
          dpi: 192,
          letterRendering: true,
          useCORS: true
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).then(() => {
        toast({
          title: "PDF Report Generated",
          description: `Plagiarism report for ${student.name} has been downloaded.`,
        });
      }).catch((error: any) => {
        console.error("Error generating PDF:", error);
        toast({
          title: "PDF Generation Failed",
          description: `Could not generate PDF report for ${student.name}.`,
          variant: "destructive"
        });
      }).finally(() => {
        setIsGeneratingPdf(false);
        if (style.parentNode) {
          style.parentNode.removeChild(style);
        }
      });
    } else {
      setIsGeneratingPdf(false);
      toast({
        title: "Error",
        description: "Report content not found for PDF generation. Please ensure the modal is fully rendered.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow pt-24 pb-16 px-6">
          <div className="container max-w-6xl mx-auto">
            <p>Loading assignment details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow pt-24 pb-16 px-6">
          <div className="container max-w-6xl mx-auto">
            <p className="text-red-500">Error: {error}</p>
            <CustomButton
              variant="outline"
              size="sm"
              onClick={() => navigate(`/classroom/${courseId}`)}
              icon={<ArrowLeft className="h-4 w-4" />}
            >
              Back to Course
            </CustomButton>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Ensure assignment and course are not null before proceeding
  if (!assignment || !course) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow pt-24 pb-16 px-6">
          <div className="container max-w-6xl mx-auto">
            <p>Assignment or Course details not found after loading.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const submittedCount = students.filter(s => s.submissionDate).length;
  const pendingCount = students.length - submittedCount;
  const checkedCount = students.filter(s => s.reportGenerated).length;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow pt-24 pb-16 px-6">
        <div className="container max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="flex items-center gap-3">
              <CustomButton
                variant="outline"
                size="sm"
                onClick={() => navigate(`/classroom/${courseId}`)}
                icon={<ArrowLeft className="h-4 w-4" />}
              >
                Back to Course
              </CustomButton>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold">{assignment.title}</h1>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    assignment.type === 'exam'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                  }`}>
                    {assignment.type === 'exam' ? 'Exam' : 'Assignment'}
                  </span>
                </div>
                <p className="text-muted-foreground mt-1">{course.name}</p>
              </div>
            </div>
          </div>

          <GlassmorphismCard className="mb-8 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Details</h3>
                {assignment.description && (
                  <p className="text-muted-foreground mb-4">{assignment.description}</p>
                )}
                <div className="flex flex-wrap gap-x-6 gap-y-3">
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Due: <strong>{format(assignment.deadline, 'MMM d,PPPP')}</strong></span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Class size: <strong>{students.length} students</strong></span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{submittedCount}</p>
                  <p className="text-xs text-blue-700 dark:text-blue-500">Submitted</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pendingCount}</p>
                  <p className="text-xs text-amber-700 dark:text-amber-500">Pending</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{checkedCount}</p>
                  <p className="text-xs text-green-700 dark:text-green-500">Checked</p>
                </div>
              </div>
            </div>
          </GlassmorphismCard>

          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold">Student Submissions</h2>
            <CustomButton
              onClick={handleCheckAllPlagiarism}
              loading={isCheckingAllPlagiarism}
              disabled={isCheckingAllPlagiarism}
              icon={<BarChart className="h-4 w-4" />}
            >
              {isCheckingAllPlagiarism ? 'Checking All...' : 'Check All Plagiarism'}
            </CustomButton>
          </div>

          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden border border-border rounded-lg">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Student
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Submission
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Plagiarism
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-background divide-y divide-border">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium">{student.name}</div>
                              <div className="text-xs text-muted-foreground">{student.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {student.submissionDate ? (
                            <div>
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                Submitted
                              </span>
                              <div className="text-xs text-muted-foreground mt-1">
                                {format(student.submissionDate, 'MMM d,PPPP')}
                              </div>
                            </div>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {student.documentName && student.documentName !== "No submission" ? (
                            <CustomButton
                              variant="link"
                              size="sm"
                              onClick={() => handleViewReport(student)}
                              className="p-0 h-auto text-sm"
                            >
                              <FileText className="h-4 w-4 mr-1.5 text-muted-foreground" />
                              <span className="truncate max-w-[150px]">{student.documentName}</span>
                            </CustomButton>
                          ) : (
                            <span className="text-xs text-muted-foreground">No submission</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <PlagiarismBadge score={student.plagiarismScore} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {student.submissionDate ? (
                            student.reportGenerated ? (
                              <div className="flex justify-end gap-2">
                                <CustomButton
                                  variant="outline"
                                  size="sm"
                                  icon={<Eye className="h-3.5 w-3.5" />}
                                  onClick={() => handleViewReport(student)}
                                >
                                  View
                                </CustomButton>
                                <CustomButton
                                  variant="outline"
                                  size="sm"
                                  icon={<Download className="h-3.5 w-3.5" />}
                                  onClick={() => handleDownloadReport(student)}
                                >
                                  Download
                                </CustomButton>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">Report pending</span>
                            )
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No action available</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showReportModal && selectedStudent && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <GlassmorphismCard id="plagiarism-report-content" className="w-full max-w-4xl max-h-[90vh] overflow-auto p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <BarChart className="h-6 w-6" />
                  Plagiarism Report
                </h2>
                <p className="text-muted-foreground">
                  for {selectedStudent.name} - {assignment.title}
                </p>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="mb-6 p-4 bg-muted rounded-lg">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
                <div className="flex-1">
                  <p className="text-sm font-medium">Submission Details</p>
                  <p className="text-xs text-muted-foreground">
                    File: {selectedStudent.documentName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Submitted: {selectedStudent.submissionDate ? format(selectedStudent.submissionDate, 'MMM d,PPPP, h:mm a') : 'Not submitted'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center">
                    <div className="relative">
                      <svg className="w-14 h-14" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="16" fill="none" className="stroke-muted-foreground/30" strokeWidth="2"></circle>
                        <circle
                          cx="18" cy="18" r="16" fill="none"
                          stroke={
                            selectedStudent.plagiarismScore !== null && selectedStudent.plagiarismScore !== undefined && typeof selectedStudent.plagiarismScore === 'number' && selectedStudent.plagiarismScore >= 80 ? '#ef4444' : // Red
                            selectedStudent.plagiarismScore !== null && selectedStudent.plagiarismScore !== undefined && typeof selectedStudent.plagiarismScore === 'number' && selectedStudent.plagiarismScore > 60 ? '#f97316' : // Orange
                            selectedStudent.plagiarismScore !== null && selectedStudent.plagiarismScore !== undefined && typeof selectedStudent.plagiarismScore === 'number' && selectedStudent.plagiarismScore > 40 ? '#f59e0b' : // Amber/Yellow
                            '#22c55e' // Green
                          }
                          strokeWidth="2"
                          strokeDasharray="100"
                          strokeDashoffset={100 - (typeof selectedStudent.plagiarismScore === 'number' ? selectedStudent.plagiarismScore : 0)}
                          transform="rotate(-90 18 18)"
                        ></circle>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-lg font-bold">
                        <span className={
                          selectedStudent.plagiarismScore !== null && selectedStudent.plagiarismScore !== undefined && typeof selectedStudent.plagiarismScore === 'number' && selectedStudent.plagiarismScore >= 80 ? 'text-red-500' :
                          selectedStudent.plagiarismScore !== null && selectedStudent.plagiarismScore !== undefined && typeof selectedStudent.plagiarismScore === 'number' && selectedStudent.plagiarismScore > 60 ? 'text-orange-500' :
                          selectedStudent.plagiarismScore !== null && selectedStudent.plagiarismScore !== undefined && typeof selectedStudent.plagiarismScore === 'number' && selectedStudent.plagiarismScore > 40 ? 'text-amber-500' :
                          'text-green-500'
                        }>
                          {typeof selectedStudent.plagiarismScore === 'number' ? selectedStudent.plagiarismScore : '—'}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Similarity Score</p>
                    <p className={`text-sm font-bold ${
                      selectedStudent.plagiarismScore !== null && selectedStudent.plagiarismScore !== undefined && typeof selectedStudent.plagiarismScore === 'number' && selectedStudent.plagiarismScore >= 80 ? 'text-red-500' :
                      selectedStudent.plagiarismScore !== null && selectedStudent.plagiarismScore !== undefined && typeof selectedStudent.plagiarismScore === 'number' && selectedStudent.plagiarismScore > 60 ? 'text-orange-500' :
                      selectedStudent.plagiarismScore !== null && selectedStudent.plagiarismScore !== undefined && typeof selectedStudent.plagiarismScore === 'number' && selectedStudent.plagiarismScore > 40 ? 'text-amber-500' :
                      'text-green-500'
                    }`}>
                      {selectedStudent.plagiarismScore !== null && selectedStudent.plagiarismScore !== undefined && typeof selectedStudent.plagiarismScore === 'number' && selectedStudent.plagiarismScore >= 80
                        ? 'High Similarity'
                        : selectedStudent.plagiarismScore !== null && selectedStudent.plagiarismScore !== undefined && typeof selectedStudent.plagiarismScore === 'number' && selectedStudent.plagiarismScore > 60
                          ? 'Significant Similarity'
                          : selectedStudent.plagiarismScore !== null && selectedStudent.plagiarismScore !== undefined && typeof selectedStudent.plagiarismScore === 'number' && selectedStudent.plagiarismScore > 40
                            ? 'Moderate Similarity'
                            : 'Low Similarity'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <section>
                <h3 className="text-lg font-semibold mb-3">Extracted Text</h3>
                {selectedStudent.extractedText ? (
                  <div className="p-4 bg-muted/50 rounded-lg max-h-60 overflow-y-auto text-sm whitespace-pre-wrap">
                    {selectedStudent.extractedText}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No extracted text available for this submission.</p>
                )}
              </section>

              {/* RE-ADDED: Top Matching Sources section */}
              <section>
                <h3 className="text-lg font-semibold mb-3">Top Matching Sources</h3>
                {selectedStudent.topMatches && selectedStudent.topMatches.length > 0 ? (
                  <div className="space-y-3">
                    {selectedStudent.topMatches.slice(0, 2).map((match, index) => (
                      <div key={index} className="p-4 border border-border rounded-lg">
                        <div className="flex justify-between mb-1">
                          <p className="font-medium">
                            {/* MODIFICATION: Check for matchedStudentId first, then use match.name if available, else 'Unknown Source' */}
                            {match.matchedStudentId ? `Student Paper: ${getStudentNameById(match.matchedStudentId)}` : match.name || 'Unknown Source'}
                          </p>
                          <span className={`${
                            match.plagiarismPercent >= 80 ? 'text-red-500' :
                            match.plagiarismPercent > 60 ? 'text-orange-500' :
                            match.plagiarismPercent > 40 ? 'text-amber-500' :
                            'text-green-500'
                          } font-medium`}>
                            {match.plagiarismPercent}% Match
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">Matched Content:</p>
                        <div className="bg-muted/30 p-3 rounded text-sm max-h-24 overflow-y-auto">
                          <p>{match.matchedText}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No significant top matches found.</p>
                )}
              </section>

              {/* RE-ADDED: All Submission Comparisons section */}
              <section>
                <h3 className="text-lg font-semibold mb-3">All Submission Comparisons</h3>
                {selectedStudent.allMatches && selectedStudent.allMatches.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-muted/50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Compared With
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Similarity
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-background divide-y divide-border">
                        {selectedStudent.allMatches.map((match, index) => (
                          <tr key={index} className="hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {match.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <PlagiarismBadge score={match.plagiarismPercent} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No other submission comparisons available.</p>
                )}
              </section>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <CustomButton
                variant="outline"
                onClick={() => setShowReportModal(false)}
              >
                Close
              </CustomButton>
              <CustomButton
                icon={<Download className="h-4 w-4" />}
                onClick={() => handleDownloadReport(selectedStudent)}
                loading={isGeneratingPdf}
                disabled={isGeneratingPdf}
              >
                {isGeneratingPdf ? 'Generating PDF...' : 'Download PDF Report'}
              </CustomButton>
            </div>
          </GlassmorphismCard>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default AssignmentView;

declare global {
  interface Window {
    html2pdf: any;
  }
}