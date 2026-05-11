import { useState, useRef, useEffect } from 'react';
import type {
  ChangeEvent,
  ClipboardEvent,
  DragEvent,
  FormEvent,
  KeyboardEvent,
  MouseEvent as ReactMouseEvent,
} from 'react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Code,
  Columns3,
  Circle,
  GripVertical,
  Heading1,
  Heading2,
  Heading3,
  Image,
  Italic,
  Link,
  List,
  ListOrdered,
  Maximize2,
  Megaphone,
  Minus,
  MessageSquarePlus,
  Palette,
  Quote,
  Sparkles,
  Strikethrough,
  Trash2,
  Type,
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
  onInsertDividerAbove: () => void;
  onInsertDividerBelow: () => void;
  onRemove: () => void;
  onImageDragStart: () => void;
  onImageDragEnd: () => void;
  onImageDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onImageDrop: (event: DragEvent<HTMLDivElement>) => void;
  onUploadImage: (file: File) => Promise<void>;
  onUpdateImageLayout: (layout: Pick<Block, 'imageWidth' | 'imageAlign' | 'imageFlow'>) => void;
  onAddViewBelow: (type: ViewBlockType) => void;
  onUpdate: (content: string, e?: ChangeEvent<HTMLTextAreaElement>) => void;
  isSlashMenuOpen: boolean;
  onOpenSlashMenu: (position: { x: number; y: number }) => void;
  onCloseSlashMenu: () => void;
  onChangeType: (type: Block['type']) => void;
  onToggleAccordion: () => void;
  onToggleCollapse: () => void;
  onToggleFavorite: () => void;
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
  divider: '',
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
  divider: '',
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

const textStyleOptions = [
  { title: 'Texto', icon: Type, command: 'formatBlock', value: '<div>' },
  { title: 'Titulo 1', icon: Heading1, command: 'formatBlock', value: '<h1>' },
  { title: 'Titulo 2', icon: Heading2, command: 'formatBlock', value: '<h2>' },
  { title: 'Titulo 3', icon: Heading3, command: 'formatBlock', value: '<h3>' },
];

const listStyleOptions = [
  { title: 'Lista', icon: List, action: 'unordered' },
  { title: 'Numerada', icon: ListOrdered, action: 'ordered' },
  { title: 'Checklist', icon: CheckSquare, action: 'checklist' },
  { title: 'Toggle', icon: ChevronRight, action: 'toggle' },
];

const quoteStyleOptions = [
  { title: 'Cita', icon: Quote, action: 'quote' },
  { title: 'Codigo', icon: Code, action: 'code' },
  { title: 'Aviso', icon: Megaphone, action: 'callout' },
];

const decorOptions = [
  { label: 'Underline', shortcut: 'Ctrl U', icon: Underline, action: 'underline' },
  { label: 'Strikethrough', shortcut: 'Ctrl Shift K', icon: Strikethrough, action: 'strike' },
  { label: 'Inline Code', shortcut: '`', icon: Code, action: 'code' },
];

const alignOptions = [
  { title: 'Izquierda', icon: AlignLeft, command: 'justifyLeft' },
  { title: 'Centro', icon: AlignCenter, command: 'justifyCenter' },
  { title: 'Derecha', icon: AlignRight, command: 'justifyRight' },
  { title: 'Justificar', icon: AlignJustify, command: 'justifyFull' },
  { title: 'Reducir sangria', icon: AlignLeft, command: 'outdent' },
  { title: 'Aumentar sangria', icon: AlignRight, command: 'indent' },
];

const sanitizePastedHtml = (html: string) => {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const blockedTags = ['script', 'style', 'meta', 'link', 'iframe', 'object', 'embed'];

  blockedTags.forEach((tag) => {
    parsed.querySelectorAll(tag).forEach((node) => node.remove());
  });

  parsed.body.querySelectorAll('*').forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();

      if (name.startsWith('on')) element.removeAttribute(attribute.name);
      if ((name === 'href' || name === 'src') && value.startsWith('javascript:')) {
        element.removeAttribute(attribute.name);
      }
    });
  });

  return parsed.body.innerHTML;
};

