
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Calendar, Clock, Filter, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CustomButton from '@/components/ui/CustomButton';
import GlassmorphismCard from '@/components/ui/GlassmorphismCard';
import { format } from 'date-fns';

interface Assignment {
  id: string;
  title: string;
  deadline: Date;
  submitted: boolean;
  submittedAt?: Date;
  description?: string;
  type: 'assignment' | 'exam';
}

const StudentCourseView = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courseName, setCourseName] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'submitted'>('all');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Mock data for course and assignments
  useEffect(() => {
    if (courseId) {
      // Set course name based on id
      setCourseName(
        courseId === '1' ? 'Advanced Programming' : 
        courseId === '2' ? 'Data Structures' : 'Course'
      );

      // Mock assignments for this course
      setAssignments([
        {
          id: '1',
          title: 'Midterm Project: Building a Web Application',
          deadline: new Date(2023, 11, 15),
          submitted: true,
          submittedAt: new Date(2023, 11, 10),
          description: 'Create a functional web application that demonstrates your understanding of the core concepts.',
          type: 'assignment'
        },
        {
          id: '2',
          title: 'Final Project: Full-Stack Implementation',
          deadline: new Date(2023, 11, 30),
          submitted: false,
          description: 'Develop a complete full-stack application with authentication, database integration, and responsive UI.',
          type: 'assignment'
        },
        {
          id: '3',
          title: 'Practical Midterm Exam',
          deadline: new Date(2023, 10, 25),
          submitted: true,
          submittedAt: new Date(2023, 10, 24),
          description: 'A hands-on exam to test your practical skills in programming and problem-solving.',
          type: 'exam'
        },
        {
          id: '4',
          title: 'Weekly Assignment: Algorithm Implementation',
          deadline: new Date(2023, 12, 5),
          submitted: false,
          description: 'Implement the discussed algorithms and submit your code with proper documentation.',
          type: 'assignment'
        }
      ]);
    }
  }, [courseId]);

  // Filter assignments based on status
  const filteredAssignments = assignments.filter(assignment => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'pending') return !assignment.submitted;
    if (filterStatus === 'submitted') return assignment.submitted;
    return true;
  });

  // Determine if an assignment is overdue
  const isOverdue = (deadline: Date, submitted: boolean) => {
    if (submitted) return false;
    return new Date() > deadline;
  };

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
              onClick={() => navigate('/student-dashboard')}
              icon={<ArrowLeft className="h-4 w-4" />}
            >
              Back to Dashboard
            </CustomButton>
            <div>
              <h1 className="text-3xl font-bold">{courseName}</h1>
              <p className="text-muted-foreground mt-1">View all assignments and exams for this course</p>
            </div>
          </div>
          
          {/* Filter buttons */}
          <div className="flex gap-3 mb-6">
            <CustomButton 
              variant={filterStatus === 'all' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('all')}
              icon={<Filter className="h-4 w-4" />}
            >
              All
            </CustomButton>
            <CustomButton 
              variant={filterStatus === 'pending' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('pending')}
              icon={<Clock className="h-4 w-4" />}
            >
              Pending
            </CustomButton>
            <CustomButton 
              variant={filterStatus === 'submitted' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('submitted')}
              icon={<Check className="h-4 w-4" />}
            >
              Submitted
            </CustomButton>
          </div>
          
          {/* Assignments list */}
          <div className="space-y-4">
            {filteredAssignments.length > 0 ? (
              filteredAssignments.map((assignment) => (
                <GlassmorphismCard 
                  key={assignment.id} 
                  className={`p-6 hover:shadow-md transition-all ${
                    isOverdue(assignment.deadline, assignment.submitted) 
                      ? 'border-red-400 dark:border-red-700' 
                      : ''
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          assignment.type === 'exam' 
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' 
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                        }`}>
                          {assignment.type === 'exam' ? 'Exam' : 'Assignment'}
                        </span>
                        <h3 className="font-semibold line-clamp-1">{assignment.title}</h3>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {assignment.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Due: {format(assignment.deadline, 'MMM d, yyyy')}
                            {isOverdue(assignment.deadline, assignment.submitted) && (
                              <span className="text-red-500 ml-1">(Overdue)</span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {assignment.submitted ? (
                            <>
                              <Check className="h-4 w-4 text-green-500" />
                              <span className="text-green-500">
                                Submitted on {format(assignment.submittedAt!, 'MMM d, yyyy')}
                              </span>
                            </>
                          ) : (
                            <>
                              <X className="h-4 w-4 text-red-500" />
                              <span className="text-red-500">Not submitted</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <CustomButton 
                        onClick={() => navigate(`/student-assignment/${courseId}/${assignment.id}`)}
                        icon={<FileText className="h-4 w-4" />}
                      >
                        View {assignment.type === 'exam' ? 'Exam' : 'Assignment'}
                      </CustomButton>
                    </div>
                  </div>
                </GlassmorphismCard>
              ))
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-lg border border-border">
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No {filterStatus} assignments found</h3>
                <p className="text-muted-foreground mb-6">
                  {filterStatus === 'all' 
                    ? 'There are no assignments or exams for this course yet.' 
                    : filterStatus === 'pending' 
                      ? 'You have submitted all assignments for this course.' 
                      : 'You have not submitted any assignments for this course yet.'}
                </p>
                <CustomButton 
                  variant="outline"
                  onClick={() => setFilterStatus('all')}
                >
                  View All
                </CustomButton>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default StudentCourseView;
