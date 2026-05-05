import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'dark' | 'ghost' | 'danger' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  icon?: ReactNode;
}

export const Button = ({
  children,
  variant = 'default',
  size = 'md',
  icon,
  className,
  ...props
}: ButtonProps) => {
  const variants = {
    default: 'bg-slate-950 text-white shadow-sm hover:bg-slate-800',
    primary: 'bg-slate-950 text-white shadow-sm hover:bg-slate-800',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
    dark: 'bg-slate-900 text-slate-50 hover:bg-slate-800',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
    outline: 'border border-slate-200 bg-white text-slate-900 shadow-sm hover:bg-slate-50',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100',
    destructive: 'bg-red-600 text-white shadow-sm hover:bg-red-700',
  };

  const sizes = {
    sm: 'h-8 rounded-md px-3 text-xs',
    md: 'h-9 rounded-md px-4 py-2 text-sm',
    lg: 'h-10 rounded-md px-5 text-sm',
    icon: 'h-9 w-9 rounded-md',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
