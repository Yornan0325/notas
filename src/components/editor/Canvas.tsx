import { useState, useEffect } from 'react';
import { useCodaStore } from '../../store/useCodaStore';
import { BlockWrapper } from './BlockWrapper';
import { SlashMenu } from './SlashMenu';

export const Canvas = ({ pageId, pageTitle }: { pageId: string, pageTitle: string }) => {
  const { blocks, addBlock, updateBlock, changeBlockType, updatePageTitle, removeBlock } = useCodaStore();

  // Estado para el menú Slash
  const [slashMenu, setSlashMenu] = useState<{ x: number, y: number, blockId: string } | null>(null);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  
  const pageBlocks = blocks.filter(b => b.pageId === pageId);

  const handleKeyDown = (e: React.KeyboardEvent, blockId: string) => {
    const currentBlock = pageBlocks.find(b => b.id === blockId);
    const currentIndex = pageBlocks.findIndex(b => b.id === blockId);

    // 1. Enter: Solo permite saltar si hay contenido previo
    if (e.key === 'Enter' && !e.shiftKey && !slashMenu) {
      e.preventDefault();
      if (currentBlock && currentBlock.content.trim().length > 0) {
        const newId = addBlock('text', pageId);
        setActiveBlockId(newId);
      }
      return;
    }

    // 2. Backspace: Si borra todo y sigue borrando, sube al anterior
    if (e.key === 'Backspace' && currentBlock && currentBlock.content === '') {
      if (currentIndex > 0) {
        e.preventDefault();
        const prevBlock = pageBlocks[currentIndex - 1];
        removeBlock(blockId);
        setActiveBlockId(prevBlock.id);
      }
    }

    // 3. Flechas para navegación rápida
    if (e.key === 'ArrowUp' && currentIndex > 0) {
      e.preventDefault();
      setActiveBlockId(pageBlocks[currentIndex - 1].id);
    }
    if (e.key === 'ArrowDown' && currentIndex < pageBlocks.length - 1) {
      e.preventDefault();
      setActiveBlockId(pageBlocks[currentIndex + 1].id);
    }
  };

  const handleTextChange = (id: string, value: string, e: any) => {
    updateBlock(id, value);

    // 2. Detectar el símbolo "/" para abrir el menú slash
    const cursorPosition = e.target.selectionStart;
    const lastChar = value[cursorPosition - 1];

    if (lastChar === '/') {
      const rect = e.target.getBoundingClientRect();
      setSlashMenu({
        x: rect.left,
        y: rect.top + 30,
        blockId: id
      });
    } else {
      setSlashMenu(null);
    }
  };

  const handleSelectType = (type: any) => {
    if (slashMenu) {
      changeBlockType(slashMenu.blockId, type);
      const currentBlock = blocks.find(b => b.id === slashMenu.blockId);
      if (currentBlock) {
        updateBlock(slashMenu.blockId, currentBlock.content.replace('/', ''));
      }
      setSlashMenu(null);
      // Mantener el foco
      setActiveBlockId(slashMenu.blockId);
    }
  };

  // Inicialización de primer bloque si la página está vacía
  useEffect(() => {
    if (pageBlocks.length === 0) {
      addBlock('text', pageId);
    }
  }, [pageId, pageBlocks.length, addBlock]);

  return (
    <div className="flex-1 max-w-4xl mx-auto px-12 py-20 min-h-screen relative">
      {/* SECCIÓN DE TÍTULO */}
      <input
        className="text-6xl font-black text-gray-900 mb-2 w-full outline-none border-none bg-transparent placeholder:text-gray-100 tracking-tighter"
        value={pageTitle}
        onChange={(e) => updatePageTitle(pageId, e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const newId = addBlock('text', pageId);
            setActiveBlockId(newId);
          }
        }}
        placeholder="Título de la página"
      />
      
      {pageBlocks.length === 0 && (
        <p className="text-gray-400 text-lg mb-12">Añade una descripción o empieza a escribir...</p>
      )}

      {/* ÁREA DE BLOQUES */}
      <div className="space-y-1 mt-10">
        {pageBlocks.map((block) => (
          <BlockWrapper
            key={block.id}
            block={block}
            isFocused={activeBlockId === block.id}
            onUpdate={(val, e) => handleTextChange(block.id, val, e)} 
            onChangeType={(type) => changeBlockType(block.id, type)}
            onKeyDown={(e) => handleKeyDown(e, block.id)}
            onFocus={() => setActiveBlockId(block.id)}
          />
        ))}
      </div>

      {/* MENÚ SLASH */}
      {slashMenu && (
        <SlashMenu
          position={{ x: slashMenu.x, y: slashMenu.y }}
          onSelect={handleSelectType}
        />
      )}
    </div>
  );
};