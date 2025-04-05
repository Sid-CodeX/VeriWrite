
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, PlusCircle, Clock, FileText, CheckCircle, AlertTriangle, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CustomButton from '@/components/ui/CustomButton';
import GlassmorphismCard from '@/components/ui/GlassmorphismCard';
import { useAuth } from '@/context/AuthContext';

interface Course {
  id: string;
  name: string;
  instructor: string;
  totalAssignments: number;
  submittedAssignments: number;
  color: string;
  nextAssignment?: {
    title: string;
    deadline: Date;
  };
}

const StudentDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [showJoinClassForm, setShowJoinClassForm] = useState(false);
  const [classCode, setClassCode] = useState('');
  
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Mock data for enrolled courses
  useEffect(() => {
    setCourses([
      {
        id: '1',
        name: 'Advanced Programming',
        instructor: 'Dr. Jane Smith',
        totalAssignments: 4,
        submittedAssignments: 2,
        color: 'from-blue-500/20 to-blue-600/20',
        nextAssignment: {
          title: 'Final Project: Full-Stack Implementation',
          deadline: new Date(2023, 11, 30)
        }
      },
      {
        id: '2',
        name: 'Data Structures',
        instructor: 'Prof. Robert Johnson',
        totalAssignments: 5,
        submittedAssignments: 3,
        color: 'from-green-500/20 to-green-600/20',
        nextAssignment: {
          title: 'Assignment 3: Binary Trees',
          deadline: new Date(2023, 11, 5)
        }
      },
      {
        id: '3',
        name: 'Machine Learning Fundamentals',
        instructor: 'Dr. Emily Chen',
        totalAssignments: 3,
        submittedAssignments: 3,
        color: 'from-purple-500/20 to-purple-600/20'
      }
    ]);
  }, []);

  const handleJoinClass = () => {
    if (!classCode.trim()) {
      toast({
        title: "Class code required",
        description: "Please enter a valid class code",
        variant: "destructive",
      });
      return;
    }

    // Simulate joining a class
    toast({
      title: "Joining class",
      description: "Processing your request...",
    });

    setTimeout(() => {
      // Add a new mock course
      const newCourse: Course = {
        id: '4',
        name: 'Web Development',
        instructor: 'Prof. Michael Davis',
        totalAssignments: 0,
        submittedAssignments: 0,
        color: 'from-yellow-500/20 to-yellow-600/20'
      };

      setCourses(prev => [...prev, newCourse]);
      setClassCode('');
      setShowJoinClassForm(false);

      toast({
        title: "Class joined",
        description: `You have successfully joined ${newCourse.name}`,
      });
    }, 1500);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays < 0) return 'Past due';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays < 7) return `Due in ${diffDays} days`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-28 pb-16 px-6">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Student Dashboard</h1>
            <CustomButton 
              onClick={() => setShowJoinClassForm(true)}
              icon={<PlusCircle className="h-4 w-4" />}
            >
              Join Class
            </CustomButton>
          </div>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Welcome, {user?.name || 'Student'}</h2>
            <p className="text-muted-foreground">
              View your enrolled courses, manage assignments, and track your academic progress.
            </p>
          </div>
          
          {/* Join class form */}
          {showJoinClassForm && (
            <GlassmorphismCard className="mb-8 p-6 animate-fade-in">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">Join a Class</h2>
                <button 
                  onClick={() => setShowJoinClassForm(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
              <p className="mb-4 text-muted-foreground">
                Enter the class code provided by your instructor to join a new class.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Class Code*</label>
                  <input
                    type="text"
                    className="w-full p-2 border border-border rounded-md bg-background"
                    placeholder="e.g., ABC123"
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value)}
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <CustomButton
                    variant="outline"
                    onClick={() => setShowJoinClassForm(false)}
                  >
                    Cancel
                  </CustomButton>
                  <CustomButton onClick={handleJoinClass}>
                    Join Class
                  </CustomButton>
                </div>
              </div>
            </GlassmorphismCard>
          )}
          
          {/* Course stats summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <GlassmorphismCard className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-veri/10 rounded-full">
                  <BookOpen className="h-5 w-5 text-veri" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Courses</p>
                  <h3 className="text-2xl font-bold">{courses.length}</h3>
                </div>
              </div>
            </GlassmorphismCard>
            
            <GlassmorphismCard className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-veri/10 rounded-full">
                  <FileText className="h-5 w-5 text-veri" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Assignments</p>
                  <h3 className="text-2xl font-bold">
                    {courses.reduce((total, course) => total + course.totalAssignments, 0)}
                  </h3>
                </div>
              </div>
            </GlassmorphismCard>
            
            <GlassmorphismCard className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-veri/10 rounded-full">
                  <CheckCircle className="h-5 w-5 text-veri" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <h3 className="text-2xl font-bold">
                    {courses.reduce((total, course) => total + course.submittedAssignments, 0)}
                  </h3>
                </div>
              </div>
            </GlassmorphismCard>
          </div>
          
          {/* Enrolled courses */}
          <h2 className="text-xl font-semibold mb-4">My Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course.id} 
                className="opacity-0 animate-slide-in" 
                style={{ animationDelay: `${parseInt(course.id) * 0.1}s`, animationFillMode: 'forwards' }}
              >
                <GlassmorphismCard className="overflow-hidden h-full flex flex-col">
                  <div className={`bg-gradient-to-r ${course.color} p-6`}>
                    <h3 className="text-lg font-semibold mb-1">{course.name}</h3>
                    <p className="text-sm text-muted-foreground">Instructor: {course.instructor}</p>
                  </div>
                  
                  <div className="p-6 flex-grow flex flex-col">
                    <div className="mb-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Progress</span>
                        <span className="text-sm font-medium">
                          {Math.round((course.submittedAssignments / (course.totalAssignments || 1)) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-muted/50 rounded-full h-2">
                        <div 
                          className="bg-veri h-2 rounded-full" 
                          style={{ 
                            width: `${Math.round((course.submittedAssignments / (course.totalAssignments || 1)) * 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between mb-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total</p>
                        <p className="font-medium">{course.totalAssignments} assignments</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Submitted</p>
                        <p className="font-medium">{course.submittedAssignments} assignments</p>
                      </div>
                    </div>
                    
                    {course.nextAssignment && (
                      <div className="bg-muted/30 rounded-md p-3 mb-4">
                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          NEXT DUE
                        </p>
                        <p className="text-sm font-medium line-clamp-1">{course.nextAssignment.title}</p>
                        <p className="text-xs flex items-center gap-1 mt-1">
                          {new Date() > course.nextAssignment.deadline ? (
                            <AlertTriangle className="h-3 w-3 text-red-500" />
                          ) : (
                            <Calendar className="h-3 w-3 text-amber-500" />
                          )}
                          <span className={new Date() > course.nextAssignment.deadline ? "text-red-500" : "text-amber-500"}>
                            {formatDate(course.nextAssignment.deadline)}
                          </span>
                        </p>
                      </div>
                    )}
                    
                    <div className="mt-auto">
                      <CustomButton 
                        variant="primary" 
                        fullWidth
                        onClick={() => navigate(`/student-course/${course.id}`)}
                      >
                        View Course
                      </CustomButton>
                    </div>
                  </div>
                </GlassmorphismCard>
              </div>
            ))}
            
            {/* Join New Class Card */}
            <div 
              className="opacity-0 animate-slide-in" 
              style={{ animationDelay: `${(courses.length + 1) * 0.1}s`, animationFillMode: 'forwards' }}
            >
              <GlassmorphismCard className="p-6 border border-dashed border-border/70 bg-secondary/30 flex flex-col items-center justify-center text-center h-full">
                <div className="p-3 rounded-full bg-secondary/50 mb-4">
                  <PlusCircle className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Join a New Class</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Enter an invitation code from your instructor to join a new class
                </p>
                <CustomButton variant="outline" onClick={() => setShowJoinClassForm(true)}>
                  Join Class
                </CustomButton>
              </GlassmorphismCard>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default StudentDashboard;
