import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive';
  color?: 'blue' | 'green' | 'amber' | 'gray' | 'purple';
}

export const Badge = ({
  children,
  variant,
  color,
  className,
  ...props
}: BadgeProps) => {
  const resolvedVariant =
    variant ||
    (color === 'green'
      ? 'success'
      : color === 'amber'
        ? 'warning'
        : color === 'gray'
          ? 'secondary'
          : 'default');

  const variants = {
    default: 'border-transparent bg-slate-950 text-white',
    secondary: 'border-transparent bg-slate-100 text-slate-700',
    outline: 'border-slate-200 text-slate-700',
    success: 'border-transparent bg-emerald-50 text-emerald-700',
    warning: 'border-transparent bg-amber-50 text-amber-700',
    destructive: 'border-transparent bg-red-50 text-red-700',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
        variants[resolvedVariant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
