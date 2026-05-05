import { Heading1, Type, CheckSquare } from 'lucide-react';

export const SlashMenu = ({ position, onSelect }: { position: { x: number, y: number }, onSelect: (type: string) => void }) => {
  const options = [
    { id: 'h1', label: 'Heading 1', icon: Heading1 },
    { id: 'text', label: 'Text', icon: Type },
    { id: 'todo', label: 'To-do list', icon: CheckSquare },
  ];

  return (
    <div 
      className="fixed bg-white shadow-2xl border border-gray-100 rounded-xl p-2 z-50 w-48 animate-in zoom-in-95"
      style={{ top: position.y, left: position.x }}
    >
      <p className="text-[10px] font-bold text-gray-400 px-2 mb-1 uppercase">Basics</p>
      {options.map(opt => (
        <button 
          key={opt.id}
          onClick={() => onSelect(opt.id)}
          className="flex items-center gap-3 w-full px-2 py-1.5 hover:bg-blue-50 rounded-lg text-sm text-gray-700 transition-colors"
        >
          <div className="p-1 bg-gray-50 rounded border border-gray-100"><opt.icon size={14}/></div>
          {opt.label}
        </button>
      ))}
    </div>
  );
};