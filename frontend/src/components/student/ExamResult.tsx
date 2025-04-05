
import { useState } from 'react';
import { Award, ChevronUp, ChevronDown } from 'lucide-react';
import GlassmorphismCard from '@/components/ui/GlassmorphismCard';

interface MarkDistribution {
  section: string;
  maxMarks: number;
  scored: number;
}

interface Submission {
  id: string;
  score?: number;
  markDistribution?: MarkDistribution[];
}

interface ExamResultProps {
  submission: Submission;
}

const ExamResult = ({ submission }: ExamResultProps) => {
  const [showMarkDistribution, setShowMarkDistribution] = useState(false);

  if (!submission.score) return null;

  return (
    <GlassmorphismCard className="p-6 mb-6 border-veri/30">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
        <div className="flex items-center gap-2 mb-2 sm:mb-0">
          <Award className="h-5 w-5 text-veri" />
          <h2 className="text-lg font-semibold">Exam Result</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-4 py-2 bg-veri/10 rounded-md">
            <span className="text-lg font-bold text-veri">{submission.score}</span>
            <span className="text-sm text-muted-foreground">/100</span>
          </div>
        </div>
      </div>
      
      <button 
        className="flex w-full items-center justify-between p-3 bg-muted/40 rounded-md mb-3 hover:bg-muted/70 transition-colors"
        onClick={() => setShowMarkDistribution(!showMarkDistribution)}
      >
        <span className="font-medium">Mark Distribution</span>
        {showMarkDistribution ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      
      {showMarkDistribution && submission.markDistribution && (
        <div className="animate-fade-in">
          <div className="border rounded-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">Section</th>
                  <th className="text-center p-3 text-sm font-medium">Max Marks</th>
                  <th className="text-center p-3 text-sm font-medium">Marks Obtained</th>
                </tr>
              </thead>
              <tbody>
                {submission.markDistribution.map((item, index) => (
                  <tr key={index} className="border-t">
                    <td className="p-3 text-sm">{item.section}</td>
                    <td className="p-3 text-sm text-center">{item.maxMarks}</td>
                    <td className="p-3 text-sm text-center">
                      <span className={item.scored >= item.maxMarks * 0.7 ? 'text-green-500' : 'text-amber-500'}>
                        {item.scored}
                      </span>
                    </td>
                  </tr>
                ))}
                <tr className="border-t bg-muted/20 font-medium">
                  <td className="p-3 text-sm">Total</td>
                  <td className="p-3 text-sm text-center">100</td>
                  <td className="p-3 text-sm text-center">{submission.score}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </GlassmorphismCard>
  );
};

export default ExamResult;
