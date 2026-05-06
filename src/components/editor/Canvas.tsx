import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, ClipboardEvent, DragEvent, KeyboardEvent } from 'react';
import toast from 'react-hot-toast';
import { useCodaStore } from '../../store/useCodaStore';
import { isFirebaseConfigured } from '../../api/firebase';
import { uploadBlockImage } from '../../api/firebaseQueries';
import { BlockWrapper } from './BlockWrapper';
import { SlashMenu } from './SlashMenu';
import type { Block } from '../type/typeScript';
import { useSyncContext } from '../../context/SyncContext';

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export const Canvas = ({
  docId,
  pageId,
  pageTitle,
  readOnly = false,
}: {
  docId: string;
  pageId: string;
  pageTitle: string;
  readOnly?: boolean;
}) => {
  const {
    blocks,
    addBlock,
    updateBlock,
    updateBlockAttachment,
    updateImageLayout,
    moveBlock,
    changeBlockType,
    updatePageTitle,
    removeBlock,
  } = useCodaStore();

  const { user } = useSyncContext();

  const [slashMenu, setSlashMenu] = useState<{ x: number; y: number; blockId: string } | null>(null);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<{
    blockId: string;
    targetId: string | null;
    placement: 'before' | 'after' | 'beside';
  } | null>(null);

  const pageBlocks = useMemo(
    () => blocks.filter((block) => block.pageId === pageId),
    [blocks, pageId]
  );

  const blockRows = useMemo(() => {
    const rows: Array<
      | { type: 'single'; item: { block: Block; index: number } }
      | { type: 'columns'; items: Array<{ block: Block; index: number }> }
    > = [];

    pageBlocks.forEach((block, index) => {
      const canJoinColumns = block.type === 'image' && block.imageFlow === 'columns';
      const lastRow = rows[rows.length - 1];

      if (canJoinColumns && lastRow?.type === 'columns' && lastRow.items.length < 3) {
        lastRow.items.push({ block, index });
        return;
      }

      if (canJoinColumns) {
        rows.push({ type: 'columns', items: [{ block, index }] });
        return;
      }

      rows.push({ type: 'single', item: { block, index } });
    });

    return rows;
  }, [pageBlocks]);

  const focusNewBlock = (type: Block['type'] = 'text', afterBlockId?: string) => {
    if (readOnly) return '';
    const newId = addBlock(type, pageId, afterBlockId);
    setActiveBlockId(newId);
    return newId;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>, blockId: string) => {
    const currentBlock = pageBlocks.find((block) => block.id === blockId);
    const currentIndex = pageBlocks.findIndex((block) => block.id === blockId);
    if (readOnly) return;

    if (e.key === 'Enter' && !e.shiftKey && !slashMenu) {
      e.preventDefault();
      focusNewBlock('text', blockId);
      return;
    }

    if (e.key === 'Backspace' && currentBlock && currentBlock.content === '') {
      if (currentIndex > 0) {
        e.preventDefault();
        const prevBlock = pageBlocks[currentIndex - 1];
        removeBlock(blockId);
        setActiveBlockId(prevBlock.id);
      }
      return;
    }

    if (e.key === 'ArrowUp' && currentIndex > 0) {
      e.preventDefault();
      setActiveBlockId(pageBlocks[currentIndex - 1].id);
    }

    if (e.key === 'ArrowDown' && currentIndex < pageBlocks.length - 1) {
      e.preventDefault();
      setActiveBlockId(pageBlocks[currentIndex + 1].id);
    }
  };

  const handleTextChange = (
    id: string,
    value: string,
    e: ChangeEvent<HTMLTextAreaElement>
  ) => {
    if (readOnly) return;
    updateBlock(id, value);

    const cursorPosition = e.target.selectionStart;
    const lastChar = value[cursorPosition - 1];

    if (lastChar === '/') {
      const rect = e.target.getBoundingClientRect();
      setSlashMenu({
        x: rect.left,
        y: rect.top + 34,
        blockId: id,
      });
    } else {
      setSlashMenu(null);
    }
  };

  const handleSelectType = (type: Block['type']) => {
    if (!slashMenu) return;
    if (readOnly) return;

    changeBlockType(slashMenu.blockId, type);
    const currentBlock = blocks.find((block) => block.id === slashMenu.blockId);

    if (currentBlock) {
      updateBlock(slashMenu.blockId, currentBlock.content.replace('/', ''));
    }

    setSlashMenu(null);
    setActiveBlockId(slashMenu.blockId);
  };

  const handleUploadImage = async (blockId: string, file: File) => {
    if (readOnly) return;
    try {
      if (!isFirebaseConfigured) {
        const localUrl = await readFileAsDataUrl(file);
        updateBlockAttachment(blockId, localUrl, `local://${blockId}/${file.name}`, file.name);
        toast.success('Imagen guardada localmente');
        return;
      }

      const wsId = user?.email || 'default';
      const uploadedImage = await uploadBlockImage({ wsId, docId, pageId, blockId, file });
      updateBlockAttachment(
        blockId,
        uploadedImage.url,
        uploadedImage.path,
        uploadedImage.name
      );
      toast.success('Imagen subida');
    } catch (error) {
      console.error('No se pudo subir la imagen:', error);

      try {
        const localUrl = await readFileAsDataUrl(file);
        updateBlockAttachment(blockId, localUrl, `local://${blockId}/${file.name}`, file.name);
        toast.success('Imagen guardada localmente');
      } catch {
        toast.error('No se pudo guardar la imagen');
      }
    }
  };

  const handlePasteImage = (block: Block, file: File) => {
    if (readOnly) return;
    const targetBlockId =
      block.content.trim().length === 0 && block.type !== 'image'
        ? block.id
        : addBlock('image', pageId, block.id);

    if (targetBlockId === block.id && block.type !== 'image') {
      changeBlockType(block.id, 'image');
    }

    setActiveBlockId(targetBlockId);
    handleUploadImage(targetBlockId, file);
  };

  const getImageFromClipboard = (event: ClipboardEvent) => {
    const fileFromItems = Array.from(event.clipboardData.items)
      .find((item) => item.type.startsWith('image/'))
      ?.getAsFile();

    if (fileFromItems) return fileFromItems;

    return Array.from(event.clipboardData.files).find((file) =>
      file.type.startsWith('image/')
    );
  };

  const handleCanvasPaste = (event: ClipboardEvent<HTMLDivElement>) => {
    if (readOnly) return;
    const imageFile = getImageFromClipboard(event);
    if (!imageFile) return;

    event.preventDefault();

    const activeBlock = pageBlocks.find((block) => block.id === activeBlockId);
    if (activeBlock) {
      handlePasteImage(activeBlock, imageFile);
      return;
    }

    const lastBlock = pageBlocks[pageBlocks.length - 1];
    const newBlockId = addBlock('image', pageId, lastBlock?.id);
    setActiveBlockId(newBlockId);
    handleUploadImage(newBlockId, imageFile);
  };

  const getDropPlacement = (event: DragEvent<HTMLDivElement>, targetBlock: Block) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const yRatio = (event.clientY - rect.top) / rect.height;
    const xRatio = (event.clientX - rect.left) / rect.width;

    if (targetBlock.type === 'image' && yRatio > 0.2 && yRatio < 0.8 && xRatio > 0.25 && xRatio < 0.75) {
      return 'beside' as const;
    }

    return yRatio < 0.5 ? ('before' as const) : ('after' as const);
  };

  const handleImageDragOver = (event: DragEvent<HTMLDivElement>, targetBlock: Block) => {
    if (readOnly) return;
    if (!dragState || dragState.blockId === targetBlock.id) return;

    event.preventDefault();
    const placement = getDropPlacement(event, targetBlock);
    setDragState({ ...dragState, targetId: targetBlock.id, placement });
  };

  const handleImageDrop = (event: DragEvent<HTMLDivElement>, targetBlock: Block) => {
    if (readOnly) return;
    if (!dragState || dragState.blockId === targetBlock.id) return;

    event.preventDefault();
    const placement = getDropPlacement(event, targetBlock);
    moveBlock(dragState.blockId, targetBlock.id, placement);
    setActiveBlockId(dragState.blockId);
    setDragState(null);
  };

  useEffect(() => {
    if (!readOnly && pageBlocks.length === 0) {
      addBlock('text', pageId);
    }
  }, [addBlock, pageId, pageBlocks.length, readOnly]);

  const renderBlock = (block: Block, index: number) => (
    <BlockWrapper
      key={block.id}
      block={block}
      index={index}
      isFocused={activeBlockId === block.id}
      dragPlacement={dragState?.targetId === block.id ? dragState.placement : null}
      onAddBelow={() => focusNewBlock('text', block.id)}
      onRemove={() => removeBlock(block.id)}
      onImageDragStart={() => setDragState({ blockId: block.id, targetId: null, placement: 'after' })}
      onImageDragEnd={() => setDragState(null)}
      onImageDragOver={(event) => handleImageDragOver(event, block)}
      onImageDrop={(event) => handleImageDrop(event, block)}
      onUploadImage={(file) => handleUploadImage(block.id, file)}
      onUpdateImageLayout={(layout) => updateImageLayout(block.id, layout)}
      onUpdate={(val, e) => handleTextChange(block.id, val, e)}
      onChangeType={(type) => changeBlockType(block.id, type)}
      onKeyDown={(e) => handleKeyDown(e, block.id)}
      onFocus={() => setActiveBlockId(block.id)}
      readOnly={readOnly}
    />
  );

  return (
    <div
      className="relative mx-auto min-h-screen max-w-4xl flex-1 px-6 py-12 md:px-12"
      onPaste={readOnly ? undefined : handleCanvasPaste}
    >
      <input
        className="mb-2 w-full border-none bg-transparent text-5xl font-semibold tracking-tight text-slate-950 outline-none placeholder:text-slate-200 md:text-6xl"
        value={pageTitle}
        onChange={(e) => {
          if (!readOnly) updatePageTitle(pageId, e.target.value);
        }}
        onKeyDown={(e) => {
          if (readOnly) return;
          if (e.key === 'Enter') {
            e.preventDefault();
            focusNewBlock('text');
          }
        }}
        readOnly={readOnly}
        placeholder="Titulo de la pagina"
      />

      {pageBlocks.length === 0 && (
        <p className="mb-12 text-lg text-slate-400">
          Anade una descripcion o empieza a escribir...
        </p>
      )}

      <div className="mt-10 space-y-1">
        {blockRows.map((row) => {
          if (row.type === 'single') {
            return renderBlock(row.item.block, row.item.index);
          }

          return (
            <div
              key={row.items.map((item) => item.block.id).join('-')}
              className="grid grid-cols-1 gap-3 lg:grid-cols-3"
            >
              {row.items.map((item) => (
                <div key={item.block.id} className="min-w-0">
                  {renderBlock(item.block, item.index)}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {slashMenu && (
        <SlashMenu
          position={{ x: slashMenu.x, y: slashMenu.y }}
          onSelect={handleSelectType}
        />
      )}
    </div>
  );
};
