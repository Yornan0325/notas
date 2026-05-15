import { useState } from 'react';
import {
  AlignLeft,
  ArrowDown,
  ArrowUp,
  CheckSquare,
  CircleDashed,
  CircleDot,
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
import { cn } from '../../lib/utils';

interface TypeOption {
  id: Block['type'];
  label: string;
  icon: LucideIcon;
}

interface TypeGroup {
  label: string;
  options: TypeOption[];
}

type SubmenuId = 'styles' | 'insert' | 'status';

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
  onSetActivityStatus,
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
  onSetActivityStatus?: (status?: Block['activityStatus']) => void;
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
    { id: 'status', label: 'Estado de actividad', icon: CircleDot, hasSubmenu: true },
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

  const statusOptions: Array<{
    label: string;
    value?: Block['activityStatus'];
    dotClass: string;
  }> = [
    { label: 'Pendiente', value: 'pending', dotClass: 'bg-slate-400' },
    { label: 'En proceso', value: 'in_progress', dotClass: 'bg-blue-500' },
    { label: 'Falta corregir', value: 'needs_review', dotClass: 'bg-amber-500' },
    { label: 'Completado', value: 'done', dotClass: 'bg-emerald-500' },
    { label: 'Bloqueado', value: 'blocked', dotClass: 'bg-red-500' },
    { label: 'Sin estado', value: undefined, dotClass: 'bg-slate-300' },
  ];

  return (
    <div className="flex max-h-[min(76vh,calc(100vh-6rem))] w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-[#252525] md:max-h-[calc(100vh-7rem)] md:w-auto md:flex-row md:rounded-lg">
      <div className="min-h-0 w-full overflow-y-auto border-b border-slate-200 bg-slate-50/70 p-1.5 dark:border-slate-700 dark:bg-[#2b2b2b] md:max-h-none md:w-[232px] md:border-b-0 md:border-r">
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
            onPointerEnter={() => {
              if (action.hasSubmenu) setActiveSubmenu(action.id as SubmenuId);
            }}
            className={cn(
              'group flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors md:min-h-0',
              action.id === 'delete'
                ? 'text-red-600 hover:bg-red-50 hover:text-red-700'
                : action.id === 'collapse' && isAccordion
                  ? 'bg-slate-950 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white'
                : activeSubmenu === action.id
                  ? 'bg-slate-100 text-slate-950 dark:bg-[#3a3a3a] dark:text-slate-50'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-[#343434] dark:hover:text-white'
            )}
          >
            <action.icon
              size={18}
              strokeWidth={2.5}
              className={
                action.id === 'delete'
                  ? 'text-red-500'
                  : action.id === 'collapse' && isAccordion
                    ? 'text-white dark:text-slate-950'
                  : activeSubmenu === action.id
                    ? 'text-slate-950 dark:text-slate-50'
                    : 'text-slate-400 group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-slate-200'
              }
            />
            <span className="flex-1 text-left font-medium">{action.label}</span>
            {action.hasSubmenu && <ChevronRight size={14} className="text-slate-400" />}
          </button>
        ))}
      </div>

      <div className="min-h-0 w-full overflow-y-auto p-3 md:w-[300px] md:p-4">
      {activeSubmenu === 'styles' && (
        <div className="flex w-full flex-col gap-4">
          {groups.map((group) => (
            <div key={group.label} className="flex flex-col gap-2">
              <p className="px-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{group.label}</p>
              <div className="grid grid-cols-4 gap-2">
                {group.options.map((option) => (
                  <button
                    key={`${option.id}-${option.label}`}
                    type="button"
                    onClick={() => onSelect(option.id)}
                    title={option.label}
                    className={`group flex min-h-12 w-full items-center justify-center rounded-lg border transition-colors md:aspect-square md:min-h-0 ${
                      currentType === option.id
                        ? 'border-slate-950 bg-slate-950 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-950'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-[#343434] dark:hover:text-white'
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
        <div className="flex w-full flex-col gap-1">
          {insertOptions.map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={option.onClick}
              className="group flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-[#343434] dark:hover:text-white md:min-h-0"
            >
              <option.icon size={18} strokeWidth={2.5} className="text-slate-400 group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-slate-200" />
              <div className="flex flex-1 flex-col items-start">
                <span className="font-medium">{option.label}</span>
                <span className="mt-0.5 text-[10px] font-medium uppercase text-slate-400 dark:text-slate-500">
                  {option.shortcut}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {activeSubmenu === 'status' && (
        <div className="flex w-full flex-col gap-1">
          <p className="px-2 pb-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Estado
          </p>
          {statusOptions.map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => onSetActivityStatus?.(option.value)}
              className="group flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-[#343434] dark:hover:text-white md:min-h-0"
            >
              <span className={`h-2.5 w-2.5 rounded-full ${option.dotClass}`} />
              <span className="flex-1 text-left font-medium">{option.label}</span>
              {!option.value && <CircleDashed size={16} className="text-slate-400" />}
            </button>
          ))}
        </div>
      )}
      </div>
    </div>
  );
};