const getCollapsedTitleFromHtml = (html: string) => {
  const withBreaks = (html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(div|p|h1|h2|h3|li|blockquote)>/gi, '\n');
  const parsed = new DOMParser().parseFromString(withBreaks, 'text/html');
  return (
    parsed.body.textContent
      ?.split('\n')
      .map((line) => line.trim())
      .find(Boolean) || ''
  );
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export const BlockWrapper = ({
  block,
  index,
  isFocused,
  dragPlacement,
  onInsertDividerAbove,
  onInsertDividerBelow,
  onRemove,
  onImageDragStart,
  onImageDragEnd,
  onImageDragOver,
  onImageDrop,
  onUploadImage,
  onUpdateImageLayout,
  onAddViewBelow,
  onUpdate,
  isSlashMenuOpen,
  onOpenSlashMenu,
  onCloseSlashMenu,
  onChangeType,
  onToggleAccordion,
  onToggleCollapse,
  onToggleFavorite,
  onKeyDown,
  onFocus,
  readOnly = false,
}: BlockWrapperProps) => {
  const [showSelector, setShowSelector] = useState(false);
  const [isTodoChecked, setIsTodoChecked] = useState(false);
  const [isImageSelected, setIsImageSelected] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState<{ left: number; top: number } | null>(null);
  const [toolbarMenu, setToolbarMenu] = useState<'style' | 'decor' | 'align' | 'color' | 'highlight' | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const richTextRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageFrameRef = useRef<HTMLDivElement>(null);
  const imageWidth = block.imageWidth || 100;
  const imageAlign = block.imageAlign || 'center';
  const imageFlow = block.imageFlow || 'stack';
  const isViewBlock = isViewBlockType(block.type);
  const canCollapse = !isViewBlock && block.type !== 'image' && block.type !== 'code' && block.type !== 'divider';
  const canFavorite = !isViewBlock && block.type !== 'image' && block.type !== 'divider' && block.type !== 'code';
  const isAccordion = canCollapse && Boolean(block.isAccordion || block.isCollapsed);
  const isCollapsed = isAccordion && Boolean(block.isCollapsed);

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
  }, [block.content, isCollapsed]);

  useEffect(() => {
    if (!isFocused || !richTextRef.current) return;

    const editor = richTextRef.current;
    if (editor.innerHTML !== block.content) {
      editor.innerHTML = block.content;
    }

    if (document.activeElement === editor) return;
    editor.focus();

    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);

    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, [block.content, isFocused]);

  useEffect(() => {
    if (!toolbarPosition || readOnly) return;

    const closeToolbarIfSelectionIsGone = (event?: Event) => {
      const editor = richTextRef.current;
      const selection = window.getSelection();
      const target = event?.target as Node | null;
      const toolbar = document.querySelector('[data-rich-text-toolbar="true"]');

      if (target && (editor?.contains(target) || toolbar?.contains(target))) return;
      if (!selection || selection.isCollapsed || !editor || !editor.contains(selection.anchorNode)) {
        setToolbarPosition(null);
        setToolbarMenu(null);
        return;
      }

      if (target && !editor.contains(target)) {
        setToolbarPosition(null);
        setToolbarMenu(null);
      }
    };

    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setToolbarPosition(null);
        setToolbarMenu(null);
      }
    };

    document.addEventListener('mousedown', closeToolbarIfSelectionIsGone);
    document.addEventListener('touchstart', closeToolbarIfSelectionIsGone);
    document.addEventListener('selectionchange', closeToolbarIfSelectionIsGone);
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('mousedown', closeToolbarIfSelectionIsGone);
      document.removeEventListener('touchstart', closeToolbarIfSelectionIsGone);
      document.removeEventListener('selectionchange', closeToolbarIfSelectionIsGone);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [readOnly, toolbarPosition]);

  useEffect(() => {
    if (!isSlashMenuOpen) return;
    setToolbarPosition(null);
    setToolbarMenu(null);
  }, [isSlashMenuOpen]);

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

    onCloseSlashMenu();

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

  const applyInlineCode = () => {
    const editor = richTextRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0 || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return;

    const selectedText = selection.toString();
    document.execCommand('insertHTML', false, `<code>${escapeHtml(selectedText)}</code>`);
    onUpdate(editor.innerHTML);
    updateToolbarPosition();
  };

  const insertRichHtml = (html: string) => {
    const editor = richTextRef.current;
    if (!editor) return;

    editor.focus();
    document.execCommand('insertHTML', false, sanitizePastedHtml(html));
    onUpdate(editor.innerHTML);
    setToolbarPosition(null);
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
    if (event.key === 'Enter' && event.shiftKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      insertRichTextLineBreak();
      return;
    }

    onKeyDown(event);
  };

  const handleRichTextPaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const html = event.clipboardData.getData('text/html');
    if (!html) return;

    event.preventDefault();
    insertRichHtml(html);
  };

  const handleRichTextInput = (event: FormEvent<HTMLDivElement>) => {
    if (readOnly) return;

    const editor = event.currentTarget;
    onUpdate(editor.innerHTML);

    if (editor.textContent?.endsWith('/')) {
      const rect = editor.getBoundingClientRect();
      setToolbarPosition(null);
      setToolbarMenu(null);
      onOpenSlashMenu({ x: rect.left, y: rect.top + 34 });
    } else {
      onCloseSlashMenu();
    }
  };

  const textColorOptions = ['#111827', '#dc2626', '#ea580c', '#16a34a', '#2563eb', '#7c3aed', '#be185d', '#6b7280'];
  const highlightColorOptions = ['#fecaca', '#fed7aa', '#fef3c7', '#bbf7d0', '#bfdbfe', '#e9d5ff', '#fbcfe8', '#e5e7eb'];

  const clearFormattingColor = () => {
    if (toolbarMenu === 'color') {
      applyRichTextCommand('removeFormat');
      return;
    }

    applyRichTextCommand('backColor', 'transparent');
  };

  const isNarrowViewport = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;

  const toolbarButtonClass =
    'flex h-9 min-w-9 items-center justify-center gap-1 rounded-lg px-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950';

  const dropdownButtonClass =
    'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100';

  return (
    <div
      id={`block-${block.id}`}
      data-editor-block="true"
      className={`group relative flex items-start gap-2 rounded-md py-1 pl-10 transition-colors hover:bg-slate-50 md:-ml-14 md:pl-14 ${blockShell}`}
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
      {block.isFavorite && canFavorite && (
        <div className="absolute left-1 top-2 bottom-2 w-1 rounded-full bg-amber-400 md:hidden" />
      )}
      {!readOnly && isFocused && canFavorite && (
        <div className="absolute right-1 top-1 z-30 flex rounded-full border border-slate-200 bg-white/95 p-0.5 shadow-sm md:hidden">
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onToggleFavorite();
            }}
            className={`inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold transition-colors ${
              block.isFavorite
                ? 'bg-amber-50 text-amber-700'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
            aria-pressed={Boolean(block.isFavorite)}
            title={block.isFavorite ? 'Quitar favorito' : 'Marcar favorito'}
          >
            <Circle size={12} className={block.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-400'} />
            Favorito
          </button>
        </div>
      )}
      {!readOnly && (
        <div
          className={`absolute left-1 top-1 z-20 flex flex-col items-center gap-1 transition-opacity md:left-2 md:top-2 md:flex-row md:gap-0.5 md:opacity-0 md:group-hover:opacity-100 ${
            isFocused || showSelector ? 'opacity-100' : 'opacity-0'
          }`}
        >
        <button
          type="button"
          onClick={() => setShowSelector(!showSelector)}
          className="flex h-7 w-7 items-center justify-center rounded text-slate-400 transition-colors hover:bg-white hover:text-slate-600 hover:shadow-sm md:h-6 md:w-6 md:cursor-grab md:text-slate-300"
          title="Cambiar tipo de bloque"
        >
          <GripVertical size={16} />
        </button>
        {canFavorite && (
          <button
            type="button"
            onClick={onToggleFavorite}
            className="hidden h-6 w-6 items-center justify-center rounded text-slate-300 transition-colors hover:bg-white md:flex"
            title={block.isFavorite ? 'Quitar punto favorito' : 'Marcar punto favorito'}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full transition-all ${
                block.isFavorite
                  ? 'bg-amber-400'
                  : 'border border-slate-300 bg-white'
              }`}
            />
          </button>
        )}
        </div>
      )}

      {block.isFavorite && canFavorite && (
        <button
          type="button"
          onClick={readOnly ? undefined : onToggleFavorite}
          className="absolute left-8 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-amber-50 ring-1 ring-amber-200 md:flex"
          title="Punto favorito"
        >
          <span className="h-2 w-2 rounded-full bg-amber-400" />
        </button>
      )}

      {showSelector && !readOnly && (
        <div className="fixed inset-x-2 bottom-20 z-[130] shadow-lg animate-in slide-in-from-bottom-2 duration-200 md:absolute md:bottom-auto md:left-10 md:top-0 md:inset-x-auto md:z-[70] md:slide-in-from-left-2">
          <BlockTypeSelector
            currentType={block.type}
            isAccordion={isAccordion}
            onSelect={(type) => {
              onChangeType(type);
              setShowSelector(false);
            }}
            onToggleCollapse={() => {
              if (canCollapse) onToggleAccordion();
            }}
            onInsertAbove={() => {
              onInsertDividerAbove();
              setShowSelector(false);
            }}
            onInsertBelow={() => {
              onInsertDividerBelow();
              setShowSelector(false);
            }}
            onConvertToText={() => {
              onChangeType('text');
              setShowSelector(false);
            }}
            onCopyLink={() => {
              navigator.clipboard?.writeText(`${window.location.href.split('#')[0]}#block-${block.id}`);
              setShowSelector(false);
            }}
            onDelete={() => {
              onRemove();
              setShowSelector(false);
            }}
          />
        </div>
      )}

      <div className="flex min-w-[22px] justify-center pt-2.5 text-slate-400 md:min-w-[28px]">
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
        {block.type === 'divider' && <Minus size={17} className="mt-0.5 text-slate-400" />}
        {block.type === 'image' && <Image size={17} className="mt-0.5 text-slate-500" />}
      </div>

      <div className="w-full">
        {toolbarPosition && !readOnly && (
          <div
            data-rich-text-toolbar="true"
            className="fixed inset-x-1 bottom-2 z-[120] flex max-w-[calc(100vw-0.5rem)] items-center gap-0.5 overflow-x-auto rounded-xl border border-slate-200 bg-white px-1.5 py-1.5 text-slate-600 shadow-xl md:inset-auto md:bottom-auto md:max-w-none md:-translate-x-1/2 md:gap-1 md:overflow-visible md:rounded-full md:px-3 md:py-2"
            style={isNarrowViewport ? undefined : { left: toolbarPosition.left, top: toolbarPosition.top }}
            onMouseDown={(event) => event.preventDefault()}
          >
            <div className="relative">
              <button
                type="button"
                onClick={() => setToolbarMenu((value) => (value === 'style' ? null : 'style'))}
                className={`${toolbarButtonClass} ${toolbarMenu === 'style' ? 'bg-slate-100 text-slate-950' : ''}`}
                title="Estilo de texto"
              >
                <Type size={19} />
                <span className="text-xs text-slate-400">⌄</span>
              </button>
              {toolbarMenu === 'style' && (
                <div className="fixed inset-x-2 bottom-20 max-h-[62vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-xl md:absolute md:inset-x-auto md:bottom-auto md:left-0 md:top-12 md:w-[212px] md:overflow-visible">
                  <p className="mb-2 text-sm font-semibold text-slate-500">Text</p>
                  <div className="grid grid-cols-4 gap-2">
                    {textStyleOptions.map((item) => (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => {
                          applyRichTextCommand(item.command, item.value);
                          setToolbarMenu(null);
                        }}
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                        title={item.title}
                      >
                        <item.icon size={20} />
                      </button>
                    ))}
                  </div>
                  <div className="my-3 border-t border-dashed border-slate-200" />
                  <p className="mb-2 text-sm font-semibold text-slate-500">Lists</p>
                  <div className="grid grid-cols-4 gap-2">
                    {listStyleOptions.map((item) => (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => {
                          if (item.action === 'ordered') applyRichTextCommand('insertOrderedList');
                          else if (item.action === 'toggle') onChangeType('toggle_list');
                          else applyRichTextCommand('insertUnorderedList');
                          setToolbarMenu(null);
                        }}
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                        title={item.title}
                      >
                        <item.icon size={20} />
                      </button>
                    ))}
                  </div>
                  <div className="my-3 border-t border-dashed border-slate-200" />
                  <p className="mb-2 text-sm font-semibold text-slate-500">Quote</p>
                  <div className="grid grid-cols-4 gap-2">
                    {quoteStyleOptions.map((item) => (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => {
                          if (item.action === 'quote') applyRichTextCommand('formatBlock', 'blockquote');
                          if (item.action === 'code') applyInlineCode();
                          if (item.action === 'callout') onChangeType('callout');
                          setToolbarMenu(null);
                        }}
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                        title={item.title}
                      >
                        <item.icon size={20} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
              onClick={() => setToolbarMenu((value) => (value === 'decor' ? null : 'decor'))}
              className={`${toolbarButtonClass} ${toolbarMenu === 'decor' ? 'bg-slate-100 text-slate-950' : ''}`}
              title="Decoracion"
            >
              <Underline size={19} />
              <span className="text-xs text-slate-400">⌄</span>
            </button>
            {toolbarMenu === 'decor' && (
              <div className="fixed inset-x-2 bottom-20 max-h-[62vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-xl md:absolute md:inset-x-auto md:bottom-auto md:left-[132px] md:top-12 md:w-[272px] md:overflow-visible">
                {decorOptions.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      if (item.action === 'underline') applyRichTextCommand('underline');
                      if (item.action === 'strike') applyRichTextCommand('strikeThrough');
                      if (item.action === 'code') applyInlineCode();
                      setToolbarMenu(null);
                    }}
                    className={dropdownButtonClass}
                  >
                    <item.icon size={20} className="text-slate-500" />
                    <span className="flex-1">{item.label}</span>
                    <span className="text-xs font-semibold text-slate-400">{item.shortcut}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="mx-1 h-6 w-px bg-slate-200" />
            <div className="relative flex items-center gap-1">
              <button
                type="button"
                onClick={() => setToolbarMenu((value) => (value === 'color' ? null : 'color'))}
                className="flex h-8 items-center gap-1 rounded-md px-2 hover:bg-slate-100"
                title="Color de texto"
              >
                <span className="text-lg font-semibold text-red-600">A</span>
                <span className="text-xs text-slate-400">⌄</span>
              </button>
              <button
                type="button"
                onClick={() => setToolbarMenu((value) => (value === 'highlight' ? null : 'highlight'))}
                className="flex h-8 items-center gap-1 rounded-md px-2 hover:bg-slate-100"
                title="Color de fondo"
              >
                <span className="rounded bg-amber-100 px-1 text-lg font-semibold text-slate-700">A</span>
                <span className="text-xs text-slate-400">⌄</span>
              </button>

              {(toolbarMenu === 'color' || toolbarMenu === 'highlight') && (
                <div className="fixed inset-x-2 bottom-20 max-h-[62vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-xl md:absolute md:inset-x-auto md:bottom-auto md:left-0 md:top-11 md:w-[232px] md:overflow-visible">
                  <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Palette size={15} />
                    {toolbarMenu === 'color' ? 'Text color' : 'Color and highlight'}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {(toolbarMenu === 'color' ? textColorOptions : highlightColorOptions).map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          applyRichTextCommand(toolbarMenu === 'color' ? 'foreColor' : 'backColor', color);
                          setToolbarMenu(null);
                        }}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-lg font-semibold shadow-sm hover:border-slate-300"
                        style={
                          toolbarMenu === 'color'
                            ? { color }
                            : { backgroundColor: color, color: '#4b5563' }
                        }
                        title={toolbarMenu === 'color' ? 'Aplicar color de texto' : 'Aplicar fondo'}
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
                      setToolbarMenu(null);
                    }}
                    className="text-sm font-medium text-blue-700 hover:underline"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setToolbarMenu((value) => (value === 'align' ? null : 'align'))}
                className={`${toolbarButtonClass} ${toolbarMenu === 'align' ? 'bg-slate-100 text-slate-950' : ''}`}
                title="Alineacion"
              >
                <AlignLeft size={19} />
                <span className="text-xs text-slate-400">⌄</span>
              </button>
              {toolbarMenu === 'align' && (
                <div className="fixed inset-x-2 bottom-20 flex rounded-2xl border border-slate-200 bg-white p-2 shadow-xl md:absolute md:inset-x-auto md:bottom-auto md:left-0 md:top-12">
                  {alignOptions.map((item) => (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => {
                        applyRichTextCommand(item.command);
                        setToolbarMenu(null);
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                      title={item.title}
                    >
                      <item.icon size={19} />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="button" onClick={() => applyRichTextCommand('removeFormat')} className={toolbarButtonClass} title="Limpiar formato">
              <Strikethrough size={19} />
            </button>
            <button type="button" onClick={() => applyRichTextCommand('createLink', window.prompt('Pega el enlace') || '')} className={toolbarButtonClass} title="Enlace">
              <Link size={19} />
            </button>
            <div className="mx-1 h-6 w-px bg-slate-200" />
            <button type="button" className={toolbarButtonClass} title="AI">
              <Sparkles size={17} />
              <span className="text-sm font-semibold">AI</span>
              <span className="text-xs text-slate-400">⌄</span>
            </button>
            <div className="mx-1 h-6 w-px bg-slate-200" />
            <button type="button" className={toolbarButtonClass} title="Comentar">
              <MessageSquarePlus size={18} />
              <span className="text-sm font-semibold">Comment</span>
            </button>
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

        {block.type === 'divider' && (
          <button
            type="button"
            onClick={onFocus}
            onKeyDown={(event) => {
              if (!readOnly && (event.key === 'Backspace' || event.key === 'Delete')) {
                event.preventDefault();
                onRemove();
              }
            }}
            className="group/divider flex min-h-7 w-full items-center py-2"
            title="Separador"
          >
            <span
              className={`block h-px w-full transition-colors ${
                isFocused ? 'bg-slate-950' : 'bg-slate-200 group-hover/divider:bg-slate-300'
              }`}
            />
          </button>
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

        {block.type !== 'image' && block.type !== 'divider' && !isViewBlock && block.type === 'code' && (
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

        {block.type !== 'image' && block.type !== 'divider' && !isViewBlock && block.type !== 'code' && (
          isAccordion ? (
            isCollapsed ? (
            <button
              type="button"
              onClick={onToggleCollapse}
              className={`flex min-h-[32px] w-full items-center gap-2 rounded-md px-1 py-1 text-left text-slate-700 ${typeStyles[block.type]}`}
              title="Expandir contenido"
            >
              <ChevronRight size={16} className="shrink-0 text-slate-400" />
              <span className="truncate">
                {getCollapsedTitleFromHtml(block.content) || placeholders[block.type]}
              </span>
            </button>
            ) : (
              <div data-collapsible-content="true" className="flex w-full items-start gap-2 rounded-md px-1 py-1.5">
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={onToggleCollapse}
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-white hover:text-slate-700"
                  title="Contraer contenido"
                >
                  <ChevronDown size={16} />
                </button>
                <div
                  ref={richTextRef}
                  className={`rich-text-editor min-h-[20px] min-w-0 flex-1 whitespace-pre-wrap break-words bg-transparent py-0 leading-tight transition-all focus:outline-none empty:before:text-slate-300 empty:before:content-[attr(data-placeholder)] ${typeStyles[block.type]}`}
                  contentEditable={!readOnly}
                  suppressContentEditableWarning
                  data-placeholder={placeholders[block.type]}
                  onInput={handleRichTextInput}
                  onKeyDown={readOnly ? undefined : handleRichTextKeyDown}
                  onPaste={readOnly ? undefined : handleRichTextPaste}
                  onFocus={onFocus}
                  onMouseUp={updateToolbarPosition}
                  onKeyUp={updateToolbarPosition}
                  onBlur={() => setToolbarPosition(null)}
                />
              </div>
            )
          ) : (
            <div
              ref={richTextRef}
              className={`rich-text-editor min-h-[20px] w-full whitespace-pre-wrap break-words bg-transparent py-0 leading-tight transition-all focus:outline-none empty:before:text-slate-300 empty:before:content-[attr(data-placeholder)] ${typeStyles[block.type]}`}
              contentEditable={!readOnly}
              suppressContentEditableWarning
              data-placeholder={placeholders[block.type]}
              onInput={handleRichTextInput}
              onKeyDown={readOnly ? undefined : handleRichTextKeyDown}
              onPaste={readOnly ? undefined : handleRichTextPaste}
              onFocus={onFocus}
              onMouseUp={updateToolbarPosition}
              onKeyUp={updateToolbarPosition}
              onBlur={() => setToolbarPosition(null)}
            />
          )
        )}
      </div>
    </div>
  );
};
