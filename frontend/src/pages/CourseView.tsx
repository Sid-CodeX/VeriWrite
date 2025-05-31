import { useState, useEffect, useRef, useCallback } from 'react'; // Added useRef, useCallback
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Trash2, Edit, UserPlus, FileText, UploadCloud, DownloadCloud } from 'lucide-react'; // Added DownloadCloud
import axios from 'axios'; // Import axios

import GlassmorphismCard from '@/components/ui/GlassmorphismCard';
import CustomButton from '@/components/ui/CustomButton';
import AssignmentCard from '@/components/AssignmentCard';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useToast } from '@/hooks/use-toast';
import ManageStudents from '@/components/ManageStudents'; // Assuming this component exists

// Define your API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Course {
  id: string;
  name: string;
  description: string;
  students: number;
  color: string; // Assuming color is still static for now
}

interface Assignment {
  id: string;
  type: 'assignment' | 'exam';
  title: string;
  deadline: string;
  submissions: string; // e.g., "28/32"
  description: string; // Added description
  filePath?: string; // Added filePath for downloaded assignments
}

const CourseView = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for Create Assignment Modal
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [assignmentType, setAssignmentType] = useState<'assignment' | 'exam'>('assignment');
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignmentDeadline, setAssignmentDeadline] = useState('');
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for file input

  // State for Delete Confirmation Modal
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'course' | 'assignment' | 'exam'; id: string; title?: string } | null>(null);

  // State for Manage Students Modal
  const [showManageStudents, setShowManageStudents] = useState(false);

  // Fetch Course Data and Assignments
  const fetchCourseData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
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
        color: 'bg-indigo-500', // Static color for now
      });

      const fetchedAssignments: Assignment[] = data.tasks.map((task: any) => {
        const [submittedCountStr, totalStudentsStr] = task.submissions.split('/');
        const submissionsCount = parseInt(submittedCountStr, 10);
        const totalStudents = parseInt(totalStudentsStr, 10);

        return {
          id: task.id,
          type: task.type,
          title: task.title,
          deadline: task.deadline,
          submissions: `${submissionsCount}/${totalStudents}`, // Keep string format for display
          description: task.description || '', // Ensure description is set
          filePath: task.filePath || undefined, // Add filePath if available
        };
      }).sort((a: Assignment, b: Assignment) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

      setAssignments(fetchedAssignments);

    } catch (err: any) {
      console.error("Error fetching course data:", err);
      setError(err.response?.data?.error || "Failed to load course details. It might not exist or you don't have access.");
      toast({
        title: "Error",
        description: err.response?.data?.error || "Failed to load course details.",
        variant: "destructive",
      });
      // If course not found, navigate back
      if (err.response?.status === 404) {
        navigate('/classroom');
      }
    } finally {
      setIsLoading(false);
    }
  }, [courseId, toast, navigate]);

  useEffect(() => {
    fetchCourseData();
    window.scrollTo(0, 0); // Scroll to top on component mount
  }, [fetchCourseData]);


  // --- Handle Assignment Creation ---
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const fileSizeInMB = file.size / (1024 * 1024);
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Only PDF, Word (doc, docx), and Text (txt) files are allowed.",
          variant: "destructive",
        });
        setAssignmentFile(null);
        if (fileInputRef.current) fileInputRef.current.value = ''; // Clear input
        return;
      }

      if (fileSizeInMB > 10) {
        toast({
          title: "File Too Large",
          description: "Maximum file size is 10MB.",
          variant: "destructive",
        });
        setAssignmentFile(null);
        if (fileInputRef.current) fileInputRef.current.value = ''; // Clear input
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
      fileInputRef.current.value = ''; // Clear the file input field
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!assignmentTitle.trim() || !assignmentDeadline.trim()) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields (Title, Deadline).",
        variant: "destructive",
      });
      return;
    }

    // Basic date validation
    const deadlineDate = new Date(assignmentDeadline);
    if (isNaN(deadlineDate.getTime()) || deadlineDate <= new Date()) {
      toast({
        title: "Invalid Deadline",
        description: "Please select a future date and time for the deadline.",
        variant: "destructive",
      });
      return;
    }

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
      formData.append('title', assignmentTitle);
      formData.append('type', assignmentType);
      formData.append('deadline', assignmentDeadline);
      formData.append('description', description); // Include description

      if (assignmentFile) {
        formData.append('file', assignmentFile); // Append the file
      }

      // --- IMPORTANT: Corrected Backend Endpoint ---
      const response = await axios.post(`${API_BASE_URL}/api/assignment/create-assignment`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          // 'Content-Type': 'multipart/form-data', // Axios handles this automatically with FormData
        },
      });

      toast({
        title: "Success",
        description: `${assignmentType === 'assignment' ? 'Assignment' : 'Exam'} "${assignmentTitle}" created successfully.`,
      });

      // Clear form and close modal
      setAssignmentTitle('');
      setDescription('');
      setAssignmentDeadline('');
      setAssignmentFile(null);
      if (fileInputRef.current) fileInputRef.current.value = ''; // Clear input field
      setShowCreateAssignment(false);

      // Refresh course data to show the new assignment
      await fetchCourseData();

    } catch (err: any) {
      console.error("Error creating assignment:", err);
      toast({
        title: "Error Creating Assignment",
        description: err.response?.data?.error || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  // --- Handle Delete Confirmation ---
  const confirmDeletion = (type: 'course' | 'assignment' | 'exam', id: string, title?: string) => {
    setItemToDelete({ type, id, title });
    setShowDeleteConfirmation(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({ title: "Auth Error", description: "No token found.", variant: "destructive" });
        navigate('/login');
        return;
      }

      if (itemToDelete.type === 'course') {
        await axios.delete(`${API_BASE_URL}/api/courses/${itemToDelete.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast({ title: "Success", description: "Course deleted successfully." });
        navigate('/classroom'); // Redirect after course deletion
      } else { // assignment or exam
        // Your backend uses /api/assignment/assignment/:id or /api/assignment/exam/:id
        await axios.delete(`${API_BASE_URL}/api/assignment/${itemToDelete.type}/${itemToDelete.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast({ title: "Success", description: `${itemToDelete.type} deleted successfully.` });
        await fetchCourseData(); // Refresh assignments list
      }
    } catch (err: any) {
      console.error(`Error deleting ${itemToDelete.type}:`, err);
      toast({
        title: "Deletion Error",
        description: err.response?.data?.error || `Failed to delete ${itemToDelete.type}.`,
        variant: "destructive",
      });
    } finally {
      setShowDeleteConfirmation(false);
      setItemToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
        <p>Loading course details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-red-500 bg-gray-900">
        <p className="mb-4">{error}</p>
        <CustomButton onClick={() => navigate('/classroom')}>Go to Classrooms</CustomButton>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-white bg-gray-900">
        <p className="mb-4">Course not found.</p>
        <CustomButton onClick={() => navigate('/classroom')}>Go to Classrooms</CustomButton>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <CustomButton
        onClick={() => navigate('/classroom')}
        variant="outline"
        className="mb-6 flex items-center"
      >
        <ChevronLeft className="h-4 w-4 mr-2" /> Back to Classrooms
      </CustomButton>

      {/* Course Header */}
      <GlassmorphismCard className={`p-6 mb-8 ${course.color}`}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{course.name}</h1>
            <p className="text-lg text-gray-200">{course.description}</p>
          </div>
          <div className="flex gap-2">
            <CustomButton onClick={() => setShowManageStudents(true)} variant="secondary" size="sm">
              <UserPlus className="h-4 w-4 mr-2" /> Manage Students
            </CustomButton>
            {/* <CustomButton variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" /> Edit Course
            </CustomButton> */}
            <CustomButton onClick={() => confirmDeletion('course', course.id, course.name)} variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-2" /> Delete Course
            </CustomButton>
          </div>
        </div>
        <div className="flex items-center text-lg mt-4">
          <p className="mr-4">Students: {course.students}</p>
          {/* Add other stats like number of assignments/exams if desired */}
        </div>
      </GlassmorphismCard>

      {/* Assignments and Exams Section */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Assignments & Exams</h2>
        <CustomButton onClick={() => setShowCreateAssignment(true)} icon={<Plus className="h-4 w-4" />}>
          Create New
        </CustomButton>
      </div>

      {assignments.length === 0 ? (
        <GlassmorphismCard className="p-6 text-center text-muted-foreground">
          <p>No assignments or exams have been created yet. Click "Create New" to add one.</p>
        </GlassmorphismCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map(assignment => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              onDelete={() => confirmDeletion(assignment.type, assignment.id, assignment.title)}
            />
          ))}
        </div>
      )}

      {/* Create Assignment Modal */}
      {showCreateAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
          <GlassmorphismCard className="p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Create New {assignmentType === 'assignment' ? 'Assignment' : 'Exam'}</h2>
              <button
                onClick={() => setShowCreateAssignment(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              {/* Type Selection */}
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={assignmentType}
                  onChange={(e) => setAssignmentType(e.target.value as 'assignment' | 'exam')}
                  className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                >
                  <option value="assignment">Assignment</option>
                  <option value="exam">Exam</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={assignmentTitle}
                  onChange={(e) => setAssignmentTitle(e.target.value)}
                  className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                  placeholder="e.g., Chapter 1 Homework"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 border border-border rounded-md bg-background text-foreground min-h-[80px]"
                  placeholder="Provide details about the assignment..."
                ></textarea>
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-sm font-medium mb-1">Deadline</label>
                <input
                  type="datetime-local"
                  value={assignmentDeadline}
                  onChange={(e) => setAssignmentDeadline(e.target.value)}
                  className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                  required
                />
              </div>

              {/* File Upload Section */}
              <div>
                <label className="block text-sm font-medium mb-1">Upload File (Optional)</label>
                <div className="border border-dashed border-border rounded-md p-6 text-center bg-background/60">
                  <div className="flex flex-col items-center">
                    <DownloadCloud className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Drag and drop a file, or <span className="text-veri font-medium">browse</span>
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      PDF, Word or Text files (max 10MB)
                    </p>
                    {/* Hidden input field */}
                    <input
                      type="file"
                      id="fileUpload"
                      className="hidden" // Hides the default input
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileChange}
                      ref={fileInputRef} // Assign the ref
                    />
                    {/* Label acts as the clickable area for the hidden input */}
                    <label htmlFor="fileUpload">
                      <CustomButton
                        type="button" // Important: type="button" to prevent form submission
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()} // Programmatically click the input
                      >
                        Select File
                      </CustomButton>
                    </label>
                  </div>

                  {assignmentFile && (
                    <div className="mt-4 p-3 bg-secondary/50 rounded-md flex items-center justify-between">
                      <p className="text-sm font-medium truncate">{assignmentFile.name}</p>
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


              {/* Submit Button */}
              <div className="flex justify-end">
                <CustomButton type="submit" icon={<Plus className="h-4 w-4" />}>
                  Create
                </CustomButton>
              </div>
            </form>
          </GlassmorphismCard>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && itemToDelete && (
        <ConfirmationModal
          isOpen={showDeleteConfirmation}
          onClose={() => setShowDeleteConfirmation(false)}
          onConfirm={handleDelete}
          title={`Delete ${itemToDelete.type === 'course' ? 'Course' : itemToDelete.type === 'assignment' ? 'Assignment' : 'Exam'}`}
          message={`Are you sure you want to delete "${itemToDelete.title || itemToDelete.type}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          confirmVariant="destructive"
        />
      )}

      {/* Manage Students Modal */}
      {showManageStudents && courseId && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
          <ManageStudents
            courseId={courseId}
            onClose={() => setShowManageStudents(false)}
            onStudentsUpdated={fetchCourseData} // Callback to refresh course data
          />
        </div>
      )}
    </div>
  );
};

export default CourseView;