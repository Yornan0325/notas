import { ChevronDown } from 'lucide-react';
import { Button } from '../ui/Button';

export const WorkspaceNav = () => {
  return (
    <Button
      variant="ghost"
      className="h-auto w-full justify-start gap-3 px-2 py-2 text-left"
      type="button"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-950 text-xs font-semibold text-white">
        Y
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-950">Yornan</p>
        <p className="truncate text-xs font-normal text-slate-500">Espacio de trabajo</p>
      </div>
      <ChevronDown size={16} className="text-slate-400" />
    </Button>
  );
};
