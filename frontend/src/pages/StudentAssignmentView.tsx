
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Calendar, Clock, Check, AlertTriangle, File, X, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CustomButton from '@/components/ui/CustomButton';
import GlassmorphismCard from '@/components/ui/GlassmorphismCard';

import AssignmentDetails from '@/components/student/AssignmentDetails';
import ExamResult from '@/components/student/ExamResult';
import FileUploader from '@/components/student/FileUploader';
import PreviousSubmissions from '@/components/student/PreviousSubmissions';
import SubmissionStatusSidebar from '@/components/student/SubmissionStatusSidebar';
import TeachersRemark from '@/components/student/TeachersRemark';

interface Assignment {
  id: string;
  title: string;
  deadline: Date;
  submitted: boolean;
  submittedAt?: Date;
  description?: string;
  type: 'assignment' | 'exam';
  submissionLate?: boolean;
  teacherRemark?: string | null;
}

interface Submission {
  id: string;
  fileName: string;
  fileSize: number;
  submittedAt: Date;
  status: 'processing' | 'checked' | 'error';
  similarity?: number;
  late?: boolean;
  score?: number;
  markDistribution?: {
    section: string;
    maxMarks: number;
    scored: number;
  }[];
}

const StudentAssignmentView = () => {
  const { courseId, assignmentId } = useParams<{ courseId: string, assignmentId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [courseName, setCourseName] = useState('');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Mock data for course, assignment and submissions
  useEffect(() => {
    if (courseId && assignmentId) {
      // Set course name based on id
      setCourseName(
        courseId === '1' ? 'Advanced Programming' : 
        courseId === '2' ? 'Data Structures' : 'Course'
      );

      // Mock assignment data
      if (assignmentId === '1') {
        setAssignment({
          id: '1',
          title: 'Midterm Project: Building a Web Application',
          deadline: new Date(2023, 11, 15),
          submitted: true,
          submittedAt: new Date(2023, 11, 10),
          description: 'Create a functional web application that demonstrates your understanding of the core concepts covered in the course, including:\n\n1. User authentication and authorization\n2. Database integration with at least 3 related models\n3. Form handling with validation\n4. Responsive UI design\n\nSubmit your complete source code and a brief report explaining your implementation.',
          type: 'assignment',
          teacherRemark: 'Good work on implementing the authentication system. Your database models are well structured. However, the UI could be more responsive on mobile devices. Consider using a mobile-first approach for future projects.'
        });
        
        setSubmissions([
          {
            id: '1',
            fileName: 'midterm_project_submission.pdf',
            fileSize: 2.4 * 1024 * 1024, // 2.4 MB
            submittedAt: new Date(2023, 11, 10),
            status: 'checked',
            similarity: 12,
            late: false
          }
        ]);
      } else if (assignmentId === '2') {
        setAssignment({
          id: '2',
          title: 'Final Project: Full-Stack Implementation',
          deadline: new Date(2023, 11, 30),
          submitted: false,
          description: 'Develop a complete full-stack application with authentication, database integration, and responsive UI. Your application should demonstrate your mastery of the following:\n\n1. Advanced state management\n2. API integration\n3. Data validation and error handling\n4. Performance optimization\n5. Security best practices\n\nSubmit your complete source code, a detailed report, and a video demonstration of your application.',
          type: 'assignment',
          teacherRemark: null
        });
        
        setSubmissions([]);
      } else if (assignmentId === '3') {
        setAssignment({
          id: '3',
          title: 'Practical Midterm Exam',
          deadline: new Date(2023, 10, 25),
          submitted: true,
          submittedAt: new Date(2023, 10, 24),
          description: 'A hands-on exam to test your practical skills in programming and problem-solving. You will implement solutions to three programming challenges within the allotted time.\n\nEach challenge tests different aspects:\n1. Data structures and algorithms\n2. Object-oriented design\n3. Asynchronous programming\n\nSubmit your solutions as a single compressed file.',
          type: 'exam',
          teacherRemark: 'Excellent work on the algorithms section. Your solution to the graph problem was elegant and efficient. For the object-oriented design, consider using more inheritance to reduce code duplication. Overall, a strong performance!'
        });
        
        setSubmissions([
          {
            id: '1',
            fileName: 'practical_exam_solutions.zip',
            fileSize: 1.8 * 1024 * 1024, // 1.8 MB
            submittedAt: new Date(2023, 10, 24),
            status: 'checked',
            similarity: 5,
            late: false,
            score: 85,
            markDistribution: [
              { section: 'Data Structures & Algorithms', maxMarks: 40, scored: 35 },
              { section: 'Object-Oriented Design', maxMarks: 30, scored: 25 },
              { section: 'Asynchronous Programming', maxMarks: 30, scored: 25 }
            ]
          }
        ]);
      } else {
        setAssignment({
          id: '4',
          title: 'Weekly Assignment: Algorithm Implementation',
          deadline: new Date(2023, 12, 5),
          submitted: false,
          description: 'Implement the discussed algorithms and submit your code with proper documentation. Your submission should include implementations of:\n\n1. Depth-First Search\n2. Breadth-First Search\n3. Dijkstra\'s Shortest Path\n\nInclude test cases and performance analysis for each algorithm.',
          type: 'assignment',
          teacherRemark: null
        });
        
        setSubmissions([]);
      }
    }
  }, [courseId, assignmentId]);

  const handleSubmit = () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to submit",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    
    // Determine if submission is late
    const isLate = assignment ? new Date() > assignment.deadline : false;
    
    // Simulate file upload
    setTimeout(() => {
      const newSubmission: Submission = {
        id: Date.now().toString(),
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        submittedAt: new Date(),
        status: 'processing',
        late: isLate
      };
      
      setSubmissions(prev => [newSubmission, ...prev]);
      setSelectedFile(null);
      setIsUploading(false);
      
      if (assignment) {
        setAssignment({
          ...assignment,
          submitted: true,
          submittedAt: new Date(),
          submissionLate: isLate
        });
      }
      
      toast({
        title: "Submission successful",
        description: isLate ? 
          "Your file has been uploaded successfully. Note: This was a late submission." : 
          "Your file has been uploaded successfully",
      });
      
      // Simulate processing
      setTimeout(() => {
        setSubmissions(prev => 
          prev.map(sub => {
            if (sub.id === newSubmission.id) {
              // For exams, add automatic evaluation data
              if (assignment?.type === 'exam') {
                const score = Math.floor(Math.random() * 21) + 70; // Random score between 70-90
                return {
                  ...sub,
                  status: 'checked',
                  similarity: Math.floor(Math.random() * 20), // Lower similarity for exams
                  score: score,
                  markDistribution: [
                    { section: 'Data Structures & Algorithms', maxMarks: 40, scored: Math.floor(score * 0.4) },
                    { section: 'Object-Oriented Design', maxMarks: 30, scored: Math.floor(score * 0.3) },
                    { section: 'Asynchronous Programming', maxMarks: 30, scored: Math.floor(score * 0.3) }
                  ]
                };
              } else {
                // For regular assignments
                return {
                  ...sub,
                  status: 'checked',
                  similarity: Math.floor(Math.random() * 30)
                };
              }
            }
            return sub;
          })
        );
      }, 3000);
      
    }, 1500);
  };

  // Determine if the deadline has passed
  const isPastDeadline = assignment ? new Date() > assignment.deadline : false;

  if (!assignment) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow pt-24 pb-16 px-6">
          <div className="container max-w-4xl mx-auto">
            <p>Loading assignment details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16 px-6">
        <div className="container max-w-4xl mx-auto">
          {/* Header with back button */}
          <div className="flex items-center gap-3 mb-8">
            <CustomButton 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/student-course/${courseId}`)}
              icon={<ArrowLeft className="h-4 w-4" />}
            >
              Back to Course
            </CustomButton>
            <div>
              <h1 className="text-2xl font-bold">{assignment.title}</h1>
              <p className="text-muted-foreground mt-1">{courseName}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              {/* Assignment details */}
              <AssignmentDetails 
                assignment={assignment} 
                isPastDeadline={isPastDeadline} 
              />
              
              {/* Teacher's Remark (if available) */}
              <TeachersRemark remark={assignment.teacherRemark} />
              
              {/* Exam score display (if available) */}
              {assignment.type === 'exam' && submissions.length > 0 && submissions[0].score && (
                <ExamResult submission={submissions[0]} />
              )}
              
              {/* File submission section */}
              <FileUploader 
                isPastDeadline={isPastDeadline}
                onFileSelect={setSelectedFile}
                onSubmit={handleSubmit}
                selectedFile={selectedFile}
                isUploading={isUploading}
              />
              
              {/* Previous submissions */}
              {submissions.length > 0 && (
                <PreviousSubmissions 
                  submissions={submissions} 
                  assignmentType={assignment.type} 
                />
              )}
            </div>
            
            {/* Sidebar with submission status and guidelines */}
            <div>
              <SubmissionStatusSidebar 
                assignment={assignment} 
                submissions={submissions} 
              />
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default StudentAssignmentView;
