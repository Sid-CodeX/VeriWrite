
import { useState, useMemo } from 'react';
import { FileText, Eye, DownloadCloud, AlertTriangle, CheckCircle, FileDown } from 'lucide-react';
import CustomButton from '@/components/ui/CustomButton';
import GlassmorphismCard from '@/components/ui/GlassmorphismCard';
import { useToast } from '@/hooks/use-toast';

interface Student {
  id: string;
  rollNo: string;
  name: string;
  email: string;
  submission?: {
    fileName: string;
    submittedAt: Date;
    checked: boolean;
    similarity?: number;
  };
}

interface StudentSubmissionTableProps {
  assignmentId: string;
  students: Student[];
}

const StudentSubmissionTable = ({ assignmentId, students }: StudentSubmissionTableProps) => {
  const { toast } = useToast();
  const [checkingId, setCheckingId] = useState<string | null>(null);
  
  // Sort students by roll number
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      // Sort alphanumerically by rollNo
      return a.rollNo.localeCompare(b.rollNo, undefined, { numeric: true });
    });
  }, [students]);

  const handleCheckPlagiarism = (studentId: string) => {
    setCheckingId(studentId);
    
    // Simulate plagiarism check
    setTimeout(() => {
      setCheckingId(null);
      
      // Update the student's submission with similarity score (in a real app this would modify state)
      toast({
        title: "Plagiarism Check Complete",
        description: "The submission has been analyzed. View the report for details.",
      });
    }, 2000);
  };

  const handleViewSubmission = (fileName: string) => {
    toast({
      title: "Opening Document",
      description: `Opening ${fileName}`,
    });
  };

  const handleViewReport = (studentName: string) => {
    toast({
      title: "Opening Report",
      description: `Viewing plagiarism report for ${studentName}`,
    });
  };

  const handleDownloadOverallReport = () => {
    toast({
      title: "Downloading Overall Report",
      description: "Generating comprehensive plagiarism report for all submissions.",
    });
    
    // Simulate download delay
    setTimeout(() => {
      toast({
        title: "Download Complete",
        description: "The overall plagiarism report has been downloaded.",
      });
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Student Submissions</h3>
        <CustomButton 
          onClick={handleDownloadOverallReport}
          icon={<FileDown size={18} />}
          className="bg-gradient-to-r from-veri to-veri/80"
        >
          Download Overall Report
        </CustomButton>
      </div>
      
      <GlassmorphismCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary/40">
                <th className="px-4 py-3 text-left text-sm font-medium">Roll No.</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Student</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Submission</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedStudents.map((student) => (
                <tr key={student.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-4 text-sm font-medium">{student.rollNo}</td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-xs text-muted-foreground">{student.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {student.submission ? (
                      <div className="flex items-center">
                        <FileText className="text-veri mr-2" size={16} />
                        <div>
                          <button 
                            onClick={() => handleViewSubmission(student.submission?.fileName || '')}
                            className="text-sm font-medium hover:text-veri transition-colors"
                          >
                            {student.submission.fileName}
                          </button>
                          <p className="text-xs text-muted-foreground">
                            {student.submission.submittedAt.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not submitted</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {student.submission ? (
                      student.submission.checked ? (
                        <div className="flex items-center">
                          <span 
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              (student.submission.similarity || 0) > 30
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                : (student.submission.similarity || 0) > 15
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            }`}
                          >
                            {(student.submission.similarity || 0) > 30 ? (
                              <AlertTriangle className="mr-1" size={12} />
                            ) : (
                              <CheckCircle className="mr-1" size={12} />
                            )}
                            {student.submission.similarity}% similarity
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not checked</span>
                      )
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex space-x-2">
                      {student.submission && (
                        <>
                          {student.submission.checked ? (
                            <CustomButton
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewReport(student.name)}
                              icon={<Eye size={14} />}
                            >
                              View Report
                            </CustomButton>
                          ) : (
                            <CustomButton
                              size="sm"
                              loading={checkingId === student.id}
                              onClick={() => handleCheckPlagiarism(student.id)}
                              icon={<DownloadCloud size={14} />}
                            >
                              Check Plagiarism
                            </CustomButton>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassmorphismCard>
    </div>
  );
};

export default StudentSubmissionTable;
