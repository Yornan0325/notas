import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export const DropdownMenuContent = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      'z-50 min-w-40 overflow-hidden rounded-md border border-slate-200 bg-white p-1 text-slate-950 shadow-md',
      className
    )}
  >
    {children}
  </div>
);

export const DropdownMenuItem = ({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none transition-colors hover:bg-slate-100',
      className
    )}
  >
    {children}
  </button>
);
