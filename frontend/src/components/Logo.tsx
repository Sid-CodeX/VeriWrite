
import React from 'react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  withTagline?: boolean;
}

const Logo: React.FC<LogoProps> = ({ 
  className, 
  size = 'md',
  withTagline = false
}) => {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl'
  };

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <Link 
        to="/" 
        className={cn(
          'font-bold tracking-tight transition-all duration-300 hover:opacity-90',
          sizeClasses[size]
        )}
      >
        <span className="text-veri animate-fade-in" style={{ animationDelay: '0.1s' }}>Veri</span>
        <span className="text-write animate-fade-in" style={{ animationDelay: '0.3s' }}>Write</span>
      </Link>
      {withTagline && (
        <p className="mt-1 text-sm text-muted-foreground opacity-0 animate-fade-in" 
           style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
          Academic integrity, brilliantly verified
        </p>
      )}
    </div>
  );
};

export default Logo;
