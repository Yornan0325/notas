import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  rightElement?: ReactNode;
}

export const Input = ({ icon, rightElement, className, ...props }: InputProps) => {
  return (
    <div className="relative w-full">
      {icon && (
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </div>
      )}
      <input
        className={cn(
          'flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm text-slate-950 shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50',
          icon && 'pl-9',
          rightElement && 'pr-10',
          className
        )}
        {...props}
      />
      {rightElement && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          {rightElement}
        </div>
      )}
    </div>
  );
};
