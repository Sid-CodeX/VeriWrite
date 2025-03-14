import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  PlusCircle, FileText, Calendar, Users, ArrowLeft, 
  DownloadCloud, Trash2, UserPlus 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import Navbar from '@/components/Navbar';
import CustomButton from '@/components/ui/CustomButton';
import GlassmorphismCard from '@/components/ui/GlassmorphismCard';
import ManageStudents from '@/components/ManageStudents';
import Footer from '@/components/Footer';
import { format } from 'date-fns';

interface Assignment {
  id: string;
  title: string;
  deadline: Date;
  submissionsCount: number;
  totalStudents: number;
  type: 'assignment' | 'exam';
  description?: string;
}

interface Course {
  id: string;
  name: string;
  description: string;
  students: number;
  color: string;
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
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [showManageStudents, setShowManageStudents] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (courseId) {
      setCourse({
        id: courseId,
        name: courseId === '1' ? 'Advanced Programming' : 
              courseId === '2' ? 'Data Structures' : 
              courseId === '3' ? 'Machine Learning' : 'Unknown Course',
        description: 'This course covers advanced concepts and techniques.',
        students: 32,
        color: 'from-blue-500/20 to-blue-600/20'
      });

      setAssignments([
        {
          id: '1',
          title: 'Midterm Assignment',
          deadline: new Date(2023, 11, 15),
          submissionsCount: 28,
          totalStudents: 32,
          type: 'assignment',
          description: 'A comprehensive midterm assignment.'
        },
        {
          id: '2',
          title: 'Final Project',
          deadline: new Date(2023, 11, 30),
          submissionsCount: 20,
          totalStudents: 32,
          type: 'assignment',
          description: 'An extensive final project to test cumulative knowledge.'
        },
        {
          id: '3',
          title: 'Practical Exam',
          deadline: new Date(2023, 10, 25),
          submissionsCount: 32,
          totalStudents: 32,
          type: 'exam',
          description: 'A practical exam to evaluate hands-on skills.'
        }
      ]);
    }
  }, [courseId]);

  const handleDeleteAssignment = (assignmentId: string) => {
    const assignment = assignments.find(a => a.id === assignmentId);
    setAssignments(prev => prev.filter(a => a.id !== assignmentId));
    
    if (assignment) {
      toast({
        title: `${assignment.type === 'assignment' ? 'Assignment' : 'Exam'} deleted`,
        description: `${assignment.title} has been deleted.`,
      });
    }
  };

  const handleDeleteCourse = () => {
    if (window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      toast({
        title: "Course deleted",
        description: `${course?.name} has been deleted.`,
      });
      navigate('/classroom');
    }
  };

  const handleCreateAssignment = () => {
    if (!assignmentTitle.trim()) {
      toast({
        title: "Assignment title required",
        description: "Please enter a title for the assignment",
        variant: "destructive",
      });
      return;
    }

    if (!assignmentDeadline) {
      toast({
        title: "Deadline required",
        description: "Please select a deadline for the assignment",
        variant: "destructive",
      });
      return;
    }

    const newAssignment: Assignment = {
      id: Date.now().toString(),
      title: assignmentTitle,
      deadline: new Date(assignmentDeadline),
      submissionsCount: 0,
      totalStudents: course?.students || 0,
      type: assignmentType,
      description: description
    };

    setAssignments(prev => [newAssignment, ...prev]);
    setAssignmentTitle('');
    setAssignmentDeadline('');
    setAssignmentFile(null);
    setDescription('');
    setShowCreateAssignment(false);
    
    toast({
      title: `${assignmentType === 'assignment' ? 'Assignment' : 'Exam'} created`,
      description: `${newAssignment.title} has been created successfully.`,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAssignmentFile(e.target.files[0]);
    }
  };

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow pt-24 pb-16 px-6">
          <div className="container max-w-6xl mx-auto">
            <p>Loading course details...</p>
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
                <h1 className="text-3xl font-bold">{course.name}</h1>
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
              >
                Create Assignment or Exam
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
                  <h3 className="text-2xl font-bold">{course.students}</h3>
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
                  <h3 className="text-2xl font-bold">{assignments.filter(a => a.type === 'assignment').length}</h3>
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
                  <h3 className="text-2xl font-bold">{assignments.filter(a => a.type === 'exam').length}</h3>
                </div>
              </div>
            </GlassmorphismCard>
          </div>
          
          {showManageStudents && (
            <div className="mb-8">
              <ManageStudents
                courseId={courseId || ''}
                onClose={() => setShowManageStudents(false)}
              />
            </div>
          )}
          
          {showCreateAssignment && (
            <GlassmorphismCard className="mb-8 p-6 animate-fade-in">
              <h2 className="text-xl font-bold mb-4">{assignmentType === 'assignment' ? 'Create New Assignment' : 'Create New Exam'}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
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
                    <label className="flex items-center gap-2 cursor-pointer">
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
                  <label className="block text-sm font-medium mb-1">Title*</label>
                  <input
                    type="text"
                    className="w-full p-2 border border-border rounded-md bg-background"
                    placeholder={`e.g., Midterm ${assignmentType === 'assignment' ? 'Assignment' : 'Exam'}`}
                    value={assignmentTitle}
                    onChange={(e) => setAssignmentTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    className="w-full p-2 border border-border rounded-md bg-background"
                    rows={3}
                    placeholder="Enter assignment description..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Deadline*</label>
                  <input
                    type="date"
                    className="w-full p-2 border border-border rounded-md bg-background"
                    value={assignmentDeadline}
                    onChange={(e) => setAssignmentDeadline(e.target.value)}
                  />
                </div>
                
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
                      <input
                        type="file"
                        id="fileUpload"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={handleFileChange}
                      />
                      <label htmlFor="fileUpload">
                        <CustomButton
                          type="button"
                          variant="outline"
                          size="sm"
                        >
                          Select File
                        </CustomButton>
                      </label>
                    </div>
                    
                    {assignmentFile && (
                      <div className="mt-4 p-3 bg-secondary/50 rounded-md">
                        <p className="text-sm font-medium truncate">{assignmentFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(assignmentFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-3 justify-end">
                  <CustomButton
                    variant="outline"
                    onClick={() => setShowCreateAssignment(false)}
                  >
                    Cancel
                  </CustomButton>
                  <CustomButton onClick={handleCreateAssignment}>
                    Create {assignmentType === 'assignment' ? 'Assignment' : 'Exam'}
                  </CustomButton>
                </div>
              </div>
            </GlassmorphismCard>
          )}
          
          <h2 className="text-xl font-bold mb-4">Assignments & Exams</h2>
          <div className="space-y-4">
            {assignments.length > 0 ? (
              assignments.map((assignment) => (
                <GlassmorphismCard key={assignment.id} className="p-6 hover:shadow-md transition-all">
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
                        <h3 className="font-semibold">{assignment.title}</h3>
                      </div>
                      
                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Due: {format(assignment.deadline, 'MMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>
                            Submissions: {assignment.submissionsCount}/{assignment.totalStudents}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <CustomButton 
                        onClick={() => navigate(`/classroom/${courseId}/assignment/${assignment.id}`)}
                        size="sm"
                      >
                        View {assignment.type === 'exam' ? 'Exam' : 'Assignment'}
                      </CustomButton>
                      <CustomButton 
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAssignment(assignment.id)}
                        icon={<Trash2 className="h-4 w-4" />}
                      >
                        Delete
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
                <h3 className="text-lg font-semibold mb-2">No assignments yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first assignment to get started.
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
