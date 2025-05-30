import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Users, Link2, FileText, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import Navbar from '@/components/Navbar';
import CustomButton from '@/components/ui/CustomButton';
import GlassmorphismCard from '@/components/ui/GlassmorphismCard';
import { useAuth } from '@/context/AuthContext'; 

interface Course {
  id: string;
  name: string;
  description: string;
  students: number;
  assignments: number;
  color: string;
  inviteLink?: string; // Add inviteLink for teacher's view
}

const Classroom = () => {
  const navigate = useNavigate();
  
  const { user } = useAuth();
  const { toast } = useToast();
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [showGenerateLink, setShowGenerateLink] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [generatedLink, setGeneratedLink] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Function to get a random color class (can stay frontend-side)
  const getRandomColorClass = useCallback(() => {
    const colors = [
      'from-blue-500/20 to-blue-600/20',
      'from-green-500/20 to-green-600/20',
      'from-purple-500/20 to-purple-600/20',
      'from-yellow-500/20 to-yellow-600/20',
      'from-red-500/20 to-red-600/20',
      'from-teal-500/20 to-teal-600/20'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  // --- API Calls ---

  // 1. Fetch Teacher's Classrooms / Student's Enrolled Classrooms
  const fetchCourses = useCallback(async () => {
    // Get the token directly from localStorage
    const currentToken = localStorage.getItem('token');

    if (!currentToken || !user?.role) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let endpoint = '';
      if (user.role === 'teacher') {
        endpoint = `${API_BASE_URL}/api/courses/teacher-classrooms`;
      } else if (user.role === 'student') {
       
        // You'll need a route like: GET /api/student/classrooms in your backend
        endpoint = `${API_BASE_URL}/api/student/classrooms`; // Placeholder for student route
      } else {
        setLoading(false);
        return;
      }

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`, // Use the token from localStorage
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch classrooms: ${response.statusText}`);
      }

      const data = await response.json();

      // Map backend data to frontend Course interface
      const fetchedCourses: Course[] = data.classrooms.map((classroom: any) => ({
        id: classroom.id,
        name: classroom.name,
        description: classroom.description,
        students: classroom.numStudents,
        assignments: classroom.numAssignments,
        color: getRandomColorClass(), // Assign a random color 
        inviteLink: classroom.inviteLink 
      }));
      setCourses(fetchedCourses);

    } catch (err: any) {
      console.error("Error fetching courses:", err);
      setError(err.message || "Failed to load courses.");
      toast({
        title: "Failed to load courses",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, user?.role, getRandomColorClass, toast]); 

  useEffect(() => {
    // Only fetch if user and API_BASE_URL are available
    if (user && API_BASE_URL) {
      fetchCourses();
    }
  }, [user, API_BASE_URL, fetchCourses]); // Added user to dependency array to trigger fetch when user loads

  // 2. Create Classroom (Teacher Only)
  const handleCreateCourse = async () => {
    if (!courseName.trim()) {
      toast({
        title: "Course name required",
        description: "Please enter a course name",
        variant: "destructive",
      });
      return;
    }

    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
        toast({
            title: "Authentication Error",
            description: "You are not authenticated to create a course. Please log in.",
            variant: "destructive",
        });
        return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/courses/create-classroom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`, 
        },
        body: JSON.stringify({ name: courseName, description: courseDescription }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to create course: ${response.statusText}`);
      }

      const data = await response.json();
      const newBackendCourse = data.classroom;

      // Add the new course to the local state, mapping backend fields
      const newCourse: Course = {
        id: newBackendCourse.id,
        name: newBackendCourse.name,
        description: newBackendCourse.description,
        students: 0, 
        assignments: 0, 
        color: getRandomColorClass(), 
        inviteLink: newBackendCourse.inviteLink, 
      };

      setCourses(prev => [newCourse, ...prev]);
      setCourseName('');
      setCourseDescription('');
      setShowCreateCourse(false);

      toast({
        title: "Course created",
        description: `${newCourse.name} has been created successfully.`,
      });
    } catch (err: any) {
      console.error("Error creating course:", err);
      toast({
        title: "Failed to create course",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  // 3. Generate Invite Link (Teacher Only)
  // This function will display the already generated inviteLink from the course object
  const handleGenerateLink = (course: Course) => {
    if (course.inviteLink) {
      setSelectedCourse(course);
      setShowGenerateLink(true);
      // Construct the full URL using the inviteLink from the backend
      // Assuming your join route pattern is `/join/:courseId/:inviteCode`
      setGeneratedLink(`${API_BASE_URL}/join/${course.id}/${course.inviteLink}`);
    } else {
      toast({
        title: "No Invite Link",
        description: "This course does not have an invitation link.",
        variant: "destructive",
      });
    }
  };


  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    toast({
      title: "Link copied",
      description: "Invitation link copied to clipboard",
    });
  };

  const handleJoinClass = () => {
    toast({
      title: "Join class",
      description: "Please enter the class code provided by your teacher",
    });
    // Then make an API call to your backend: POST /api/student/join-course
  };

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow pt-24 pb-16 px-6">
        <div className="container max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold">My Classroom</h1>
              <p className="text-muted-foreground mt-1">
                {user?.role === 'teacher'
                  ? 'Manage your courses, students, and assignments'
                  : 'View your enrolled courses and assignments'
                }
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {user?.role === 'teacher' ? (
                <CustomButton
                  onClick={() => setShowCreateCourse(true)}
                  icon={<PlusCircle className="h-4 w-4" />}
                >
                  Create Course
                </CustomButton>
              ) : (
                <CustomButton
                  onClick={handleJoinClass}
                  icon={<PlusCircle className="h-4 w-4" />}
                >
                  Join Class
                </CustomButton>
              )}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative mb-8">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-border rounded-md bg-background"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Create course form */}
          {showCreateCourse && (
            <GlassmorphismCard className="mb-8 p-6 animate-fade-in">
              <h2 className="text-xl font-bold mb-4">Create New Course</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Course Name*</label>
                  <input
                    type="text"
                    className="w-full p-2 border border-border rounded-md bg-background"
                    placeholder="e.g., Advanced Programming"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                  <textarea
                    className="w-full p-2 border border-border rounded-md bg-background"
                    placeholder="Brief description of the course..."
                    rows={3}
                    value={courseDescription}
                    onChange={(e) => setCourseDescription(e.target.value)}
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <CustomButton
                    variant="outline"
                    onClick={() => setShowCreateCourse(false)}
                  >
                    Cancel
                  </CustomButton>
                  <CustomButton onClick={handleCreateCourse}>
                    Create Course
                  </CustomButton>
                </div>
              </div>
            </GlassmorphismCard>
          )}

          {/* Generate link modal */}
          {showGenerateLink && selectedCourse && (
            <GlassmorphismCard className="mb-8 p-6 animate-fade-in">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">Invitation Link</h2>
                <button
                  onClick={() => setShowGenerateLink(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
              <p className="mb-4">Share this link with students to join <strong>{selectedCourse.name}</strong>:</p>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  className="flex-grow p-2 border border-border rounded-md bg-background"
                  value={generatedLink}
                  readOnly
                />
                <CustomButton onClick={handleCopyLink}>
                  Copy
                </CustomButton>
              </div>
              <p className="text-sm text-muted-foreground">
                This link will allow students to directly join this course.
              </p>
            </GlassmorphismCard>
          )}

          {loading ? (
            <div className="text-center py-12">Loading courses...</div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">{error}</div>
          ) : (
            <>
              {/* Course grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course, index) => (
                  <div
                    key={course.id}
                    className="opacity-0 animate-slide-in"
                    style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'forwards' }}
                  >
                    <GlassmorphismCard className="overflow-hidden h-full flex flex-col">
                      <div className={`bg-gradient-to-r ${course.color} p-6`}>
                        <h3 className="text-xl font-bold mb-1 line-clamp-1">{course.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                      </div>
                      <div className="p-6 flex-grow">
                        <div className="flex justify-between mb-4">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span className="text-sm">{course.students} Students</span>
                          </div>
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span className="text-sm">{course.assignments} Assignments</span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <CustomButton
                            variant="outline"
                            fullWidth
                            onClick={() => navigate(`/classroom/${course.id}`)}
                          >
                            View Course
                          </CustomButton>

                          {user?.role === 'teacher' && (
                            <CustomButton
                              variant="secondary"
                              fullWidth
                              onClick={() => handleGenerateLink(course)}
                              icon={<Link2 className="h-4 w-4" />}
                            >
                              Invite Students
                            </CustomButton>
                          )}
                        </div>
                      </div>
                    </GlassmorphismCard>
                  </div>
                ))}
              </div>

              {filteredCourses.length === 0 && !loading && !error && (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No courses found</h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery ?
                      "No courses match your search criteria." :
                      user?.role === 'teacher' ?
                        "Start by creating your first course." :
                        "Join a class to get started."
                    }
                  </p>
                  {user?.role === 'teacher' && !searchQuery ? (
                    <CustomButton
                      onClick={() => setShowCreateCourse(true)}
                      icon={<PlusCircle className="h-4 w-4" />}
                    >
                      Create Your First Course
                    </CustomButton>
                  ) : !searchQuery ? (
                    <CustomButton
                      onClick={handleJoinClass}
                      icon={<PlusCircle className="h-4 w-4" />}
                    >
                      Join a Class
                    </CustomButton>
                  ) : (
                    <CustomButton
                      variant="outline"
                      onClick={() => setSearchQuery('')}
                    >
                      Clear Search
                    </CustomButton>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

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

export default Classroom;