import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  fullWidth = false,
  className = '',
  icon,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center px-6 py-3.5 rounded-xl font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variants = {
    primary: "bg-brand-900 text-white hover:bg-black focus:ring-brand-900 shadow-lg shadow-brand-900/20",
    secondary: "bg-white text-brand-900 border border-gray-200 hover:bg-gray-50 focus:ring-gray-200 shadow-sm",
    outline: "bg-transparent border-2 border-brand-900 text-brand-900 hover:bg-brand-50 focus:ring-brand-900",
    ghost: "bg-transparent text-brand-900 hover:bg-brand-100/50"
  };

  const widthStyles = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${widthStyles} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};