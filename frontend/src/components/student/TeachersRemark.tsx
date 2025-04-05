
import { useState } from 'react';
import { MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import GlassmorphismCard from '@/components/ui/GlassmorphismCard';

interface TeachersRemarkProps {
  remark?: string | null;
}

const TeachersRemark = ({ remark }: TeachersRemarkProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!remark) return null;

  return (
    <GlassmorphismCard className="p-6 mb-6">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-veri" />
          <h2 className="text-lg font-semibold">Teacher's Remark</h2>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>
      
      {isOpen && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">
            {remark}
          </div>
        </div>
      )}
    </GlassmorphismCard>
  );
};

export default TeachersRemark;
