
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Users, ArrowLeft, FileText, Download, Eye, BarChart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import Navbar from '@/components/Navbar';
import CustomButton from '@/components/ui/CustomButton';
import GlassmorphismCard from '@/components/ui/GlassmorphismCard';
import { format } from 'date-fns';

interface Student {
  id: string;
  name: string;
  email: string;
  submissionDate: Date | null;
  documentName: string | null;
  plagiarismScore: number | null;
  reportGenerated: boolean;
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

const AssignmentView = () => {
  const { courseId, assignmentId } = useParams<{ courseId: string, assignmentId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isCheckingPlagiarism, setIsCheckingPlagiarism] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [plagiarismReportUrl, setPlagiarismReportUrl] = useState<string | null>(null);

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Mock data fetch for course and assignment details
  useEffect(() => {
    if (courseId && assignmentId) {
      // In a real app, this would be API calls
      setCourse({
        id: courseId,
        name: courseId === '1' ? 'Advanced Programming' : 
              courseId === '2' ? 'Data Structures' : 
              courseId === '3' ? 'Machine Learning' : 'Unknown Course',
      });

      setAssignment({
        id: assignmentId,
        title: assignmentId === '1' ? 'Midterm Assignment' : 
               assignmentId === '2' ? 'Final Project' : 
               assignmentId === '3' ? 'Practical Exam' : 'Unknown Assignment',
        deadline: new Date(2023, 11, 15),
        type: assignmentId === '3' ? 'exam' : 'assignment',
        description: 'This assignment tests the understanding of key concepts covered in the course. Students are expected to submit their work by the deadline.'
      });

      // Mock student data
      setStudents([
        {
          id: '1',
          name: 'John Smith',
          email: 'john.smith@example.com',
          submissionDate: new Date(2023, 10, 10),
          documentName: 'john_smith_assignment.pdf',
          plagiarismScore: null,
          reportGenerated: false
        },
        {
          id: '2',
          name: 'Emily Johnson',
          email: 'emily.johnson@example.com',
          submissionDate: new Date(2023, 10, 12),
          documentName: 'emily_johnson_submission.docx',
          plagiarismScore: 15,
          reportGenerated: true
        },
        {
          id: '3',
          name: 'Michael Brown',
          email: 'michael.brown@example.com',
          submissionDate: new Date(2023, 10, 8),
          documentName: 'michael_brown_project.pdf',
          plagiarismScore: 5,
          reportGenerated: true
        },
        {
          id: '4',
          name: 'Jessica Williams',
          email: 'jessica.williams@example.com',
          submissionDate: null,
          documentName: null,
          plagiarismScore: null,
          reportGenerated: false
        },
        {
          id: '5',
          name: 'David Miller',
          email: 'david.miller@example.com',
          submissionDate: new Date(2023, 10, 14),
          documentName: 'david_miller_assignment.docx',
          plagiarismScore: 48,
          reportGenerated: true
        }
      ]);
    }
  }, [courseId, assignmentId]);

  const handleCheckPlagiarism = (studentId: string) => {
    setIsCheckingPlagiarism(studentId);
    
    // Simulate plagiarism check
    setTimeout(() => {
      setStudents(prev => prev.map(student => {
        if (student.id === studentId) {
          // Generate random score for demo
          const score = Math.floor(Math.random() * 80);
          return {
            ...student,
            plagiarismScore: score,
            reportGenerated: true
          };
        }
        return student;
      }));
      
      setIsCheckingPlagiarism(null);
      
      toast({
        title: "Plagiarism check complete",
        description: "The plagiarism report has been generated successfully.",
      });
    }, 2000);
  };

  const handleViewReport = (student: Student) => {
    setSelectedStudent(student);
    // In a real app, this would fetch the actual report URL
    setPlagiarismReportUrl(`/mock-report-${student.id}.pdf`);
    setShowReportModal(true);
  };

  const handleDownloadReport = (student: Student) => {
    // In a real app, this would trigger a download of the actual PDF report
    toast({
      title: "Report downloaded",
      description: `Plagiarism report for ${student.name} has been downloaded.`,
    });
  };

  if (!course || !assignment) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow pt-24 pb-16 px-6">
          <div className="container max-w-6xl mx-auto">
            <p>Loading details...</p>
          </div>
        </main>
      </div>
    );
  }

  // Calculate submission stats
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
          
          {/* Assignment details */}
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
                    <span>Due: <strong>{format(assignment.deadline, 'MMM d, yyyy')}</strong></span>
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
          
          {/* Students submissions */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold">Student Submissions</h2>
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
                                {format(student.submissionDate, 'MMM d, yyyy')}
                              </div>
                            </div>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {student.documentName ? (
                            <div className="flex items-center text-sm">
                              <FileText className="h-4 w-4 mr-1.5 text-muted-foreground" />
                              <span className="truncate max-w-[150px]">{student.documentName}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">No submission</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {student.plagiarismScore !== null ? (
                            <div className="flex items-center">
                              <div className={`h-2.5 w-2.5 rounded-full mr-2 ${
                                student.plagiarismScore > 30 
                                  ? 'bg-red-500' 
                                  : student.plagiarismScore > 15 
                                    ? 'bg-amber-500' 
                                    : 'bg-green-500'
                              }`}></div>
                              <span className={`font-medium ${
                                student.plagiarismScore > 30 
                                  ? 'text-red-500' 
                                  : student.plagiarismScore > 15 
                                    ? 'text-amber-500' 
                                    : 'text-green-500'
                              }`}>
                                {student.plagiarismScore}%
                              </span>
                            </div>
                          ) : student.submissionDate ? (
                            <span className="text-xs text-muted-foreground">Not checked</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
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
                              <CustomButton
                                size="sm"
                                loading={isCheckingPlagiarism === student.id}
                                onClick={() => handleCheckPlagiarism(student.id)}
                              >
                                Check Plagiarism
                              </CustomButton>
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
      
      {/* Report modal */}
      {showReportModal && selectedStudent && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <GlassmorphismCard className="w-full max-w-4xl max-h-[90vh] overflow-auto p-6">
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
                    Submitted: {selectedStudent.submissionDate ? format(selectedStudent.submissionDate, 'MMM d, yyyy, h:mm a') : 'Not submitted'}
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
                            selectedStudent.plagiarismScore && selectedStudent.plagiarismScore > 30 
                              ? '#ef4444' 
                              : selectedStudent.plagiarismScore && selectedStudent.plagiarismScore > 15 
                                ? '#f59e0b' 
                                : '#22c55e'
                          } 
                          strokeWidth="2" 
                          strokeDasharray="100" 
                          strokeDashoffset={100 - (selectedStudent.plagiarismScore || 0)}
                          transform="rotate(-90 18 18)"
                        ></circle>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-lg font-bold">
                        <span className={selectedStudent.plagiarismScore && selectedStudent.plagiarismScore > 30 
                          ? 'text-red-500' 
                          : selectedStudent.plagiarismScore && selectedStudent.plagiarismScore > 15 
                            ? 'text-amber-500' 
                            : 'text-green-500'
                        }>
                          {selectedStudent.plagiarismScore}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Similarity Score</p>
                    <p className={`text-sm font-bold ${
                      selectedStudent.plagiarismScore && selectedStudent.plagiarismScore > 30 
                        ? 'text-red-500' 
                        : selectedStudent.plagiarismScore && selectedStudent.plagiarismScore > 15 
                          ? 'text-amber-500' 
                          : 'text-green-500'
                    }`}>
                      {selectedStudent.plagiarismScore && selectedStudent.plagiarismScore > 30 
                        ? 'High Similarity' 
                        : selectedStudent.plagiarismScore && selectedStudent.plagiarismScore > 15 
                          ? 'Moderate Similarity' 
                          : 'Low Similarity'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mock report content */}
            <div className="space-y-6">
              <section>
                <h3 className="text-lg font-semibold mb-3">Summary</h3>
                <p className="text-sm mb-2">
                  This document was analyzed for plagiarism against our database of academic papers, online sources, and other student submissions in this class.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Sources Matched</p>
                    <p className="text-xl font-bold">3</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Similar Passages</p>
                    <p className="text-xl font-bold">5</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Word Count</p>
                    <p className="text-xl font-bold">1,248</p>
                  </div>
                </div>
              </section>
              
              <section>
                <h3 className="text-lg font-semibold mb-3">Matching Sources</h3>
                <div className="space-y-3">
                  <div className="p-4 border border-border rounded-lg">
                    <div className="flex justify-between mb-1">
                      <p className="font-medium">Student Paper: Michael Brown</p>
                      <span className="text-amber-500 font-medium">18% Match</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">Assignment: {assignment.title}</p>
                    <div className="bg-muted/30 p-3 rounded text-sm">
                      <p>"The implementation of advanced algorithms requires a thorough understanding of computational complexity and data structures. This paper explores how these concepts apply to real-world scenarios..."</p>
                    </div>
                  </div>
                  
                  <div className="p-4 border border-border rounded-lg">
                    <div className="flex justify-between mb-1">
                      <p className="font-medium">Online Source: Introduction to Algorithms (3rd Edition)</p>
                      <span className="text-green-500 font-medium">8% Match</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">Publisher: MIT Press, 2009</p>
                    <div className="bg-muted/30 p-3 rounded text-sm">
                      <p>"The study of algorithms forms a fundamental aspect of computer science education. By analyzing algorithm efficiency, we can determine which solutions will work best for specific problems..."</p>
                    </div>
                  </div>
                </div>
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
                onClick={() => {
                  handleDownloadReport(selectedStudent);
                  setShowReportModal(false);
                }}
              >
                Download PDF Report
              </CustomButton>
            </div>
          </GlassmorphismCard>
        </div>
      )}
      
      {/* Simple footer */}
      <footer className="bg-secondary py-6 px-6">
        <div className="container mx-auto text-center">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} VeriWrite. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AssignmentView;
