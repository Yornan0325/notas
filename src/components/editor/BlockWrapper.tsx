import { useState, useRef, useEffect } from 'react';
import { GripVertical, Plus } from 'lucide-react';
import { BlockTypeSelector } from './BlockTypeSelector';
import type { Block } from '../type/typeScript';

interface BlockWrapperProps {
  block: Block;
  isFocused: boolean;
  onUpdate: (content: string, e: any) => void;
  onChangeType: (type: Block['type']) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onFocus: () => void;
}

export const BlockWrapper = ({ 
  block, 
  isFocused, 
  onUpdate, 
  onChangeType, 
  onKeyDown, 
  onFocus 
}: BlockWrapperProps) => {
  const [showSelector, setShowSelector] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-ajuste de altura al cargar o cambiar contenido
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [block.content]);

  // Manejar el foco programático que envía el componente Canvas
  useEffect(() => {
    if (isFocused && textareaRef.current) {
        textareaRef.current.focus();
        // Mover el cursor al final del contenido
        const length = textareaRef.current.value.length;
        textareaRef.current.setSelectionRange(length, length);
    }
  }, [isFocused]);

  const typeStyles = {
    h1: "text-4xl font-black text-gray-900 mt-6 mb-2 tracking-tight",
    h2: "text-3xl font-bold text-gray-800 mt-5 mb-2",
    h3: "text-2xl font-bold text-gray-800 mt-4 mb-1",
    text: "text-lg text-gray-700 font-normal",
    title: "text-4xl font-black text-gray-900 mt-6 mb-2 tracking-tight",
    todo: "text-lg text-gray-600 font-normal italic",
  };

  return (
    <div
      className="group relative flex items-start gap-2 pl-14 -ml-14 py-1 rounded-lg hover:bg-gray-50/50 transition-all focus-within:bg-gray-50/70"
      onMouseLeave={() => setShowSelector(false)}
    >

      {/* 1. ZONA DE CONTROL (Grip y Plus) */}
      <div className="absolute left-2 top-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <button
          onClick={() => setShowSelector(!showSelector)}
          className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Plus size={16} />
        </button>
        <div className="p-1 cursor-grab text-gray-300 hover:text-gray-500">
          <GripVertical size={16} />
        </div>
      </div>

      {/* Selector Flotante (Aparece al dar clic al Plus) */}
      {showSelector && (
        <div className="absolute left-10 top-0 shadow-2xl z-[70] animate-in slide-in-from-left-2 duration-200">
          <BlockTypeSelector
            currentType={block.type}
            onSelect={(type) => {
              onChangeType(type);
              setShowSelector(false);
            }}
          />
        </div>
      )}

      {/* 2. INDICADOR LATERAL (Checkbox dinámico) */}
      <div className="pt-2.5 min-w-[24px] flex justify-center text-gray-300">
        {block.type === 'todo' ? (
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
        ) : null}
      </div>

      {/* 3. ÁREA DE TEXTO */}
      <textarea
        ref={textareaRef}
        className={`w-full bg-transparent resize-none py-1 focus:outline-none leading-relaxed transition-all placeholder:text-gray-200
          ${typeStyles[block.type] || typeStyles.text} 
        `}
        value={block.content}
        onChange={(e) => {
          onUpdate(e.target.value, e);
        }}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        rows={1}
        placeholder={block.type.startsWith('h') ? 'Título...' : 'Escribe "/" para comandos...'}
      />
    </div>
  );
};