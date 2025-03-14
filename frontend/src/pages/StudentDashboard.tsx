
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import GlassmorphismCard from '@/components/ui/GlassmorphismCard';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, PlusCircle, Clock } from 'lucide-react';
import CustomButton from '@/components/ui/CustomButton';
import { useToast } from '@/hooks/use-toast';

const StudentDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleJoinClass = () => {
    toast({
      title: "Join classroom",
      description: "Feature coming soon",
    });
  };

  // Mock data for enrolled courses
  const enrolledCourses = [
    {
      id: '1',
      name: 'Introduction to Programming',
      instructor: 'Dr. Jane Smith',
      nextAssignment: 'Week 5 Quiz',
      deadline: '2023-10-30T23:59:59',
    },
    {
      id: '2',
      name: 'Data Structures',
      instructor: 'Prof. Robert Johnson',
      nextAssignment: 'Assignment 3: Binary Trees',
      deadline: '2023-11-05T23:59:59',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-28 pb-16 px-6">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Student Dashboard</h1>
            <CustomButton onClick={handleJoinClass}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Join Class
            </CustomButton>
          </div>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Welcome, {user?.name || 'Student'}</h2>
            <p className="text-muted-foreground">
              View your enrolled courses, upcoming assignments, and join new classrooms.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses.map((course) => (
              <GlassmorphismCard key={course.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{course.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">Instructor: {course.instructor}</p>
                  </div>
                  <div className="p-2 rounded-full bg-secondary/50">
                    <BookOpen className="h-5 w-5 text-veri" />
                  </div>
                </div>
                
                <div className="border-t border-border/50 pt-4 mt-4">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Next Assignment
                  </h4>
                  <p className="mt-1">{course.nextAssignment}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Due: {new Date(course.deadline).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="mt-6">
                  <CustomButton variant="outline" size="sm" fullWidth>
                    View Course
                  </CustomButton>
                </div>
              </GlassmorphismCard>
            ))}
            
            {/* Join New Class Card */}
            <GlassmorphismCard className="p-6 border border-dashed border-border/70 bg-secondary/30 flex flex-col items-center justify-center text-center">
              <div className="p-3 rounded-full bg-secondary/50 mb-4">
                <PlusCircle className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Join a New Classroom</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Enter an invitation code from your instructor to join a new class
              </p>
              <CustomButton variant="outline" onClick={handleJoinClass}>
                Join Classroom
              </CustomButton>
            </GlassmorphismCard>
          </div>
        </div>
      </main>
      
      {/* Footer */}
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

export default StudentDashboard;
