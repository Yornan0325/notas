// src/components/ui/Button.tsx
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'dark' | 'ghost' | 'danger'|'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon, 
  className = '', 
  ...props 
}: ButtonProps) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 font-bold transition-all active:scale-95 rounded-xl shadow-sm";
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/10",
    outline: "border border-gray-200 text-gray-800 hover:bg-gray-50",
    secondary: "bg-white border border-gray-200 text-gray-800 hover:bg-gray-50",
    dark: "bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-700",
    ghost: "text-gray-500 hover:bg-gray-100 shadow-none border-transparent",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-[11px]",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} 
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};