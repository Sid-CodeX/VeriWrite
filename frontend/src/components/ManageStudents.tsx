
import { useState } from 'react';
import { UserX, UserPlus } from 'lucide-react';
import CustomButton from './ui/CustomButton';
import GlassmorphismCard from './ui/GlassmorphismCard';
import { useToast } from '@/hooks/use-toast';

interface Student {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'blocked';
}

interface ManageStudentsProps {
  courseId: string;
  onClose: () => void;
}

const ManageStudents = ({ courseId, onClose }: ManageStudentsProps) => {
  const { toast } = useToast();
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [students, setStudents] = useState<Student[]>([
    { id: '1', name: 'John Doe', email: 'john@example.com', status: 'active' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', status: 'active' }
  ]);

  const handleAddStudent = () => {
    if (!newStudentEmail.trim()) {
      toast({
        title: "Email required",
        description: "Please enter a student's email",
        variant: "destructive",
      });
      return;
    }

    // Mock student addition
    const newStudent: Student = {
      id: Date.now().toString(),
      name: `Student ${students.length + 1}`,
      email: newStudentEmail,
      status: 'active'
    };

    setStudents(prev => [...prev, newStudent]);
    setNewStudentEmail('');
    
    toast({
      title: "Student added",
      description: `${newStudentEmail} has been added to the course.`,
    });
  };

  const toggleStudentStatus = (studentId: string) => {
    setStudents(prev => prev.map(student => {
      if (student.id === studentId) {
        const newStatus = student.status === 'active' ? 'blocked' : 'active';
        toast({
          title: `Student ${newStatus}`,
          description: `${student.name} has been ${newStatus}.`,
        });
        return { ...student, status: newStatus };
      }
      return student;
    }));
  };

  const removeStudent = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    setStudents(prev => prev.filter(s => s.id !== studentId));
    
    if (student) {
      toast({
        title: "Student removed",
        description: `${student.name} has been removed from the course.`,
      });
    }
  };

  return (
    <GlassmorphismCard className="p-6">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-xl font-bold">Manage Students</h2>
        <button 
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          ✕
        </button>
      </div>

      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="Enter student email"
            className="flex-grow p-2 border border-border rounded-md bg-background"
            value={newStudentEmail}
            onChange={(e) => setNewStudentEmail(e.target.value)}
          />
          <CustomButton
            onClick={handleAddStudent}
            icon={<UserPlus className="h-4 w-4" />}
          >
            Add Student
          </CustomButton>
        </div>
      </div>

      <div className="space-y-4">
        {students.map(student => (
          <div key={student.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div>
              <p className="font-medium">{student.name}</p>
              <p className="text-sm text-muted-foreground">{student.email}</p>
            </div>
            <div className="flex gap-2">
              <CustomButton
                variant="outline"
                size="sm"
                onClick={() => toggleStudentStatus(student.id)}
              >
                {student.status === 'active' ? 'Block' : 'Unblock'}
              </CustomButton>
              <CustomButton
                variant="outline"
                size="sm"
                onClick={() => removeStudent(student.id)}
                icon={<UserX className="h-4 w-4" />}
              >
                Remove
              </CustomButton>
            </div>
          </div>
        ))}
      </div>
    </GlassmorphismCard>
  );
};

export default ManageStudents;
