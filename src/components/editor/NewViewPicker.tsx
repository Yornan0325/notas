import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  Columns3,
  GalleryVerticalEnd,
  PanelRight,
  SlidersHorizontal,
  Table2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ViewBlockType } from './viewBlocks';

const options: Array<{ type: ViewBlockType; label: string; icon: LucideIcon }> = [
  { type: 'view_table', label: 'Table', icon: Table2 },
  { type: 'view_cards', label: 'Cards', icon: GalleryVerticalEnd },
  { type: 'view_detail', label: 'Detail', icon: PanelRight },
  { type: 'view_calendar', label: 'Calendar', icon: CalendarDays },
  { type: 'view_form', label: 'Form', icon: ClipboardList },
  { type: 'view_timeline', label: 'Timeline', icon: SlidersHorizontal },
  { type: 'view_chart', label: 'Chart', icon: BarChart3 },
  { type: 'view_board', label: 'Board', icon: Columns3 },
];

export const NewViewPicker = ({ onSelect }: { onSelect: (type: ViewBlockType) => void }) => {
  return (
    <div className="w-[452px] rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
      <p className="mb-3 text-sm font-semibold text-slate-500">New view</p>
      <div className="grid grid-cols-4 gap-3">
        {options.map((option) => (
          <button
            key={option.type}
            type="button"
            onClick={() => onSelect(option.type)}
            className="flex h-[78px] flex-col items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
          >
            <option.icon size={22} strokeWidth={2.4} />
            <span className="text-base font-semibold">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
