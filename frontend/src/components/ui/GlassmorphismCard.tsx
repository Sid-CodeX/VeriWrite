import React from 'react';
import { cn } from '@/lib/utils';

interface GlassmorphismCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  
  hoverEffect?: boolean;
  intensity?: 'light' | 'medium' | 'heavy';
}

const GlassmorphismCard: React.FC<GlassmorphismCardProps> = ({
  children,
  className,
  hoverEffect = true,
  intensity = 'medium',
  ...props // Capture all other props (including 'id')
}) => {
  const intensityClasses = {
    light: 'bg-white/5 backdrop-blur-sm border-white/10',
    medium: 'bg-white/10 backdrop-blur-md border-white/20',
    heavy: 'bg-white/20 backdrop-blur-xl border-white/30',
  };

  return (
    <div
      className={cn(
        'rounded-xl border shadow-lg overflow-hidden',
        intensityClasses[intensity],
        hoverEffect && 'transition-all duration-300 hover:shadow-xl hover:translate-y-[-2px]',
        className
      )}
      {...props} 
    >
      {children}
    </div>
  );
};

export default GlassmorphismCard;
