import { useState, useEffect, useCallback } from 'react';
import { UserMinus, UserPlus, Ban, UserCheck, XCircle, AlertCircle } from 'lucide-react'; // Added AlertCircle for dialog icon
import CustomButton from './ui/CustomButton';
import GlassmorphismCard from './ui/GlassmorphismCard';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"; // Import Shadcn AlertDialog components

// Define the API base URL from your environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Student {
    studentId: string; // This will be _id for active students or userId for blocked students
    name: string;      // For blocked, this will default to email if backend doesn't send name
    email: string;
    status: 'active' | 'blocked';
}

// Interface to match the structure of blocked students received from your backend
interface BlockedStudentBackend {
    userId: string;
    email: string;
    // Note: 'name' is not provided by your backend for blockedUsers in /students/:classroomId
}

interface ManageStudentsProps {
    courseId: string;
    onClose: () => void;
    onStudentsUpdated?: () => Promise<void>;
}

// Define a type for the confirmation dialog state
type ConfirmationAction = 'remove' | 'block' | 'unblock' | null;

const ManageStudents = ({ courseId, onClose, onStudentsUpdated }: ManageStudentsProps) => {
    const { toast } = useToast();
    const [newStudentEmail, setNewStudentEmail] = useState('');
    const [activeStudents, setActiveStudents] = useState<Student[]>([]);
    const [blockedStudents, setBlockedStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddingStudent, setIsAddingStudent] = useState(false);

    // State for the custom confirmation dialog
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [confirmAction, setConfirmAction] = useState<ConfirmationAction>(null);
    const [studentToConfirm, setStudentToConfirm] = useState<Student | null>(null);

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

            const response = await axios.get(`${API_BASE_URL}/api/courses/students/${courseId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const { students: fetchedActiveStudents, blockedStudents: fetchedBlockedStudents } = response.data;

            const mappedActiveStudents: Student[] = fetchedActiveStudents.map((s: any) => ({
                studentId: s.studentId,
                name: s.name,
                email: s.email,
                status: 'active',
            }));

            const mappedBlockedStudents: Student[] = fetchedBlockedStudents.map((s: BlockedStudentBackend) => ({
                studentId: s.userId,
                name: s.email,
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

    // --- Confirmation Dialog Handlers ---
    const confirmActionHandler = (action: ConfirmationAction, student: Student) => {
        setConfirmAction(action);
        setStudentToConfirm(student);
        setShowConfirmDialog(true);
    };

    const executeConfirmedAction = async () => {
        if (!studentToConfirm || !confirmAction) return;

        const { studentId, name } = studentToConfirm;
        const token = localStorage.getItem('token');
        if (!token) {
            toast({
                title: "Authentication Error",
                description: "No token found. Please log in.",
                variant: "destructive",
            });
            return;
        }

        try {
            let apiEndpoint = '';
            let successMessage = '';
            let errorMessage = '';

            switch (confirmAction) {
                case 'remove':
                    apiEndpoint = `${API_BASE_URL}/api/courses/remove-student`;
                    successMessage = `${name} has been removed from the course.`;
                    errorMessage = "Failed to remove student.";
                    break;
                case 'block':
                    apiEndpoint = `${API_BASE_URL}/api/courses/block-student`;
                    successMessage = `${name} has been blocked.`;
                    errorMessage = "Failed to block student.";
                    break;
                case 'unblock':
                    apiEndpoint = `${API_BASE_URL}/api/courses/unblock-student`;
                    successMessage = `${name} has been unblocked.`;
                    errorMessage = "Failed to unblock student.";
                    break;
                default:
                    return; // Should not happen
            }

            await axios.post(apiEndpoint, {
                classroomId: courseId,
                studentId: studentId,
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            toast({
                title: "Success",
                description: successMessage,
            });

            await fetchStudents(); // Re-fetch to update the lists
            if (onStudentsUpdated) {
                await onStudentsUpdated();
            }

        } catch (error: any) {
            console.error(`Error during ${confirmAction} action:`, error);
            toast({
                title: "Error",
                description: error.response?.data?.error || `Failed to perform ${confirmAction} action.`,
                variant: "destructive",
            });
        } finally {
            setShowConfirmDialog(false); // Close dialog
            setConfirmAction(null);      // Reset action
            setStudentToConfirm(null);   // Clear student
        }
    };
    // --- End Confirmation Dialog Handlers ---


    // Original handleRemoveStudent, handleBlockStudent, handleUnblockStudent now trigger the confirmation dialog
    const handleRemoveStudent = (studentId: string, studentName: string) => {
        confirmActionHandler('remove', { studentId, name: studentName, email: '', status: 'active' }); // Email and status are placeholders here
    };

    const handleBlockStudent = (studentId: string, studentName: string) => {
        confirmActionHandler('block', { studentId, name: studentName, email: '', status: 'active' }); // Email and status are placeholders here
    };

    const handleUnblockStudent = (studentId: string, studentName: string) => {
        confirmActionHandler('unblock', { studentId, name: studentName, email: '', status: 'blocked' }); // Email and status are placeholders here
    };


    // Helper to get dialog title and description based on action
    const getDialogContent = () => {
        if (!studentToConfirm || !confirmAction) return { title: "", description: "" };

        switch (confirmAction) {
            case 'remove':
                return {
                    title: `Remove ${studentToConfirm.name}?`,
                    description: `Are you sure you want to remove ${studentToConfirm.name} from this course? This action cannot be undone.`,
                };
            case 'block':
                return {
                    title: `Block ${studentToConfirm.name}?`,
                    description: `Are you sure you want to block ${studentToConfirm.name}? They will lose access to this course.`,
                };
            case 'unblock':
                return {
                    title: `Unblock ${studentToConfirm.name}?`,
                    description: `Are you sure you want to unblock ${studentToConfirm.name}? They will regain access to this course.`,
                };
            default:
                return { title: "", description: "" };
        }
    };

    const { title: dialogTitle, description: dialogDescription } = getDialogContent();


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
                                        onClick={() => handleBlockStudent(student.studentId, student.name)} // Calls our new handler
                                        icon={<Ban className="h-4 w-4" />}
                                    >
                                        Block
                                    </CustomButton>
                                    <CustomButton
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleRemoveStudent(student.studentId, student.name)} // Calls our new handler
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
                                    onClick={() => handleUnblockStudent(student.studentId, student.name)} // Calls our new handler
                                    icon={<UserCheck className="h-4 w-4" />}
                                >
                                    Unblock
                                </CustomButton>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Custom Confirmation AlertDialog */}
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent className="bg-background text-foreground rounded-lg shadow-xl p-6">
                    <AlertDialogHeader className="flex flex-col items-center text-center">
                        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                        <AlertDialogTitle className="text-2xl font-bold">{dialogTitle}</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground mt-2">
                            {dialogDescription}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex flex-col sm:flex-row sm:justify-center gap-3 mt-6">
                        <AlertDialogCancel asChild>
                            <CustomButton variant="outline" className="w-full sm:w-auto">Cancel</CustomButton>
                        </AlertDialogCancel>
                        <AlertDialogAction asChild>
                            <CustomButton
                                variant={confirmAction === 'remove' || confirmAction === 'block' ? 'destructive' : 'default'}
                                onClick={executeConfirmedAction}
                                className="w-full sm:w-auto"
                            >
                                {confirmAction === 'remove' ? 'Yes, Remove' : confirmAction === 'block' ? 'Yes, Block' : 'Yes, Unblock'}
                            </CustomButton>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </GlassmorphismCard>
    );
};

export default ManageStudents;
