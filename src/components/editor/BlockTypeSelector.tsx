import { useState } from 'react';
import {
  AlignLeft,
  ArrowDown,
  ArrowUp,
  CheckSquare,
  ChevronRight,
  ChevronRightSquare,
  Code,
  GalleryVerticalEnd,
  Heading1,
  Heading2,
  Heading3,
  Image,
  Table2,
  Link,
  List,
  ListOrdered,
  Megaphone,
  Minus,
  Plus,
  Quote,
  Trash2,
  Type,
  Undo2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Block } from '../type/typeScript';

interface TypeOption {
  id: Block['type'];
  label: string;
  icon: LucideIcon;
}

interface TypeGroup {
  label: string;
  options: TypeOption[];
}

type SubmenuId = 'styles' | 'insert';

interface MainAction {
  id: SubmenuId | 'collapse' | 'return' | 'copy' | 'delete';
  label: string;
  icon: LucideIcon;
  hasSubmenu: boolean;
}

export const BlockTypeSelector = ({
  currentType,
  isAccordion = false,
  onSelect,
  onToggleCollapse,
  onInsertAbove,
  onInsertBelow,
  onConvertToText,
  onCopyLink,
  onDelete,
}: {
  currentType: Block['type'];
  isAccordion?: boolean;
  onSelect: (type: Block['type']) => void;
  onToggleCollapse?: () => void;
  onInsertAbove?: () => void;
  onInsertBelow?: () => void;
  onConvertToText?: () => void;
  onCopyLink?: () => void;
  onDelete?: () => void;
}) => {
  const [activeSubmenu, setActiveSubmenu] = useState<SubmenuId | null>('styles');

  const groups: TypeGroup[] = [
    {
      label: 'Texto',
      options: [
        { id: 'text', label: 'Texto', icon: Type },
        { id: 'h1', label: 'H1', icon: Heading1 },
        { id: 'h2', label: 'H2', icon: Heading2 },
        { id: 'h3', label: 'H3', icon: Heading3 },
      ],
    },
    {
      label: 'Listas',
      options: [
        { id: 'bullet_list', label: 'Lista', icon: List },
        { id: 'numbered_list', label: 'Numerada', icon: ListOrdered },
        { id: 'todo', label: 'Tarea', icon: CheckSquare },
        { id: 'toggle_list', label: 'Toggle', icon: ChevronRightSquare },
      ],
    },
    {
      label: 'Bloques',
      options: [
        { id: 'text', label: 'Parrafo', icon: AlignLeft },
        { id: 'quote', label: 'Cita', icon: Quote },
        { id: 'code', label: 'Codigo', icon: Code },
        { id: 'callout', label: 'Aviso', icon: Megaphone },
        { id: 'divider', label: 'Separador', icon: Minus },
        { id: 'image', label: 'Imagen', icon: Image },
      ],
    },
    {
      label: 'Vistas',
      options: [
        { id: 'view_table', label: 'Tabla', icon: Table2 },
        { id: 'view_cards', label: 'Cards', icon: GalleryVerticalEnd },
      ],
    },
  ];

  const mainActions: MainAction[] = [
    { id: 'styles', label: 'Estilo de bloque', icon: Type, hasSubmenu: true },
    { id: 'insert', label: 'Insertar linea', icon: Plus, hasSubmenu: true },
    {
      id: 'collapse',
      label: isAccordion ? 'Quitar acordeon' : 'Colapsar contenido',
      icon: ChevronRightSquare,
      hasSubmenu: false,
    },
    { id: 'return', label: 'Convertir a texto', icon: Undo2, hasSubmenu: false },
    { id: 'copy', label: 'Copiar enlace', icon: Link, hasSubmenu: false },
    { id: 'delete', label: 'Eliminar bloque', icon: Trash2, hasSubmenu: false },
  ];

  const insertOptions = [
    { label: 'Insertar arriba', icon: ArrowUp, shortcut: 'Ctrl Alt Up', onClick: onInsertAbove },
    { label: 'Insertar abajo', icon: ArrowDown, shortcut: 'Ctrl Alt Down', onClick: onInsertBelow },
  ];

  return (
    <div className="flex max-h-[72vh] w-full flex-col gap-2 overflow-y-auto animate-in fade-in zoom-in-95 duration-200 md:w-auto md:flex-row md:items-start md:overflow-visible">
      <div className="flex w-full flex-col gap-0.5 rounded-md border border-slate-200 bg-white p-1 shadow-md md:w-[220px]">
        {mainActions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => {
              if (action.hasSubmenu) setActiveSubmenu(action.id as SubmenuId);
              if (action.id === 'collapse') onToggleCollapse?.();
              if (action.id === 'return') onConvertToText?.();
              if (action.id === 'copy') onCopyLink?.();
              if (action.id === 'delete') onDelete?.();
            }}
            onMouseEnter={() => {
              if (action.hasSubmenu) setActiveSubmenu(action.id as SubmenuId);
              else setActiveSubmenu(null);
            }}
            className={`group flex w-full items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors ${
              action.id === 'delete'
                ? 'text-red-600 hover:bg-red-50 hover:text-red-700'
                : action.id === 'collapse' && isAccordion
                  ? 'bg-slate-950 text-white hover:bg-slate-800'
                : activeSubmenu === action.id
                  ? 'bg-slate-100 text-slate-950'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
            }`}
          >
            <action.icon
              size={18}
              strokeWidth={2.5}
              className={
                action.id === 'delete'
                  ? 'text-red-500'
                  : action.id === 'collapse' && isAccordion
                    ? 'text-white'
                  : activeSubmenu === action.id
                    ? 'text-slate-950'
                    : 'text-slate-400 group-hover:text-slate-700'
              }
            />
            <span className="flex-1 text-left font-medium">{action.label}</span>
            {action.hasSubmenu && <ChevronRight size={14} className="text-slate-400" />}
          </button>
        ))}
      </div>

      {activeSubmenu === 'styles' && (
        <div className="flex w-full flex-col gap-4 rounded-md border border-slate-200 bg-white p-4 shadow-md animate-in slide-in-from-left-2 duration-200 md:w-[240px]">
          {groups.map((group) => (
            <div key={group.label} className="flex flex-col gap-2">
              <p className="px-1 text-xs font-medium text-slate-500">{group.label}</p>
              <div className="grid grid-cols-4 gap-1.5">
                {group.options.map((option) => (
                  <button
                    key={`${option.id}-${option.label}`}
                    type="button"
                    onClick={() => onSelect(option.id)}
                    title={option.label}
                    className={`group flex aspect-square w-full items-center justify-center rounded-md border transition-colors ${
                      currentType === option.id
                        ? 'border-slate-950 bg-slate-950 text-white'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                    }`}
                  >
                    <option.icon size={20} strokeWidth={2.5} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeSubmenu === 'insert' && (
        <div className="flex w-full flex-col gap-0.5 rounded-md border border-slate-200 bg-white p-1 shadow-md animate-in slide-in-from-left-2 duration-200 md:w-[220px]">
          {insertOptions.map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={option.onClick}
              className="group flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
            >
              <option.icon size={18} strokeWidth={2.5} className="text-slate-400 group-hover:text-slate-700" />
              <div className="flex flex-1 flex-col items-start">
                <span className="font-medium">{option.label}</span>
                <span className="mt-0.5 text-[10px] font-medium uppercase text-slate-400">
                  {option.shortcut}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
