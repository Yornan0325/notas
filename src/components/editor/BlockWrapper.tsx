import { useState, useRef, useEffect } from 'react';
import type {
  ChangeEvent,
  DragEvent,
  KeyboardEvent,
  MouseEvent as ReactMouseEvent,
} from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Check,
  ChevronRight,
  Columns3,
  GripVertical,
  Image,
  Italic,
  Maximize2,
  Megaphone,
  Palette,
  Plus,
  Strikethrough,
  Trash2,
  Underline,
  Upload,
} from 'lucide-react';
import { BlockTypeSelector } from './BlockTypeSelector';
import type { Block } from '../type/typeScript';
import { ViewBlock } from './ViewBlock';
import { isViewBlockType, type ViewBlockType } from './viewBlocks';

interface BlockWrapperProps {
  block: Block;
  index: number;
  isFocused: boolean;
  dragPlacement: 'before' | 'after' | 'beside' | null;
  onAddBelow: () => void;
  onRemove: () => void;
  onImageDragStart: () => void;
  onImageDragEnd: () => void;
  onImageDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onImageDrop: (event: DragEvent<HTMLDivElement>) => void;
  onUploadImage: (file: File) => Promise<void>;
  onUpdateImageLayout: (layout: Pick<Block, 'imageWidth' | 'imageAlign' | 'imageFlow'>) => void;
  onAddViewBelow: (type: ViewBlockType) => void;
  onUpdate: (content: string, e?: ChangeEvent<HTMLTextAreaElement>) => void;
  onChangeType: (type: Block['type']) => void;
  onKeyDown: (e: KeyboardEvent<HTMLElement>) => void;
  onFocus: () => void;
  readOnly?: boolean;
}

const typeStyles: Record<Block['type'], string> = {
  h1: 'mt-7 mb-2 text-4xl font-semibold tracking-tight text-slate-950',
  h2: 'mt-6 mb-2 text-3xl font-semibold tracking-tight text-slate-900',
  h3: 'mt-4 mb-1 text-2xl font-semibold text-slate-800',
  text: 'text-lg font-normal text-slate-700',
  title: 'mt-7 mb-2 text-4xl font-semibold tracking-tight text-slate-950',
  todo: 'text-lg font-normal text-slate-700',
  bullet_list: 'text-lg font-normal text-slate-700',
  numbered_list: 'text-lg font-normal text-slate-700',
  toggle_list: 'text-lg font-normal text-slate-700',
  quote: 'text-xl font-medium italic text-slate-700',
  code: 'font-mono text-sm leading-6 text-slate-800',
  callout: 'text-base font-medium text-slate-800',
  image: 'text-base font-normal text-slate-700',
  view_table: 'text-base font-normal text-slate-700',
  view_cards: 'text-base font-normal text-slate-700',
  view_detail: 'text-base font-normal text-slate-700',
  view_calendar: 'text-base font-normal text-slate-700',
  view_form: 'text-base font-normal text-slate-700',
  view_timeline: 'text-base font-normal text-slate-700',
  view_chart: 'text-base font-normal text-slate-700',
  view_board: 'text-base font-normal text-slate-700',
};

const placeholders: Record<Block['type'], string> = {
  h1: 'Titulo grande',
  h2: 'Titulo de seccion',
  h3: 'Subtitulo',
  title: 'Titulo',
  text: 'Escribe "/" para comandos',
  todo: 'Tarea pendiente',
  bullet_list: 'Elemento de lista',
  numbered_list: 'Elemento numerado',
  toggle_list: 'Detalle desplegable',
  quote: 'Cita o nota destacada',
  code: 'Codigo',
  callout: 'Aviso o contexto importante',
  image: 'Describe la imagen',
  view_table: 'Table',
  view_cards: 'Cards',
  view_detail: 'Detail',
  view_calendar: 'Calendar',
  view_form: 'Form',
  view_timeline: 'Timeline',
  view_chart: 'Chart',
  view_board: 'Board',
};

