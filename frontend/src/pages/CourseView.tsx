import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PlusCircle, FileText, Calendar, Users, ArrowLeft,
  DownloadCloud, Trash2, UserPlus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { format } from 'date-fns';

import Navbar from '@/components/Navbar';
import CustomButton from '@/components/ui/CustomButton';
import GlassmorphismCard from '@/components/ui/GlassmorphismCard';
import ManageStudents from '@/components/ManageStudents';
import Footer from '@/components/Footer';

// Define the API base URL from your environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Assignment {
  id: string;
  title: string;
  deadline: Date;
  submissionsCount: number;
  totalStudents: number;
  type: 'assignment' | 'exam';
  description?: string;
  hasFile?: boolean;
}

interface Course {
  id: string;
  name: string;
  description: string;
  students: number;
  color: string;
  numAssignments?: number;
  numExams?: number;
}

const CourseView = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentType, setAssignmentType] = useState<'assignment' | 'exam'>('assignment');
  const [assignmentDeadline, setAssignmentDeadline] = useState('');
  const [description, setDescription] = useState('');
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null); // Moved next to description
  const [showManageStudents, setShowManageStudents] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fetchCourseData = useCallback(async () => {
    if (!courseId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "No token found. Please log in.",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/courses/view-course/${courseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;

      setCourse({
        id: data.id,
        name: data.name,
        description: data.description,
        students: data.numStudents,
        color: 'from-blue-500/20 to-blue-600/20',
        numAssignments: data.numAssignments,
        numExams: data.numExams,
      });

      const fetchedAssignments: Assignment[] = data.tasks.map((task: any) => {
        const [submissionsCountStr, totalStudentsStr] = task.submissions.split('/');
        return {
          id: task.id,
          title: task.title,
          deadline: new Date(task.deadline),
          submissionsCount: parseInt(submissionsCountStr),
          totalStudents: parseInt(totalStudentsStr),
          type: task.type.toLowerCase(),
          description: task.description || '',
          hasFile: task.hasFile || false,
        };
      });
      setAssignments(fetchedAssignments.sort((a, b) => b.deadline.getTime() - a.deadline.getTime()));

    } catch (error: any) {
      console.error("Error fetching course details:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to load course details. Please try again.",
        variant: "destructive",
      });
      if (error.response && (error.response.status === 404 || error.response.status === 403)) {
        navigate('/classroom');
      }
    } finally {
      setIsLoading(false);
    }
  }, [courseId, toast, navigate]);

  useEffect(() => {
    fetchCourseData();
  }, [fetchCourseData]);

  const handleDeleteAssignment = async (assignmentId: string, type: 'assignment' | 'exam', title: string) => {
    if (!window.confirm(`Are you sure you want to delete the ${type} "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/assignment/${type}/${assignmentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast({
        title: `${type === 'assignment' ? 'Assignment' : 'Exam'} deleted`,
        description: `"${title}" has been deleted.`,
      });

      await fetchCourseData();

    } catch (error: any) {
      console.error(`Error deleting ${type}:`, error);
      toast({
        title: "Error",
        description: error.response?.data?.error || `Failed to delete ${type}.`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteCourse = async () => {
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone, and all associated assignments/exams will be removed.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/courses/${course?.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast({
        title: "Course deleted",
        description: `${course?.name} has been deleted successfully.`,
      });
      navigate('/classroom');

    } catch (error: any) {
      console.error("Error deleting course:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete course.",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileSizeInMB = file.size / (1024 * 1024);
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/png', 'image/jpeg', 'image/jpg'
      ];

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Only PDF, Word (doc, docx), Text (txt), and Image (png, jpg, jpeg) files are allowed.",
          variant: "destructive",
        });
        setAssignmentFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const fileName = file.name.toLowerCase();
      const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
      const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.png', '.jpg', '.jpeg'];

      if (!allowedExtensions.includes(fileExtension) && !allowedTypes.includes(file.type)) {
          toast({
           title: "Invalid File Type",
           description: "Only PDF, Word (doc, docx), Text (txt), and Image (png, jpg, jpeg) files are allowed (based on extension).",
           variant: "destructive",
         });
        setAssignmentFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      if (fileSizeInMB > 10) {
        toast({
          title: "File Too Large",
          description: "Please upload a file smaller than 10MB.",
          variant: "destructive",
        });
        setAssignmentFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setAssignmentFile(file);
    } else {
      setAssignmentFile(null);
    }
  };

  const clearFile = () => {
    setAssignmentFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreateAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!assignmentTitle.trim()) {
      toast({
        title: "Title required",
        description: `Please enter a title for the ${assignmentType}.`,
        variant: "destructive",
      });
      return;
    }

    const isDuplicateTitle = assignments.some(
      (assignment) =>
        assignment.title.trim().toLowerCase() === assignmentTitle.trim().toLowerCase() &&
        assignment.type === assignmentType
    );

    if (isDuplicateTitle) {
      toast({
        title: "Duplicate Title",
        description: `An ${assignmentType} with the title "${assignmentTitle}" already exists in this course. Please choose a different title.`,
        variant: "destructive",
      });
      return;
    }

    if (!assignmentDeadline) {
      toast({
        title: "Deadline required",
        description: `Please select a deadline for the ${assignmentType}.`,
        variant: "destructive",
      });
      return;
    }

    const deadlineDate = new Date(assignmentDeadline);
    if (isNaN(deadlineDate.getTime()) || deadlineDate <= new Date()) {
      toast({
        title: "Invalid Deadline",
        description: "Please select a valid future date and time for the deadline.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingAssignment(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "No token found. Please log in.",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      const formData = new FormData();
      formData.append('classroomId', courseId || '');
      formData.append('title', assignmentTitle.trim());
      formData.append('type', assignmentType.charAt(0).toUpperCase() + assignmentType.slice(1));
      formData.append('deadline', assignmentDeadline);
      formData.append('description', description.trim());
      if (assignmentFile) {
        formData.append('file', assignmentFile);
      }

      const response = await axios.post(`${API_BASE_URL}/api/assignment/create-assignment`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast({
        title: `${assignmentType === 'assignment' ? 'Assignment' : 'Exam'} created`,
        description: `${response.data.task?.title || assignmentTitle} has been created successfully.`,
      });

      if (response.data.task) {
        const newTask = {
          id: response.data.task.id,
          title: response.data.task.title,
          deadline: new Date(response.data.task.deadline),
          submissionsCount: 0,
          totalStudents: course?.students || 0,
          type: response.data.task.type.toLowerCase(),
          description: response.data.task.description,
          hasFile: response.data.task.hasFile,
        };
        setAssignments(prevAssignments =>
          [newTask, ...prevAssignments].sort((a, b) => b.deadline.getTime() - a.deadline.getTime())
        );
        setCourse(prevCourse => {
          if (!prevCourse) return null;
          return {
            ...prevCourse,
            numAssignments: newTask.type === 'assignment' ? (prevCourse.numAssignments || 0) + 1 : prevCourse.numAssignments,
            numExams: newTask.type === 'exam' ? (prevCourse.numExams || 0) + 1 : prevCourse.numExams,
          };
        });
      }

      // Clear form fields and hide form (ONLY ONCE)
      setAssignmentTitle('');
      setAssignmentDeadline('');
      setAssignmentFile(null);
      setDescription('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setShowCreateAssignment(false);

      await fetchCourseData();

    } catch (error: any) {
      console.error(`Error creating ${assignmentType}:`, error);
      toast({
        title: "Error",
        description: error.response?.data?.error || `Failed to create ${assignmentType}.`,
        variant: "destructive",
      });
    } finally {
      setIsCreatingAssignment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow pt-24 pb-16 px-6">
          <div className="container max-w-6xl mx-auto">
            <p className="text-center text-lg text-white">Loading course details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow pt-24 pb-16 px-6">
          <div className="container max-w-6xl mx-auto">
            <p className="text-center text-lg text-red-500">Course not found or access denied.</p>
            <div className="flex justify-center mt-4">
              <CustomButton
                variant="outline"
                onClick={() => navigate('/classroom')}
                icon={<ArrowLeft className="h-4 w-4" />}
              >
                Back to Classroom
              </CustomButton>
            </div>
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
        <div className="container max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div className="flex items-center gap-3">
              <CustomButton
                variant="outline"
                size="sm"
                onClick={() => navigate('/classroom')}
                icon={<ArrowLeft className="h-4 w-4" />}
              >
                Back to Classroom
              </CustomButton>
              <div>
                <h1 className="text-3xl font-bold text-white">{course.name}</h1>
                <p className="text-muted-foreground mt-1">{course.description}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <CustomButton
                variant="outline"
                onClick={() => setShowManageStudents(true)}
                icon={<UserPlus className="h-4 w-4" />}
              >
                Manage Students
              </CustomButton>
              <CustomButton
                onClick={() => setShowCreateAssignment(true)}
                icon={<PlusCircle className="h-4 w-4" />}
                disabled={isCreatingAssignment}
              >
                {isCreatingAssignment ? 'Creating...' : 'Create Assignment or Exam'}
              </CustomButton>
              <CustomButton
                variant="outline"
                onClick={handleDeleteCourse}
                icon={<Trash2 className="h-4 w-4" />}
              >
                Delete Course
              </CustomButton>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <GlassmorphismCard className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-veri/10 rounded-full">
                  <Users className="h-5 w-5 text-veri" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Students</p>
                  <h3 className="text-2xl font-bold text-white">{course.students}</h3>
                </div>
              </div>
            </GlassmorphismCard>

            <GlassmorphismCard className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-veri/10 rounded-full">
                  <FileText className="h-5 w-5 text-veri" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Assignments</p>
                  <h3 className="text-2xl font-bold text-white">{course.numAssignments ?? assignments.filter(a => a.type === 'assignment').length}</h3>
                </div>
              </div>
            </GlassmorphismCard>

            <GlassmorphismCard className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-veri/10 rounded-full">
                  <Calendar className="h-5 w-5 text-veri" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Exams</p>
                  <h3 className="text-2xl font-bold text-white">{course.numExams ?? assignments.filter(a => a.type === 'exam').length}</h3>
                </div>
              </div>
            </GlassmorphismCard>
          </div>

          {showManageStudents && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
              <ManageStudents
                courseId={courseId || ''}
                onClose={() => setShowManageStudents(false)}
                onStudentsUpdated={fetchCourseData}
              />
            </div>
          )}

          {showCreateAssignment && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
              <GlassmorphismCard className="p-6 w-full max-w-2xl overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-white">{assignmentType === 'assignment' ? 'Create New Assignment' : 'Create New Exam'}</h2>
                  <button
                    onClick={() => {
                        setShowCreateAssignment(false);
                        setAssignmentTitle('');
                        setAssignmentDeadline('');
                        setAssignmentFile(null);
                        setDescription('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateAssignmentSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="assignmentType" className="block text-sm font-medium mb-1 text-white">Type</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer text-white">
                        <input
                          type="radio"
                          name="assignmentType"
                          value="assignment"
                          checked={assignmentType === 'assignment'}
                          onChange={() => setAssignmentType('assignment')}
                          className="h-4 w-4 text-veri"
                        />
                        <span>Assignment</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-white">
                        <input
                          type="radio"
                          name="assignmentType"
                          value="exam"
                          checked={assignmentType === 'exam'}
                          onChange={() => setAssignmentType('exam')}
                          className="h-4 w-4 text-veri"
                        />
                        <span>Exam</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="assignmentTitle" className="block text-sm font-medium mb-1 text-white">Title*</label>
                    <input
                      type="text"
                      id="assignmentTitle"
                      className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                      placeholder={`e.g., Midterm ${assignmentType === 'assignment' ? 'Assignment' : 'Exam'}`}
                      value={assignmentTitle}
                      onChange={(e) => setAssignmentTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="assignmentDescription" className="block text-sm font-medium mb-1 text-white">Description</label>
                    <textarea
                      id="assignmentDescription"
                      className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                      rows={3}
                      placeholder="Enter assignment description..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="assignmentDeadline" className="block text-sm font-medium mb-1 text-white">Deadline*</label>
                    <input
                      type="datetime-local"
                      id="assignmentDeadline"
                      className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                      value={assignmentDeadline}
                      onChange={(e) => setAssignmentDeadline(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-white">Upload File (Optional)</label>
                    <div className="border border-dashed border-border rounded-md p-6 text-center bg-background/60">
                      <div className="flex flex-col items-center">
                        <DownloadCloud className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Drag and drop a file, or <span className="text-veri font-medium">browse</span>
                        </p>
                        <p className="text-xs text-muted-foreground mb-4">
                          PDF, Word, Text, or Image files (max 10MB)
                        </p>
                        <input
                          type="file"
                          id="fileUpload"
                          className="hidden"
                          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                          onChange={handleFileChange}
                          ref={fileInputRef}
                        />
                        <label htmlFor="fileUpload">
                          <CustomButton
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            Select File
                          </CustomButton>
                        </label>
                      </div>

                      {assignmentFile && (
                        <div className="mt-4 p-3 bg-secondary/50 rounded-md flex items-center justify-between">
                          <p className="text-sm font-medium truncate text-white">{assignmentFile.name}</p>
                          <button
                            type="button"
                            onClick={clearFile}
                            className="text-muted-foreground hover:text-foreground text-xl leading-none"
                            aria-label="Remove file"
                          >
                            &times;
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end">
                    <CustomButton
                      variant="outline"
                      onClick={() => {
                          setShowCreateAssignment(false);
                          setAssignmentTitle('');
                          setAssignmentDeadline('');
                          setAssignmentFile(null);
                          setDescription('');
                          if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      disabled={isCreatingAssignment}
                    >
                      Cancel
                    </CustomButton>
                    <CustomButton type="submit" disabled={isCreatingAssignment}>
                      {isCreatingAssignment ? 'Creating...' : `Create ${assignmentType === 'assignment' ? 'Assignment' : 'Exam'}`}
                    </CustomButton>
                  </div>
                </form>
              </GlassmorphismCard>
            </div>
          )}

          <h2 className="text-xl font-bold mb-4 text-white">Assignments & Exams</h2>
          <div className="space-y-4">
            {assignments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignments.map((assignment) => (
                  <GlassmorphismCard key={assignment.id} className="p-6 hover:shadow-md transition-all flex flex-col justify-between"> {/* Added flex-col & justify-between */}
                    <div className="flex flex-col flex-grow"> {/* Ensured content grows */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          assignment.type === 'exam'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                        }`}>
                          {assignment.type === 'exam' ? 'Exam' : 'Assignment'}
                        </span>
                        <h3 className="font-semibold text-white">{assignment.title}</h3>
                      </div>
                      {assignment.description && (
                        <p className="text-sm text-muted-foreground mb-2">{assignment.description}</p>
                      )}

                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground mt-auto"> {/* mt-auto pushes details up */}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Due: {format(assignment.deadline, 'MMM d, h:mm a')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>
                            Submissions: {assignment.submissionsCount}/{assignment.totalStudents}
                          </span>
                        </div>
                        {assignment.hasFile && (
                          <div className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              <span>File attached</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Button Section: Changed to flex-col for small screens, gap for spacing */}
                    <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t border-border/50"> {/* Added mt-4 pt-4 border-t for separation */}
                      <CustomButton
                        onClick={() => navigate(`/classroom/${courseId}/assignment/${assignment.id}`)}
                        size="sm"
                        className="w-full sm:w-auto" // Full width on small, auto on larger
                      >
                        View {assignment.type === 'exam' ? 'Exam' : 'Assignment'}
                      </CustomButton>
                      <CustomButton
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAssignment(assignment.id, assignment.type, assignment.title)}
                        icon={<Trash2 className="h-4 w-4" />}
                        className="w-full sm:w-auto" // Full width on small, auto on larger
                      >
                        Delete
                      </CustomButton>
                    </div>
                  </GlassmorphismCard>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-lg border border-border">
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">No assignments or exams yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first assignment or exam to get started.
                </p>
                <CustomButton
                  onClick={() => setShowCreateAssignment(true)}
                  icon={<PlusCircle className="h-4 w-4" />}
                >
                  Create Assignment
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

export default CourseView;