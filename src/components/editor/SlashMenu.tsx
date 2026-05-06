import {
  CheckSquare,
  Code,
  GalleryVerticalEnd,
  Heading1,
  Heading2,
  Heading3,
  Image,
  List,
  ListOrdered,
  Megaphone,
  Quote,
  Table2,
  Type,
} from 'lucide-react';
import type { Block } from '../type/typeScript';

export const SlashMenu = ({
  position,
  onSelect,
}: {
  position: { x: number; y: number };
  onSelect: (type: Block['type']) => void;
}) => {
  const options: Array<{ id: Block['type']; label: string; icon: typeof Type }> = [
    { id: 'text', label: 'Texto', icon: Type },
    { id: 'h1', label: 'Titulo 1', icon: Heading1 },
    { id: 'h2', label: 'Titulo 2', icon: Heading2 },
    { id: 'h3', label: 'Titulo 3', icon: Heading3 },
    { id: 'bullet_list', label: 'Lista', icon: List },
    { id: 'numbered_list', label: 'Lista numerada', icon: ListOrdered },
    { id: 'todo', label: 'Tarea', icon: CheckSquare },
    { id: 'quote', label: 'Cita', icon: Quote },
    { id: 'code', label: 'Codigo', icon: Code },
    { id: 'callout', label: 'Aviso', icon: Megaphone },
    { id: 'image', label: 'Imagen', icon: Image },
    { id: 'view_table', label: 'Tabla', icon: Table2 },
    { id: 'view_cards', label: 'Cards', icon: GalleryVerticalEnd },
  ];

  return (
    <div
      className="fixed z-50 w-56 rounded-md border border-slate-200 bg-white p-1 shadow-md animate-in zoom-in-95"
      style={{ top: position.y, left: position.x }}
    >
      <p className="mb-1 px-2 py-1 text-xs font-medium text-slate-500">
        Bloques
      </p>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onSelect(option.id)}
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950"
        >
          <span className="rounded border border-slate-200 bg-slate-50 p-1 text-slate-500">
            <option.icon size={14} />
          </span>
          {option.label}
        </button>
      ))}
    </div>
  );
};
