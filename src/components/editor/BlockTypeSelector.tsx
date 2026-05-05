import { useState } from 'react';
import { 
  Type, Heading1, Heading2, CheckSquare, Heading3, 
  List, ListOrdered, ChevronRightSquare, Quote, 
  Code, Megaphone, AlignLeft,
  ChevronRight, Plus, Undo2, Link, ArrowUp, ArrowDown
} from 'lucide-react';
import type { Block } from '../type/typeScript';

interface TypeOption {
  id: Block['type'];
  label: string;
  icon: any;
}

interface TypeGroup {
  label: string;
  options: TypeOption[];
}

export const BlockTypeSelector = ({ 
  currentType, 
  onSelect 
}: { 
  currentType: Block['type'], 
  onSelect: (type: Block['type']) => void 
}) => {
  const [activeSubmenu, setActiveSubmenu] = useState<'styles' | 'insert' | null>('styles');

  const groups: TypeGroup[] = [
    {
      label: 'Text',
      options: [
        { id: 'text', label: 'Texto', icon: Type },
        { id: 'h1', label: 'H1', icon: Heading1 },
        { id: 'h2', label: 'H2', icon: Heading2 },
        { id: 'h3', label: 'H3', icon: Heading3 },
      ]
    },
    {
      label: 'Lists',
      options: [
        { id: 'bullet_list', label: 'List', icon: List },
        { id: 'numbered_list', label: 'Order', icon: ListOrdered },
        { id: 'todo', label: 'Task', icon: CheckSquare },
        { id: 'toggle_list', label: 'Toggle', icon: ChevronRightSquare },
      ]
    },
    {
      label: 'Quote',
      options: [
        { id: 'text', label: 'Style', icon: AlignLeft },
        { id: 'quote', label: 'Quote', icon: Quote },
        { id: 'code', label: 'Code', icon: Code },
        { id: 'callout', label: 'Alert', icon: Megaphone },
      ]
    }
  ];

  const mainActions = [
    { id: 'styles', label: 'Paragraph style', icon: Type, hasSubmenu: true },
    { id: 'insert', label: 'Insert line', icon: Plus, hasSubmenu: true },
    { id: 'return', label: 'Return to block', icon: Undo2, hasSubmenu: false },
    { id: 'copy', label: 'Copy link', icon: Link, hasSubmenu: false },
  ];

  const insertOptions = [
    { label: 'Insert above', icon: ArrowUp, shortcut: 'Ctrl Alt ↑' },
    { label: 'Insert below', icon: ArrowDown, shortcut: 'Ctrl Alt ↓' },
  ];

  return (
    <div className="flex items-start gap-2 animate-in fade-in zoom-in-95 duration-200">
      {/* Menu Principal (Acciones) */}
      <div className="flex flex-col gap-0.5 p-1.5 bg-[#212224]/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl w-[220px]">
        {mainActions.map((action) => (
          <button
            key={action.id}
            onMouseEnter={() => action.hasSubmenu && setActiveSubmenu(action.id as any)}
            className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm transition-all duration-200 group ${
              activeSubmenu === action.id 
                ? 'bg-blue-500/20 text-blue-400' 
                : 'text-white/70 hover:bg-white/5'
            }`}
          >
            <action.icon size={18} strokeWidth={2.5} className={activeSubmenu === action.id ? 'text-blue-400' : 'text-white/40 group-hover:text-white/70'} />
            <span className="flex-1 text-left font-medium">{action.label}</span>
            {action.hasSubmenu && <ChevronRight size={14} className="text-white/20" />}
          </button>
        ))}
      </div>

      {/* Submenu de Estilos (Grid) */}
      {activeSubmenu === 'styles' && (
        <div className="flex flex-col gap-4 p-4 bg-[#212224]/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl w-[240px] animate-in slide-in-from-left-2 duration-200">
          {groups.map((group) => (
            <div key={group.label} className="flex flex-col gap-2">
              <p className="text-[11px] font-bold text-white/30 px-1 uppercase tracking-wider">{group.label}</p>
              <div className="grid grid-cols-4 gap-1.5">
                {group.options.map((option) => (
                  <button
                    key={option.id + '-' + option.label}
                    onClick={() => onSelect(option.id)}
                    title={option.label}
                    className={`flex items-center justify-center aspect-square w-full rounded-xl transition-all duration-200 group ${
                      currentType === option.id 
                        ? 'bg-blue-500 text-white' 
                        : 'text-white/70 hover:bg-white/5 border border-transparent hover:border-white/10'
                    }`}
                  >
                    <option.icon 
                      size={20} 
                      strokeWidth={2.5}
                      className="transition-transform duration-200 group-active:scale-90" 
                    />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submenu de Inserción */}
      {activeSubmenu === 'insert' && (
        <div className="flex flex-col gap-0.5 p-1.5 bg-[#212224]/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl w-[220px] animate-in slide-in-from-left-2 duration-200">
          {insertOptions.map((opt) => (
            <button
              key={opt.label}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-white/70 hover:bg-white/5 transition-all group"
            >
              <opt.icon size={18} strokeWidth={2.5} className="text-white/40 group-hover:text-white/70" />
              <div className="flex flex-col items-start flex-1">
                <span className="font-medium">{opt.label}</span>
                <span className="text-[10px] text-white/20 font-bold uppercase tracking-tighter mt-0.5">{opt.shortcut}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};