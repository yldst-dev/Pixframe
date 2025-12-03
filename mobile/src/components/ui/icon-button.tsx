import React from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  tooltip?: string;
}

const IconButton: React.FC<IconButtonProps> = ({ 
  variant = 'ghost', 
  size = 'md', 
  className = '', 
  children, 
  tooltip,
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed border';
  
  const variants = {
    primary: 'bg-primary text-primary-foreground border-primary hover:bg-primary/90 focus:ring-primary',
    secondary: 'bg-secondary text-secondary-foreground border-secondary hover:bg-secondary/80 focus:ring-secondary',
    danger: 'bg-destructive text-destructive-foreground border-destructive hover:bg-destructive/90 focus:ring-destructive',
    ghost: 'bg-transparent text-muted-foreground border-transparent hover:bg-accent hover:text-accent-foreground focus:ring-accent',
    outline: 'bg-transparent text-foreground border-input hover:bg-accent hover:text-accent-foreground focus:ring-accent'
  };
  
  const sizes = {
    sm: 'p-1.5 h-8 w-8',
    md: 'p-2 h-10 w-10',
    lg: 'p-3 h-12 w-12'
  };
  
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      title={tooltip}
      {...props}
    >
      {children}
    </button>
  );
};

export default IconButton;
