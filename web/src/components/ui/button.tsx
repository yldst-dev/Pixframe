import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'secondary', 
  size = 'md', 
  className = '', 
  children, 
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed border';
  
  const variants = {
    primary: 'bg-primary text-primary-foreground border-primary hover:bg-primary/90 focus:ring-primary',
    secondary: 'bg-secondary text-secondary-foreground border-secondary hover:bg-secondary/80 focus:ring-secondary',
    danger: 'bg-destructive text-destructive-foreground border-destructive hover:bg-destructive/90 focus:ring-destructive',
    ghost: 'bg-transparent text-foreground border-transparent hover:bg-accent hover:text-accent-foreground focus:ring-accent',
    outline: 'bg-transparent text-foreground border-input hover:bg-accent hover:text-accent-foreground focus:ring-accent'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
