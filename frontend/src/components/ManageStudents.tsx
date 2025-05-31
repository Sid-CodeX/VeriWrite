import { useState, useEffect, useCallback } from 'react';
import { UserMinus, UserPlus, Ban, UserCheck, XCircle } from 'lucide-react';
import CustomButton from './ui/CustomButton';
import GlassmorphismCard from './ui/GlassmorphismCard';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Student {
  studentId: string; // This is _id from MongoDB for active students
  name: string;
  email: string;
  status: 'active' | 'blocked';
}

interface BlockedStudentBackend {
  userId: string; // This is _id from MongoDB for blocked users
  email: string;
  // name might be missing here if your backend doesn't return it for blockedUsers
}

interface ManageStudentsProps {
  courseId: string;
  onClose: () => void;
  onStudentsUpdated?: () => Promise<void>;
}

const ManageStudents = ({ courseId, onClose, onStudentsUpdated }: ManageStudentsProps) => {
  const { toast } = useToast();
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [activeStudents, setActiveStudents] = useState<Student[]>([]);
  const [blockedStudents, setBlockedStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingStudent, setIsAddingStudent] = useState(false);

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "No token found. Please log in.",
          variant: "destructive",
        });
        onClose();
        return;
      }

      // ****** IMPORTANT CHANGE HERE: Corrected API endpoint ******
      const response = await axios.get(`${API_BASE_URL}/api/courses/students/${courseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Destructure the response to get both students and blockedStudents
      const { students: fetchedActiveStudents, blockedStudents: fetchedBlockedStudents } = response.data;

      // Map active students to include status: 'active'
      const mappedActiveStudents: Student[] = fetchedActiveStudents.map((s: any) => ({
        studentId: s.studentId, // Assuming studentId is the correct field from backend
        name: s.name,
        email: s.email,
        status: 'active',
      }));

      // Map blocked students to include status: 'blocked'
      // NOTE: Your backend's blockedUsers only return userId and email.
      // If you need the name for blocked students, your backend's `blockedUsers`
      // array should include it, or you'd need to fetch user details separately.
      const mappedBlockedStudents: Student[] = fetchedBlockedStudents.map((s: BlockedStudentBackend) => ({
        studentId: s.userId, // Use userId as studentId for blocked students
        name: s.email, // Fallback to email for name if name isn't provided by backend for blockedUsers
        email: s.email,
        status: 'blocked',
      }));

      setActiveStudents(mappedActiveStudents);
      setBlockedStudents(mappedBlockedStudents);

    } catch (error: any) {
      console.error("Error fetching students:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to load student list.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [courseId, toast, onClose]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleAddStudent = async () => {
    if (!newStudentEmail.trim()) {
      toast({
        title: "Email required",
        description: "Please enter a student's email",
        variant: "destructive",
      });
      return;
    }

    setIsAddingStudent(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/api/courses/add-student`, {
        classroomId: courseId,
        studentEmail: newStudentEmail,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast({
        title: "Student added",
        description: `${response.data.student.email} has been added to the course.`,
      });

      setNewStudentEmail('');

      await fetchStudents();
      if (onStudentsUpdated) {
        await onStudentsUpdated();
      }

    } catch (error: any) {
      console.error("Error adding student:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to add student. Ensure student exists.",
        variant: "destructive",
      });
    } finally {
      setIsAddingStudent(false);
    }
  };

  const handleRemoveStudent = async (studentId: string, studentName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${studentName} from this course?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      // Ensure your backend supports this DELETE route
      await axios.delete(`${API_BASE_URL}/api/courses/remove-student/${courseId}/${studentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast({
        title: "Student removed",
        description: `${studentName} has been removed from the course.`,
      });

      await fetchStudents();
      if (onStudentsUpdated) {
        await onStudentsUpdated();
      }

    } catch (error: any) {
      console.error("Error removing student:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to remove student.",
        variant: "destructive",
      });
    }
  };

  const handleBlockStudent = async (studentId: string, studentName: string) => {
    if (!window.confirm(`Are you sure you want to block ${studentName}? They will lose access to this course.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/courses/${courseId}/block-student`, { studentId }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast({
        title: "Student Blocked",
        description: `${studentName} has been blocked.`,
      });

      await fetchStudents(); // Re-fetch to update lists
      if (onStudentsUpdated) {
        await onStudentsUpdated();
      }

    } catch (error: any) {
      console.error("Error blocking student:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to block student.",
        variant: "destructive",
      });
    }
  };

  const handleUnblockStudent = async (studentId: string, studentName: string) => {
    if (!window.confirm(`Are you sure you want to unblock ${studentName}? They will regain access to this course.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/courses/${courseId}/unblock-student`, { studentId }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast({
        title: "Student Unblocked",
        description: `${studentName} has been unblocked.`,
      });

      await fetchStudents(); // Re-fetch to update lists
      if (onStudentsUpdated) {
        await onStudentsUpdated();
      }

    } catch (error: any) {
      console.error("Error unblocking student:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to unblock student.",
        variant: "destructive",
      });
    }
  };


  return (
    <GlassmorphismCard className="p-6 w-full max-w-xl overflow-y-auto max-h-[90vh]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Manage Students</h2>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          <XCircle className="h-6 w-6" />
        </button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleAddStudent(); }} className="space-y-4 mb-8 border-b border-border/50 pb-6">
        <h3 className="text-lg font-semibold text-white">Add Existing Student</h3>
        <div>
          <label htmlFor="studentEmail" className="block text-sm font-medium mb-1 text-white">Student Email</label>
          <input
            type="email"
            id="studentEmail"
            className="w-full p-2 border border-border rounded-md bg-background text-foreground"
            placeholder="student@example.com"
            value={newStudentEmail}
            onChange={(e) => setNewStudentEmail(e.target.value)}
            required
          />
        </div>
        <CustomButton type="submit" disabled={isAddingStudent}>
          {isAddingStudent ? 'Adding Student...' : 'Add Student'}
        </CustomButton>
      </form>

      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Active Students ({activeStudents.length})</h3>
        {isLoading ? (
          <p className="text-white">Loading active students...</p>
        ) : activeStudents.length === 0 ? (
          <p className="text-muted-foreground">No active students enrolled yet.</p>
        ) : (
          <div className="space-y-3">
            {activeStudents.map(student => (
              <div key={student.studentId} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-secondary/30 rounded-md">
                <div className="flex-grow mb-2 sm:mb-0">
                  <p className="font-medium text-white">{student.name}</p>
                  <p className="text-sm text-muted-foreground">{student.email}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <CustomButton
                    variant="outline"
                    size="sm"
                    onClick={() => handleBlockStudent(student.studentId, student.name)}
                    icon={<Ban className="h-4 w-4" />}
                  >
                    Block
                  </CustomButton>
                  <CustomButton
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveStudent(student.studentId, student.name)}
                    icon={<UserMinus className="h-4 w-4" />}
                  >
                    Remove
                  </CustomButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Blocked Students ({blockedStudents.length})</h3>
        {isLoading ? (
          <p className="text-white">Loading blocked students...</p>
        ) : blockedStudents.length === 0 ? (
          <p className="text-muted-foreground">No students are currently blocked.</p>
        ) : (
          <div className="space-y-3">
            {blockedStudents.map(student => (
              <div key={student.studentId} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-red-900/30 rounded-md border border-red-700/50">
                <div className="flex-grow mb-2 sm:mb-0">
                  <p className="font-medium text-white">{student.name} <span className="text-xs text-red-300">(Blocked)</span></p>
                  <p className="text-sm text-muted-foreground">{student.email}</p>
                </div>
                <CustomButton
                  variant="success"
                  size="sm"
                  onClick={() => handleUnblockStudent(student.studentId, student.name)}
                  icon={<UserCheck className="h-4 w-4" />}
                >
                  Unblock
                </CustomButton>
              </div>
            ))}
          </div>
        )}
      </div>
    </GlassmorphismCard>
  );
};

export default ManageStudents;