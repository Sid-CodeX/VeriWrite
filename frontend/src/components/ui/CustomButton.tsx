import React from 'react';
import { cn } from '@/lib/utils';

interface CustomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive' | 'success' | 'default';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  children: React.ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const CustomButton = React.forwardRef<HTMLButtonElement, CustomButtonProps>(
  ({
    className,
    variant = 'default', // Still uses 'default' if not specified
    size = 'md',
    children,
    fullWidth = false,
    loading = false,
    icon,
    iconPosition = 'left',
    ...props
  }, ref) => {
    const variants = {
      // CHANGE THIS LINE: Set default to your desired "old red"
      default: 'bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-300', // Changed to red
      primary: 'bg-veri text-veri-foreground hover:bg-veri/90 focus:ring-2 focus:ring-veri/20',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-2 focus:ring-secondary/20',
      outline: 'border border-veri text-foreground hover:bg-veri/10 focus:ring-2 focus:ring-veri/20',
      ghost: 'hover:bg-muted focus:ring-2 focus:ring-muted',
      link: 'text-veri underline-offset-4 hover:underline',
      destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-300', // Destructive is already red
      success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-300',
    };

    const sizes = {
      sm: 'h-9 px-3 text-xs',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base'
    };

    // Common transition effect for all buttons
    const transition = 'transition-all duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]';

    return (
      <button
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center font-medium rounded-lg focus:outline-none',
          variants[variant],
          sizes[size],
          transition,
          fullWidth && 'w-full',
          loading && 'opacity-70 cursor-not-allowed',
          className
        )}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="w-5 h-5 border-2 border-t-transparent border-white/80 rounded-full animate-spin"></span>
          </span>
        )}
        <span className={cn('flex items-center gap-2', loading && 'opacity-0')}>
          {icon && iconPosition === 'left' && icon}
          {children}
          {icon && iconPosition === 'right' && icon}
        </span>
      </button>
    );
  }
);

CustomButton.displayName = 'CustomButton';

export default CustomButton;