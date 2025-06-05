import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Calendar, Clock, Filter, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CustomButton from '@/components/ui/CustomButton';
import GlassmorphismCard from '@/components/ui/GlassmorphismCard';
import { format } from 'date-fns';

// Interface to match the backend response for a single assignment/exam item
interface Assignment {
  id: string; // _id from MongoDB
  title: string;
  deadline: string | null; // Allow null for safety
  submitted: boolean;
  submittedAt?: string | null; // Allow null for safety
  description?: string;
  type: 'assignment' | 'exam';
  isOverdue: boolean;
}

const StudentCourseView = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [courseName, setCourseName] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'submitted'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchCourseDetails = useCallback(async () => {
    if (!user || !courseId) {
      setLoading(false);
      setError("Authentication failed or course ID missing.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_BASE_URL}/api/studentcourses/${courseId}`, {
        params: { filter: filterStatus },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const { classroom, assignments: fetchedAssignments } = response.data;

      setCourseName(classroom.name);
      setCourseDescription(classroom.description);
      setTeacherName(classroom.teacher);
      setAssignments(fetchedAssignments);

    } catch (err) {
      console.error("Error fetching course details:", err);
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.error || `Failed to load course details: ${err.response.statusText}`);
      } else {
        setError("Failed to load course details. Please try again.");
      }
      toast({
        title: "Error",
        description: "Failed to load course details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, courseId, filterStatus, toast, API_BASE_URL]);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchCourseDetails();
  }, [fetchCourseDetails]);

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
              <p className="text-muted-foreground mt-1">Instructor: {teacherName}</p>
              <p className="text-muted-foreground mt-1">{courseDescription}</p>
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

          {loading && (
            <div className="text-center py-8">
              <p className="text-lg text-muted-foreground">Loading course details and assignments...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-red-500">
              <p className="text-lg">{error}</p>
              <CustomButton
                variant="outline"
                onClick={fetchCourseDetails}
                className="mt-4"
              >
                Retry
              </CustomButton>
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-4">
              {assignments.length > 0 ? (
                assignments.map((assignment) => (
                  <GlassmorphismCard
                    key={assignment.id}
                    className={`p-6 hover:shadow-md transition-all ${
                      assignment.isOverdue
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
                              Due:
                              {assignment.deadline && !isNaN(new Date(assignment.deadline).getTime()) ? (
                                format(new Date(assignment.deadline), 'MMM d, yyyy')
                              ) : (
                                ' N/A'
                              )}
                              {assignment.isOverdue && (
                                <span className="text-red-500 ml-1">(Overdue)</span>
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {assignment.submitted ? (
                              <>
                                <Check className="h-4 w-4 text-green-500" />
                                <span className="text-green-500">
                                  Submitted on
                                  {assignment.submittedAt && !isNaN(new Date(assignment.submittedAt).getTime()) ? (
                                    format(new Date(assignment.submittedAt), 'MMM d, yyyy')
                                  ) : (
                                    ' N/A'
                                  )}
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
                          // Line 160: Changed the navigation path to include both courseId and assignment.id
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
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default StudentCourseView;