export const BlockWrapper = ({
  block,
  index,
  isFocused,
  dragPlacement,
  onAddBelow,
  onRemove,
  onImageDragStart,
  onImageDragEnd,
  onImageDragOver,
  onImageDrop,
  onUploadImage,
  onUpdateImageLayout,
  onAddViewBelow,
  onUpdate,
  onChangeType,
  onKeyDown,
  onFocus,
  readOnly = false,
}: BlockWrapperProps) => {
  const [showSelector, setShowSelector] = useState(false);
  const [isTodoChecked, setIsTodoChecked] = useState(false);
  const [isImageSelected, setIsImageSelected] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState<{ left: number; top: number } | null>(null);
  const [colorPanel, setColorPanel] = useState<'text' | 'highlight' | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const richTextRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageFrameRef = useRef<HTMLDivElement>(null);
  const imageWidth = block.imageWidth || 100;
  const imageAlign = block.imageAlign || 'center';
  const imageFlow = block.imageFlow || 'stack';
  const isViewBlock = isViewBlockType(block.type);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [block.content, block.type]);

  useEffect(() => {
    if (isFocused && textareaRef.current) {
      textareaRef.current.focus();
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);
    }
  }, [isFocused]);

  useEffect(() => {
    const editor = richTextRef.current;
    if (!editor || document.activeElement === editor) return;
    if (editor.innerHTML !== block.content) {
      editor.innerHTML = block.content;
    }
  }, [block.content]);

  useEffect(() => {
    if (!isFocused || !richTextRef.current) return;

    const editor = richTextRef.current;
    if (document.activeElement === editor) return;
    editor.focus();

    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);

    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, [isFocused]);

  const blockShell =
    block.type === 'code'
      ? 'rounded-md border border-slate-200 bg-slate-50 px-3 py-2'
      : block.type === 'callout'
        ? 'rounded-md border border-amber-200 bg-amber-50 px-3 py-2'
        : block.type === 'quote'
          ? 'border-l-4 border-slate-300 pl-4'
          : '';

  const imageAlignmentClass = {
    left: 'mr-auto',
    center: 'mx-auto',
    right: 'ml-auto',
  }[imageAlign];

  const startImageResize = (event: ReactMouseEvent<HTMLElement>, edge: 'left' | 'right' = 'right') => {
    event.preventDefault();
    event.stopPropagation();

    const frame = imageFrameRef.current;
    const parent = frame?.parentElement;
    if (!frame || !parent) return;

    const startX = event.clientX;
    const parentWidth = parent.getBoundingClientRect().width;
    const startWidth = imageWidth;

    const handleMove = (moveEvent: MouseEvent) => {
      const direction = edge === 'left' ? -1 : 1;
      const delta = (moveEvent.clientX - startX) * direction;
      const nextWidth = Math.min(100, Math.max(10, startWidth + (delta / parentWidth) * 100));
      onUpdateImageLayout({ imageWidth: Math.round(nextWidth) });
    };

    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  const updateToolbarPosition = () => {
    const selection = window.getSelection();
    const editor = richTextRef.current;

    if (!selection || !editor || selection.isCollapsed || !editor.contains(selection.anchorNode)) {
      setToolbarPosition(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (!rect.width && !rect.height) {
      setToolbarPosition(null);
      return;
    }

    setToolbarPosition({
      left: rect.left + rect.width / 2,
      top: Math.max(12, rect.top - 52),
    });
  };

  const applyRichTextCommand = (command: string, value?: string) => {
    const editor = richTextRef.current;
    if (!editor) return;

    editor.focus();
    document.execCommand(command, false, value);
    onUpdate(editor.innerHTML);
    updateToolbarPosition();
  };

  const insertRichTextLineBreak = () => {
    const editor = richTextRef.current;
    if (!editor) return;

    editor.focus();
    document.execCommand('insertHTML', false, '<br>');
    onUpdate(editor.innerHTML);
    setToolbarPosition(null);
  };

  const handleRichTextKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      insertRichTextLineBreak();
      return;
    }

    onKeyDown(event);
  };

  const textColorOptions = ['#111827', '#dc2626', '#ea580c', '#16a34a', '#2563eb', '#7c3aed', '#be185d', '#6b7280'];
  const highlightColorOptions = ['#fecaca', '#fed7aa', '#fef3c7', '#bbf7d0', '#bfdbfe', '#e9d5ff', '#fbcfe8', '#e5e7eb'];

  const clearFormattingColor = () => {
    if (colorPanel === 'text') {
      applyRichTextCommand('removeFormat');
      return;
    }

    applyRichTextCommand('backColor', 'transparent');
  };

  return (
    <div
      className={`group relative -ml-14 flex items-start gap-2 rounded-md py-1 pl-14 transition-colors hover:bg-slate-50 focus-within:bg-slate-50 ${blockShell}`}
      onMouseLeave={() => setShowSelector(false)}
      onDragOver={readOnly ? undefined : onImageDragOver}
      onDrop={readOnly ? undefined : onImageDrop}
    >
      {dragPlacement === 'before' && (
        <div className="absolute left-8 right-0 top-0 h-0.5 rounded bg-slate-950" />
      )}
      {dragPlacement === 'after' && (
        <div className="absolute bottom-0 left-8 right-0 h-0.5 rounded bg-slate-950" />
      )}
      {dragPlacement === 'beside' && (
        <div className="absolute inset-y-2 right-1 w-1 rounded bg-slate-950" />
      )}
      {!readOnly && (
        <div className="absolute left-2 top-2 z-20 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={onAddBelow}
          className="rounded p-1 text-slate-400 transition-colors hover:bg-white hover:text-slate-700 hover:shadow-sm"
          title="Insertar bloque debajo"
        >
          <Plus size={16} />
        </button>
        <button
          type="button"
          onClick={() => setShowSelector(!showSelector)}
          className="cursor-grab rounded p-1 text-slate-300 transition-colors hover:bg-white hover:text-slate-600 hover:shadow-sm"
          title="Cambiar tipo de bloque"
        >
          <GripVertical size={16} />
        </button>
        </div>
      )}

      {showSelector && !readOnly && (
        <div className="absolute left-10 top-0 z-[70] shadow-lg animate-in slide-in-from-left-2 duration-200">
          <BlockTypeSelector
            currentType={block.type}
            onSelect={(type) => {
              onChangeType(type);
              setShowSelector(false);
            }}
          />
        </div>
      )}

      <div className="flex min-w-[28px] justify-center pt-2.5 text-slate-400">
        {block.type === 'todo' && (
          <button
            type="button"
            onClick={() => setIsTodoChecked(!isTodoChecked)}
            className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
              isTodoChecked ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-300 bg-white'
            }`}
          >
            {isTodoChecked && <Check size={12} strokeWidth={3} />}
          </button>
        )}
        {block.type === 'bullet_list' && <span className="mt-0.5 text-xl leading-none">-</span>}
        {block.type === 'numbered_list' && (
          <span className="text-sm font-semibold text-slate-400">{index + 1}.</span>
        )}
        {block.type === 'toggle_list' && <ChevronRight size={16} className="mt-0.5" />}
        {block.type === 'callout' && <Megaphone size={17} className="mt-0.5 text-amber-600" />}
        {block.type === 'image' && <Image size={17} className="mt-0.5 text-slate-500" />}
      </div>

      <div className="w-full">
        {toolbarPosition && !readOnly && (
          <div
            className="fixed z-[120] flex -translate-x-1/2 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-2 text-slate-600 shadow-xl"
            style={{ left: toolbarPosition.left, top: toolbarPosition.top }}
            onMouseDown={(event) => event.preventDefault()}
          >
            <button
              type="button"
              onClick={() => applyRichTextCommand('removeFormat')}
              className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-slate-100"
              title="Texto normal"
            >
              <span className="text-lg font-semibold">T</span>
            </button>
            <button
              type="button"
              onClick={() => applyRichTextCommand('bold')}
              className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-slate-100"
              title="Negrita"
            >
              <Bold size={18} />
            </button>
            <button
              type="button"
              onClick={() => applyRichTextCommand('italic')}
              className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-slate-100"
              title="Italica"
            >
              <Italic size={18} />
            </button>
            <button
              type="button"
              onClick={() => applyRichTextCommand('underline')}
              className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-slate-100"
              title="Subrayar"
            >
              <Underline size={18} />
            </button>
            <button
              type="button"
              onClick={() => applyRichTextCommand('strikeThrough')}
              className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-slate-100"
              title="Tachar"
            >
              <Strikethrough size={18} />
            </button>
            <div className="mx-1 h-6 w-px bg-slate-200" />
            <div className="relative flex items-center gap-1">
              <button
                type="button"
                onClick={() => setColorPanel((value) => (value === 'text' ? null : 'text'))}
                className="flex h-8 items-center gap-1 rounded-md px-2 hover:bg-slate-100"
                title="Color de texto"
              >
                <span className="text-lg font-semibold text-red-600">A</span>
                <span className="text-xs text-slate-400">⌄</span>
              </button>
              <button
                type="button"
                onClick={() => setColorPanel((value) => (value === 'highlight' ? null : 'highlight'))}
                className="flex h-8 items-center gap-1 rounded-md px-2 hover:bg-slate-100"
                title="Color de fondo"
              >
                <span className="rounded bg-amber-100 px-1 text-lg font-semibold text-slate-700">A</span>
                <span className="text-xs text-slate-400">⌄</span>
              </button>

              {colorPanel && (
                <div className="absolute left-0 top-11 w-[232px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                  <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Palette size={15} />
                    {colorPanel === 'text' ? 'Text color' : 'Color and highlight'}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {(colorPanel === 'text' ? textColorOptions : highlightColorOptions).map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          applyRichTextCommand(colorPanel === 'text' ? 'foreColor' : 'backColor', color);
                          setColorPanel(null);
                        }}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-lg font-semibold shadow-sm hover:border-slate-300"
                        style={
                          colorPanel === 'text'
                            ? { color }
                            : { backgroundColor: color, color: '#4b5563' }
                        }
                        title={colorPanel === 'text' ? 'Aplicar color de texto' : 'Aplicar fondo'}
                      >
                        A
                      </button>
                    ))}
                  </div>
                  <div className="my-3 border-t border-dashed border-slate-200" />
                  <button
                    type="button"
                    onClick={() => {
                      clearFormattingColor();
                      setColorPanel(null);
                    }}
                    className="text-sm font-medium text-blue-700 hover:underline"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {isViewBlock && (
          <ViewBlock
            type={block.type as ViewBlockType}
            content={block.content}
            onUpdate={(content) => onUpdate(content)}
            onAddView={onAddViewBelow}
            onRemove={onRemove}
            onFocus={onFocus}
            readOnly={readOnly}
          />
        )}

        {block.type === 'image' && (
          <div className="mb-2 rounded-md bg-transparent">
            {block.content ? (
              <div
                ref={imageFrameRef}
                draggable={!readOnly}
                className={`relative overflow-hidden rounded bg-white ${imageAlignmentClass} ${
                  isImageSelected
                    ? 'outline outline-2 outline-slate-950 outline-offset-2'
                    : 'hover:outline hover:outline-1 hover:outline-slate-300 hover:outline-offset-2'
                }`}
                style={{ width: `${imageWidth}%` }}
                onDragStart={(event) => {
                  if (readOnly) return;
                  event.dataTransfer.effectAllowed = 'move';
                  event.dataTransfer.setData('text/plain', block.id);
                  onImageDragStart();
                }}
                onDragEnd={onImageDragEnd}
                onClick={(event) => {
                  event.stopPropagation();
                  setIsImageSelected(true);
                  onFocus();
                }}
                onBlur={() => setIsImageSelected(false)}
                onDoubleClick={(event) => {
                  event.stopPropagation();
                  if (!readOnly) onUpdateImageLayout({ imageWidth: 100 });
                }}
                onKeyDown={(event) => {
                  if (!readOnly && (event.key === 'Backspace' || event.key === 'Delete')) {
                    event.preventDefault();
                    onRemove();
                  }
                }}
                tabIndex={0}
              >
                <img
                  src={block.content}
                  alt={block.attachmentName || 'Imagen del bloque'}
                  className="max-h-[520px] w-full object-contain bg-white"
                  draggable={false}
                />
                {isImageSelected && !readOnly && (
                  <>
                    <div className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-white/95 p-1 shadow-sm ring-1 ring-slate-200">
                      <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) => {
                          event.stopPropagation();
                          onUpdateImageLayout({ imageAlign: 'left' });
                        }}
                        className={`rounded p-1 text-slate-500 hover:bg-slate-100 ${imageAlign === 'left' ? 'bg-slate-100 text-slate-950' : ''}`}
                        title="Alinear izquierda"
                      >
                        <AlignLeft size={14} />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) => {
                          event.stopPropagation();
                          onUpdateImageLayout({ imageAlign: 'center' });
                        }}
                        className={`rounded p-1 text-slate-500 hover:bg-slate-100 ${imageAlign === 'center' ? 'bg-slate-100 text-slate-950' : ''}`}
                        title="Centrar"
                      >
                        <AlignCenter size={14} />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) => {
                          event.stopPropagation();
                          onUpdateImageLayout({ imageAlign: 'right' });
                        }}
                        className={`rounded p-1 text-slate-500 hover:bg-slate-100 ${imageAlign === 'right' ? 'bg-slate-100 text-slate-950' : ''}`}
                        title="Alinear derecha"
                      >
                        <AlignRight size={14} />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) => {
                          event.stopPropagation();
                          onUpdateImageLayout({
                            imageFlow: imageFlow === 'columns' ? 'stack' : 'columns',
                            imageWidth: imageFlow === 'columns' ? imageWidth : Math.min(imageWidth, 50),
                          });
                        }}
                        className={`rounded p-1 text-slate-500 hover:bg-slate-100 ${imageFlow === 'columns' ? 'bg-slate-100 text-slate-950' : ''}`}
                        title="Usar en columnas"
                      >
                        <Columns3 size={14} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onMouseDown={(event) => startImageResize(event, 'left')}
                      className="absolute -left-1 top-1/2 h-10 w-2 -translate-y-1/2 cursor-ew-resize rounded-full bg-slate-950"
                      title="Arrastrar para cambiar tamano"
                    />
                    <button
                      type="button"
                      onMouseDown={(event) => startImageResize(event, 'right')}
                      className="absolute -right-1 top-1/2 h-10 w-2 -translate-y-1/2 cursor-ew-resize rounded-full bg-slate-950"
                      title="Arrastrar para cambiar tamano"
                    />
                    <button
                      type="button"
                      onMouseDown={(event) => startImageResize(event, 'right')}
                      className="absolute bottom-2 right-2 flex h-7 w-7 cursor-ew-resize items-center justify-center rounded-md bg-white/95 text-slate-950 shadow-sm ring-1 ring-slate-200"
                      title="Arrastrar para cambiar tamano"
                    >
                      <Maximize2 size={14} />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={(event) => {
                        event.stopPropagation();
                        onRemove();
                      }}
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md bg-white/95 text-red-600 shadow-sm ring-1 ring-red-100 hover:bg-red-50"
                      title="Eliminar imagen"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={readOnly}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-slate-200 px-4 py-10 text-sm font-medium text-slate-500 hover:bg-slate-50"
              >
                <Upload size={18} />
                Subir imagen
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onUploadImage(file);
                event.target.value = '';
              }}
            />
          </div>
        )}

        {block.type !== 'image' && !isViewBlock && block.type === 'code' && (
          <textarea
            ref={textareaRef}
            className={`w-full resize-none bg-transparent py-1 leading-relaxed transition-all placeholder:text-slate-300 focus:outline-none ${typeStyles[block.type]}`}
            value={block.content}
            onChange={(e) => {
              if (!readOnly) onUpdate(e.target.value, e);
            }}
            onKeyDown={readOnly ? undefined : onKeyDown}
            onFocus={onFocus}
            readOnly={readOnly}
            rows={1}
            placeholder={placeholders[block.type]}
          />
        )}

        {block.type !== 'image' && !isViewBlock && block.type !== 'code' && (
          <div
            ref={richTextRef}
            className={`min-h-[20px] w-full whitespace-pre-wrap break-words bg-transparent py-0 leading-tight transition-all focus:outline-none empty:before:text-slate-300 empty:before:content-[attr(data-placeholder)] ${typeStyles[block.type]}`}
            contentEditable={!readOnly}
            suppressContentEditableWarning
            data-placeholder={placeholders[block.type]}
            onInput={(event) => {
              if (!readOnly) onUpdate(event.currentTarget.innerHTML);
            }}
            onKeyDown={readOnly ? undefined : handleRichTextKeyDown}
            onFocus={onFocus}
            onMouseUp={updateToolbarPosition}
            onKeyUp={updateToolbarPosition}
            onBlur={() => setToolbarPosition(null)}
          />
        )}
      </div>
    </div>
  );
};
