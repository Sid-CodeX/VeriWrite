import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, PlusCircle, Clock, FileText, CheckCircle, AlertTriangle, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CustomButton from '@/components/ui/CustomButton';
import GlassmorphismCard from '@/components/ui/GlassmorphismCard';
import { useAuth } from '@/context/AuthContext';

// Define the interface for the Classroom based on backend response
interface Classroom {
  classroomId: string;
  name: string;
  instructor: string; // From teacherId.name
  progress: number; // Calculated progress (0-100)
  totalAssignments: number;
  submittedAssignments: number;
  nextDue?: {
    title: string;
    dueDate: string; // Changed to string as backend sends ISO string
    pastDue: boolean;
  } | null;
  // Frontend specific property for styling
  color: string;
}

const StudentDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showJoinClassForm, setShowJoinClassForm] = useState(false);
  const [classCode, setClassCode] = useState('');

  // Define a set of appealing colors for the cards
  const cardColors = [
    'from-blue-500/20 to-blue-600/20',
    'from-green-500/20 to-green-600/20',
    'from-purple-500/20 to-purple-600/20',
    'from-yellow-500/20 to-yellow-600/20',
    'from-pink-500/20 to-pink-600/20',
    'from-indigo-500/20 to-indigo-600/20',
  ];

  // Get base URL from environment variables
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Function to fetch dashboard data (which contains classroom info)
  const fetchDashboardData = useCallback(async () => {
    if (!user) { // Ensure user is available for role check
      setLoading(false);
      setError("User not authenticated or user role not found.");
      return;
    }

    setLoading(true);
    setError(null);

    let endpoint = '';

    // Determine the correct endpoint based on user role
    if (user.role === 'student') {
      endpoint = `${API_BASE_URL}/api/studentcourses/dashboard`; // Use your actual student dashboard endpoint
    } else {
      console.warn("Non-student user attempting to access student dashboard.");
      setError("Access denied. Please log in as a student.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`, // Get token from localStorage
        },
      });

      // Assign colors dynamically to classrooms
      const classroomsWithColors = response.data.courses.map((classroom: any, index: number) => ({
        ...classroom,
        // Ensure that nextDue.dueDate is a Date object for frontend formatting
        nextDue: classroom.nextDue ? { ...classroom.nextDue, dueDate: new Date(classroom.nextDue.dueDate) } : null,
        color: cardColors[index % cardColors.length], // Cycle through predefined colors
      }));

      setClassrooms(classroomsWithColors);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      // More specific error message if it's an Axios error
      if (axios.isAxiosError(err) && err.response) {
        setError(`Failed to load classroom data: ${err.response.data.error || err.response.statusText}`);
      } else {
        setError("Failed to load classroom data. Please try again.");
      }
      toast({
        title: "Error",
        description: "Failed to load classroom data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast, API_BASE_URL]); // Add user and API_BASE_URL to dependencies

  // Fetch data on component mount
  useEffect(() => {
    window.scrollTo(0, 0); // Scroll to top on page load
    if (user) { // Only fetch if user data is available
      fetchDashboardData();
    }
  }, [user, fetchDashboardData]); // Depend on user and fetchDashboardData

  const handleJoinClass = async () => { // Made async for potential API call
    if (!classCode.trim()) {
      toast({
        title: "Class code required",
        description: "Please enter a valid class code",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Joining class",
      description: "Processing your request...",
    });

    try {
      // This is where you'd make the actual API call to join a class
      // You'll need a backend endpoint for this, e.g., POST /api/studentcourses/join
      await axios.post(`${API_BASE_URL}/api/studentcourses/join`, // Example join endpoint
        { classCode },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      toast({
        title: "Class joined",
        description: `You have successfully joined a new class!`,
      });

      // After successfully joining, re-fetch data to update the classroom list
      fetchDashboardData();
      setClassCode('');
      setShowJoinClassForm(false);

    } catch (err) {
      console.error("Error joining class:", err);
      if (axios.isAxiosError(err) && err.response) {
        toast({
          title: "Failed to join class",
          description: err.response.data.error || "An error occurred.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed to join class",
          description: "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString); // Ensure it's a Date object
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));

    if (isNaN(date.getTime())) { // Handle invalid dates
      return 'N/A';
    }

    if (diffDays < 0) return 'Past due';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays < 7) return `Due in ${diffDays} days`;
    return date.toLocaleDateString(); // Fallback for dates far in future
  };

  // Calculate total assignments and completed assignments from fetched data
  const totalAssignmentsOverall = classrooms.reduce((total, classroom) => total + classroom.totalAssignments, 0);
  const completedAssignmentsOverall = classrooms.reduce((total, classroom) => total + classroom.submittedAssignments, 0);

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
              View your enrolled classrooms, manage assignments, and track your academic progress.
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

          {loading && (
            <div className="text-center py-8">
              <p className="text-lg text-muted-foreground">Loading classroom data...</p>
              {/* Optional: Add a loading spinner here */}
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-red-500">
              <p className="text-lg">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Classroom stats summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <GlassmorphismCard className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-veri/10 rounded-full">
                      <BookOpen className="h-5 w-5 text-veri" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Classrooms</p>
                      <h3 className="text-2xl font-bold">{classrooms.length}</h3>
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
                      <h3 className="text-2xl font-bold">{totalAssignmentsOverall}</h3>
                    </div>
                  </div>
                </GlassmorphismCard>

                <GlassmorphismCard className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-veri/10 rounded-full">
                      <CheckCircle className="h-5 w-5 text-veri" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Completed Assignments</p>
                      <h3 className="text-2xl font-bold">{completedAssignmentsOverall}</h3>
                    </div>
                  </div>
                </GlassmorphismCard>
              </div>

              {/* Enrolled classrooms */}
              <h2 className="text-xl font-semibold mb-4">My Classrooms</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classrooms.length === 0 && (
                  <p className="col-span-full text-center text-muted-foreground">
                    You are not enrolled in any classrooms yet. Join one to get started!
                  </p>
                )}
                {classrooms.map((classroom, index) => (
                  <div key={classroom.classroomId}
                    className="opacity-0 animate-slide-in"
                    style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'forwards' }}
                  >
                    <GlassmorphismCard className="overflow-hidden h-full flex flex-col">
                      <div className={`bg-gradient-to-r ${classroom.color} p-6`}>
                        <h3 className="text-lg font-semibold mb-1">{classroom.name}</h3>
                        <p className="text-sm text-muted-foreground">Instructor: {classroom.instructor}</p>
                      </div>

                      {/* THIS WAS THE DIV WITH THE MISSING CLOSING TAG */}
                      <div className="p-6 flex-grow flex flex-col">
                        <div className="mb-4">
                          <div className="flex justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Progress</span>
                            <span className="text-sm font-medium">
                              {classroom.progress}%
                            </span>
                          </div>
                          <div className="w-full bg-muted/50 rounded-full h-2">
                            <div
                              className="bg-veri h-2 rounded-full"
                              style={{
                                width: `${classroom.progress}%`
                              }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex justify-between mb-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Total</p>
                            <p className="font-medium">{classroom.totalAssignments} assignments</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Submitted</p>
                            <p className="font-medium">{classroom.submittedAssignments} assignments</p>
                          </div>
                        </div>

                        {classroom.nextDue && (
                          <div className="bg-muted/30 rounded-md p-3 mb-4">
                            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              NEXT DUE
                            </p>
                            <p className="text-sm font-medium line-clamp-1">{classroom.nextDue.title}</p>
                            <p className="text-xs flex items-center gap-1 mt-1">
                              {classroom.nextDue.pastDue ? (
                                <AlertTriangle className="h-3 w-3 text-red-500" />
                              ) : (
                                <Calendar className="h-3 w-3 text-amber-500" />
                              )}
                              <span className={classroom.nextDue.pastDue ? "text-red-500" : "text-amber-500"}>
                                {formatDate(classroom.nextDue.dueDate)}
                              </span>
                            </p>
                          </div>
                        )}

                        <div className="mt-auto">
                          <CustomButton
                            variant="primary"
                            fullWidth
                            onClick={() => navigate(`/student-course/${classroom.classroomId}`)}
                          >
                            View Classroom
                          </CustomButton>
                        </div>
                      </div> {/* <--- **THIS IS THE CORRECTED CLOSING TAG** */}
                    </GlassmorphismCard>
                  </div>
                ))}

                {/* Join New Class Card */}
                <div
                  className="opacity-0 animate-slide-in"
                  style={{ animationDelay: `${(classrooms.length + 1) * 0.1}s`, animationFillMode: 'forwards' }}
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
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default StudentDashboard;