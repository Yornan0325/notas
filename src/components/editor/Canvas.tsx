import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, ClipboardEvent, DragEvent, KeyboardEvent, MouseEvent as ReactMouseEvent } from 'react';
import toast from 'react-hot-toast';
import { useCodaStore } from '../../store/useCodaStore';
import { BlockWrapper } from './BlockWrapper';
import { SlashMenu } from './SlashMenu';
import type { Block, Page } from '../type/typeScript';
import { getDefaultViewContent, isViewBlockType, stringifyViewContent, type ViewBlockType } from './viewBlocks';

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

type PastedImageSource =
  | { kind: 'file'; file: File }
  | { kind: 'url'; url: string; name: string };

const normalizeImageUrl = (value: string | null) => {
  const url = value?.trim();
  if (!url) return null;

  if (/^data:image\//i.test(url)) return url;
  if (!/^https?:\/\//i.test(url)) return null;

  try {
    const parsedUrl = new URL(url);
    const googleImageUrl = parsedUrl.searchParams.get('imgurl');
    if (googleImageUrl && /^https?:\/\//i.test(googleImageUrl)) {
      return decodeURIComponent(googleImageUrl);
    }
  } catch {
    return url;
  }

  return url;
};

const getBestSrcsetUrl = (srcset: string | null) => {
  if (!srcset) return null;

  const candidates = srcset
    .split(',')
    .map((candidate) => {
      const [url, descriptor = ''] = candidate.trim().split(/\s+/);
      const score = Number.parseFloat(descriptor) || 0;
      return { url, score };
    })
    .filter((candidate) => candidate.url)
    .sort((a, b) => b.score - a.score);

  return normalizeImageUrl(candidates[0]?.url || null);
};

const getImageUrlFromHtml = (html: string) => {
  if (!html.trim()) return null;

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const img = doc.querySelector('img');
  if (!img) return null;

  return (
    normalizeImageUrl(img.getAttribute('src')) ||
    normalizeImageUrl(img.getAttribute('data-src')) ||
    normalizeImageUrl(img.getAttribute('data-iurl')) ||
    getBestSrcsetUrl(img.getAttribute('srcset'))
  );
};

const getImageUrlFromText = (text: string) => {
  const value = text.trim();
  return normalizeImageUrl(value);
};

const getBlockPlainText = (content: string) => {
  const element = document.createElement('div');
  element.innerHTML = content;
  return element.textContent?.trim() || '';
};

const isTextEntryBlock = (type: Block['type']) =>
  !isViewBlockType(type) && type !== 'image' && type !== 'divider';

const favoriteFallbackLabels: Partial<Record<Block['type'], string>> = {
  h1: 'Titulo favorito',
  h2: 'Seccion favorita',
  h3: 'Subtitulo favorito',
  quote: 'Cita favorita',
  callout: 'Aviso favorito',
  todo: 'Tarea favorita',
  text: 'Texto favorito',
};

const placeholdersForFavorite = (type: Block['type']) =>
  favoriteFallbackLabels[type] || 'Bloque favorito';

export const Canvas = ({
  pageId,
  pageTitle,
  subpages = [],
  onSelectPage,
  readOnly = false,
}: {
  docId: string;
  pageId: string;
  pageTitle: string;
  subpages?: Page[];
  onSelectPage?: (id: string) => void;
  readOnly?: boolean;
}) => {
  const {
    blocks,
    addBlock,
    addBlockAtStart,
    updateBlock,
    updateBlockAttachment,
    updateImageLayout,
    moveBlock,
    changeBlockType,
    toggleBlockCollapsed,
    toggleBlockFavorite,
    updatePageTitle,
    removeBlock,
  } = useCodaStore();

  const canvasRef = useRef<HTMLDivElement>(null);

  const [slashMenu, setSlashMenu] = useState<{ x: number; y: number; blockId: string } | null>(null);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [isFavoritePanelOpen, setIsFavoritePanelOpen] = useState(false);
  const [dragState, setDragState] = useState<{
    blockId: string;
    targetId: string | null;
    placement: 'before' | 'after' | 'beside';
  } | null>(null);

  const pageBlocks = useMemo(
    () =>
      blocks
        .map((block, index) => ({ block, index }))
        .filter((item) => item.block.pageId === pageId)
        .sort((a, b) => {
          const orderA = a.block.blockOrder ?? a.index;
          const orderB = b.block.blockOrder ?? b.index;
          return orderA === orderB ? a.index - b.index : orderA - orderB;
        })
        .map((item) => item.block),
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

  const favoriteTextBlocks = useMemo(
    () => pageBlocks.filter((block) => block.isFavorite && isTextEntryBlock(block.type)),
    [pageBlocks]
  );

  const scrollToBlock = (blockId: string) => {
    document.getElementById(`block-${blockId}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
    setActiveBlockId(blockId);
  };

  const focusNewBlock = (type: Block['type'] = 'text', afterBlockId?: string) => {
    if (readOnly) return '';
    const newId = addBlock(type, pageId, afterBlockId);
    setActiveBlockId(newId);
    return newId;
  };

  const focusNewBlockAtStart = (type: Block['type'] = 'text') => {
    if (readOnly) return '';
    const newId = addBlockAtStart(type, pageId);
    setActiveBlockId(newId);
    return newId;
  };

  const insertDividerAbove = (blockId: string) => {
    if (readOnly) return '';

    const currentIndex = pageBlocks.findIndex((block) => block.id === blockId);
    if (currentIndex <= 0) {
      return focusNewBlockAtStart('divider');
    }

    return focusNewBlock('divider', pageBlocks[currentIndex - 1].id);
  };

  const insertDividerBelow = (blockId: string) => {
    if (readOnly) return '';
    return focusNewBlock('divider', blockId);
  };

  const focusTextEntryFromCanvasClick = () => {
    if (readOnly) return;

    const lastBlock = pageBlocks[pageBlocks.length - 1];
    if (!lastBlock) {
      focusNewBlock('text');
      return;
    }

    if (isTextEntryBlock(lastBlock.type) && getBlockPlainText(lastBlock.content) === '') {
      setActiveBlockId(lastBlock.id);
      return;
    }

    focusNewBlock('text', lastBlock.id);
  };

  const handleCanvasMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (readOnly || event.button !== 0) return;

    const target = event.target as HTMLElement;
    const isExistingEditorTarget = target.closest(
      '[data-editor-block="true"], button, input, textarea, a, [contenteditable="true"]'
    );

    if (isExistingEditorTarget) return;
    focusTextEntryFromCanvasClick();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>, blockId: string) => {
    const currentBlock = pageBlocks.find((block) => block.id === blockId);
    const currentIndex = pageBlocks.findIndex((block) => block.id === blockId);
    if (readOnly) return;

    if (e.key === 'Enter' && !e.shiftKey && !slashMenu) {
      e.preventDefault();
      focusNewBlock('text', blockId);
      return;
    }

    if (e.key === 'Backspace' && currentBlock && getBlockPlainText(currentBlock.content) === '') {
      if (currentIndex > 0) {
        e.preventDefault();
        const prevBlock = pageBlocks[currentIndex - 1];
        removeBlock(blockId);
        setActiveBlockId(prevBlock.id);
      }
      return;
    }

    const currentBlockIsEmpty = currentBlock && getBlockPlainText(currentBlock.content) === '';

    if (e.key === 'ArrowUp' && currentIndex > 0 && currentBlockIsEmpty) {
      e.preventDefault();
      setActiveBlockId(pageBlocks[currentIndex - 1].id);
    }

    if (e.key === 'ArrowDown' && currentIndex < pageBlocks.length - 1 && currentBlockIsEmpty) {
      e.preventDefault();
      setActiveBlockId(pageBlocks[currentIndex + 1].id);
    }
  };

  const handleTextChange = (
    id: string,
    value: string,
    e?: ChangeEvent<HTMLTextAreaElement>
  ) => {
    if (readOnly) return;
    updateBlock(id, value);
    if (!e) return;

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

    if (isViewBlockType(type)) {
      updateBlock(slashMenu.blockId, stringifyViewContent(getDefaultViewContent(type)));
    } else if (currentBlock) {
      updateBlock(slashMenu.blockId, currentBlock.content.replace('/', ''));
    }

    setSlashMenu(null);
    setActiveBlockId(slashMenu.blockId);
  };

  const storeImageFile = async (blockId: string, file: File) => {
    if (readOnly) return;
    try {
      const localUrl = await readFileAsDataUrl(file);
      updateBlockAttachment(blockId, localUrl, `store://${pageId}/${blockId}/${file.name}`, file.name);
      toast.success('Imagen guardada en el store');
    } catch (error) {
      console.error('No se pudo guardar la imagen:', error);
      toast.error('No se pudo guardar la imagen');
    }
  };

  const attachImageUrl = async (blockId: string, url: string, name: string) => {
    if (readOnly) return;

    if (url.startsWith('data:image/')) {
      updateBlockAttachment(blockId, url, `store://${pageId}/${blockId}/${name}`, name);
      toast.success('Imagen guardada en el store');
      return;
    }

    try {
      const response = await fetch(url);
      const blob = await response.blob();

      if (!blob.type.startsWith('image/')) {
        throw new Error('La URL no devolvio una imagen');
      }

      const extension = blob.type.split('/')[1] || 'png';
      const file = new File([blob], `${name}.${extension}`, { type: blob.type });
      await storeImageFile(blockId, file);
    } catch {
      updateBlockAttachment(blockId, url, `external://${url}`, name);
      toast.success('Imagen enlazada en el store');
    }
  };

  const handleAttachImage = (blockId: string, source: PastedImageSource) => {
    if (source.kind === 'file') {
      storeImageFile(blockId, source.file);
      return;
    }

    attachImageUrl(blockId, source.url, source.name);
  };

  const handlePasteImage = (block: Block, source: PastedImageSource) => {
    if (readOnly) return;
    const targetBlockId =
      block.content.trim().length === 0 && (block.type !== 'image' || !block.content)
        ? block.id
        : addBlock('image', pageId, block.id);

    if (targetBlockId === block.id && block.type !== 'image') {
      changeBlockType(block.id, 'image');
    }

    setActiveBlockId(targetBlockId);
    handleAttachImage(targetBlockId, source);
  };

  const getImageFromClipboard = (clipboardData: DataTransfer): PastedImageSource | null => {
    const fileFromItems = Array.from(clipboardData.items)
      .find((item) => item.type.startsWith('image/'))
      ?.getAsFile();

    if (fileFromItems) return { kind: 'file', file: fileFromItems };

    const fileFromList = Array.from(clipboardData.files).find((file) =>
      file.type.startsWith('image/')
    );
    if (fileFromList) return { kind: 'file', file: fileFromList };

    const htmlImageUrl = getImageUrlFromHtml(clipboardData.getData('text/html'));
    if (htmlImageUrl) return { kind: 'url', url: htmlImageUrl, name: 'imagen-pegada' };

    const uriListImageUrl = getImageUrlFromText(clipboardData.getData('text/uri-list'));
    if (uriListImageUrl) return { kind: 'url', url: uriListImageUrl, name: 'imagen-pegada' };

    const textImageUrl = getImageUrlFromText(clipboardData.getData('text/plain'));
    if (textImageUrl) return { kind: 'url', url: textImageUrl, name: 'imagen-pegada' };

    return null;
  };

  const pasteImageIntoPage = (source: PastedImageSource) => {
    if (readOnly) return;

    const activeBlock = pageBlocks.find((block) => block.id === activeBlockId);
    if (activeBlock) {
      handlePasteImage(activeBlock, source);
      return;
    }

    const lastBlock = pageBlocks[pageBlocks.length - 1];
    const newBlockId = addBlock('image', pageId, lastBlock?.id);
    setActiveBlockId(newBlockId);
    handleAttachImage(newBlockId, source);
  };

  const addViewBlockBelow = (type: ViewBlockType, afterBlockId?: string) => {
    if (readOnly) return;
    const newBlockId = addBlock(type, pageId, afterBlockId);
    updateBlock(newBlockId, stringifyViewContent(getDefaultViewContent(type)));
    setActiveBlockId(newBlockId);
  };

  const changeBlockTypeWithDefaults = (blockId: string, type: Block['type']) => {
    if (readOnly) return;
    changeBlockType(blockId, type);
    if (isViewBlockType(type)) {
      updateBlock(blockId, stringifyViewContent(getDefaultViewContent(type)));
    }
  };

  const handleCanvasPaste = (event: ClipboardEvent<HTMLDivElement>) => {
    if (readOnly) return;
    const imageSource = getImageFromClipboard(event.clipboardData);
    if (!imageSource) return;

    event.preventDefault();
    pasteImageIntoPage(imageSource);
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

  useEffect(() => {
    if (readOnly) return;

    const handleWindowPaste = (event: globalThis.ClipboardEvent) => {
      if (!event.clipboardData) return;

      const activeElement = document.activeElement;
      const pasteBelongsToCanvas =
        activeElement === document.body ||
        activeElement === null;

      if (!pasteBelongsToCanvas) return;

      const imageSource = getImageFromClipboard(event.clipboardData);
      if (!imageSource) return;

      event.preventDefault();
      pasteImageIntoPage(imageSource);
    };

    window.addEventListener('paste', handleWindowPaste);
    return () => window.removeEventListener('paste', handleWindowPaste);
    // pasteImageIntoPage is intentionally scoped to the current page state above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBlockId, pageBlocks, readOnly]);

  const renderBlock = (block: Block, index: number) => (
    <BlockWrapper
      key={block.id}
      block={block}
      index={index}
      isFocused={activeBlockId === block.id}
      dragPlacement={dragState?.targetId === block.id ? dragState.placement : null}
      onInsertDividerAbove={() => insertDividerAbove(block.id)}
      onInsertDividerBelow={() => insertDividerBelow(block.id)}
      onRemove={() => {
        const currentIndex = pageBlocks.findIndex((item) => item.id === block.id);
        const nextFocus = pageBlocks[currentIndex + 1]?.id || pageBlocks[currentIndex - 1]?.id || null;
        removeBlock(block.id);
        setActiveBlockId(nextFocus);
      }}
      onImageDragStart={() => setDragState({ blockId: block.id, targetId: null, placement: 'after' })}
      onImageDragEnd={() => setDragState(null)}
      onImageDragOver={(event) => handleImageDragOver(event, block)}
      onImageDrop={(event) => handleImageDrop(event, block)}
      onUploadImage={(file) => storeImageFile(block.id, file)}
      onUpdateImageLayout={(layout) => updateImageLayout(block.id, layout)}
      onAddViewBelow={(type) => addViewBlockBelow(type, block.id)}
      onUpdate={(val, e) => handleTextChange(block.id, val, e)}
      onOpenSlashMenu={(position) => setSlashMenu({ ...position, blockId: block.id })}
      onCloseSlashMenu={() => setSlashMenu(null)}
      onChangeType={(type) => changeBlockTypeWithDefaults(block.id, type)}
      onToggleCollapse={() => toggleBlockCollapsed(block.id)}
      onToggleFavorite={() => toggleBlockFavorite(block.id)}
      onKeyDown={(e) => handleKeyDown(e, block.id)}
      onFocus={() => setActiveBlockId(block.id)}
      readOnly={readOnly}
    />
  );

  return (
    <div
      ref={canvasRef}
      data-editor-canvas="true"
      className="relative mx-auto min-h-screen max-w-4xl flex-1 px-4 py-10 md:px-12 md:py-12"
      onMouseDown={handleCanvasMouseDown}
      onPaste={readOnly ? undefined : handleCanvasPaste}
      tabIndex={-1}
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
            focusNewBlockAtStart('text');
          }
        }}
        readOnly={readOnly}
        placeholder="Titulo de la pagina"
      />

      {subpages.length > 0 && (
        <div className="mt-10 flex flex-wrap gap-3">
          {subpages.map((page) => (
            <button
              key={page.id}
              type="button"
              onClick={() => onSelectPage?.(page.id)}
              className="group flex min-h-10 max-w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-left shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 hover:shadow"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center text-2xl">
                {page.icon || 'P'}
              </span>
              <span className="max-w-[260px] truncate text-lg font-bold text-slate-950">
                {page.title}
              </span>
            </button>
          ))}
        </div>
      )}

      {pageBlocks.length === 0 && (
        <p className="mb-12 text-lg text-slate-400">
          Anade una descripcion o empieza a escribir...
        </p>
      )}

      {favoriteTextBlocks.length > 0 && (
        <>
        <aside className="fixed right-4 top-24 z-30 hidden w-56 rounded-lg border border-amber-200 bg-white/95 p-2 shadow-lg shadow-amber-100/70 backdrop-blur md:block">
          <div className="mb-2 flex items-center gap-2 px-1.5">
            <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_0_4px_rgba(251,191,36,0.18)]" />
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Favoritos</p>
            </div>
          </div>
          <div className="max-h-[calc(100vh-8rem)] space-y-1 overflow-y-auto">
            {favoriteTextBlocks.map((block) => {
              const text = getBlockPlainText(block.content) || placeholdersForFavorite(block.type);

              return (
                <button
                  key={block.id}
                  type="button"
                  onClick={() => scrollToBlock(block.id)}
                  className="group flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-xs text-slate-600 transition-colors hover:bg-amber-50 hover:text-slate-950"
                  title={text}
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400 group-hover:shadow-[0_0_0_3px_rgba(251,191,36,0.18)]" />
                  <span className="min-w-0 overflow-hidden text-ellipsis font-medium leading-snug [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">
                    {text}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <button
          type="button"
          onClick={() => setIsFavoritePanelOpen(true)}
          className="fixed bottom-4 right-4 z-30 inline-flex h-11 items-center gap-2 rounded-full border border-amber-200 bg-white/95 px-3 text-xs font-bold uppercase tracking-wide text-amber-700 shadow-lg shadow-amber-100/70 backdrop-blur md:hidden"
          aria-label="Abrir favoritos"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_0_4px_rgba(251,191,36,0.18)]" />
          Favoritos
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] leading-none">
            {favoriteTextBlocks.length}
          </span>
        </button>

        {isFavoritePanelOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-slate-950/20"
              aria-label="Cerrar favoritos"
              onClick={() => setIsFavoritePanelOpen(false)}
            />
            <aside className="absolute inset-x-3 bottom-3 max-h-[46vh] rounded-xl border border-amber-200 bg-white p-3 shadow-2xl shadow-amber-100/80">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_0_4px_rgba(251,191,36,0.18)]" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Favoritos</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFavoritePanelOpen(false)}
                  className="rounded-full px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100"
                >
                  Cerrar
                </button>
              </div>
              <div className="max-h-[34vh] space-y-1 overflow-y-auto">
                {favoriteTextBlocks.map((block) => {
                  const text = getBlockPlainText(block.content) || placeholdersForFavorite(block.type);

                  return (
                    <button
                      key={block.id}
                      type="button"
                      onClick={() => {
                        scrollToBlock(block.id);
                        setIsFavoritePanelOpen(false);
                      }}
                      className="group flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm text-slate-600 transition-colors hover:bg-amber-50 hover:text-slate-950"
                      title={text}
                    >
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                      <span className="min-w-0 overflow-hidden text-ellipsis font-medium leading-snug [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">
                        {text}
                      </span>
                    </button>
                  );
                })}
              </div>
            </aside>
          </div>
        )}
        </>
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
