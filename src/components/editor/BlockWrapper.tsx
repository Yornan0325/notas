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
  CircleDashed,
  CircleDot,
  Code,
  Columns3,
  Circle,
  GripVertical,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link,
  List,
  ListOrdered,
  Maximize2,
  Megaphone,
  MessageSquarePlus,
  Palette,
  RotateCcw,
  Quote,
  Sparkles,
  Timer,
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
  listNumber?: number;
  isFocused: boolean;
  dragPlacement: 'before' | 'after' | 'beside' | null;
  isInColumn?: boolean;
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
  onSetActivityStatus: (status?: Block['activityStatus']) => void;
  onKeyDown: (e: KeyboardEvent<HTMLElement>) => void;
  onFocus: () => void;
  readOnly?: boolean;
}

const typeStyles: Record<Block['type'], string> = {
  h1: 'text-4xl font-semibold leading-tight tracking-tight text-slate-950 dark:text-slate-100',
  h2: 'text-3xl font-semibold leading-tight tracking-tight text-slate-900 dark:text-slate-100',
  h3: 'text-2xl font-semibold leading-tight text-slate-800 dark:text-slate-200',
  text: 'text-lg font-normal text-slate-700 dark:text-slate-300',
  title: 'text-4xl font-semibold leading-tight tracking-tight text-slate-950 dark:text-slate-100',
  todo: 'text-lg font-normal text-slate-700 dark:text-slate-300',
  bullet_list: 'text-lg font-normal text-slate-700 dark:text-slate-300',
  numbered_list: 'text-lg font-normal text-slate-700 dark:text-slate-300',
  toggle_list: 'text-lg font-normal text-slate-700 dark:text-slate-300',
  quote: 'text-xl font-medium italic text-slate-700 dark:text-slate-300',
  code: 'font-mono text-sm leading-6 text-slate-800 dark:text-slate-200',
  callout: 'text-base font-medium text-slate-800 dark:text-slate-200',
  card_notice: 'text-base font-normal text-slate-700 dark:text-slate-300',
  divider: '',
  image: 'text-base font-normal text-slate-700 dark:text-slate-300',
  view_table: 'text-base font-normal text-slate-700 dark:text-slate-300',
  view_cards: 'text-base font-normal text-slate-700 dark:text-slate-300',
  view_detail: 'text-base font-normal text-slate-700 dark:text-slate-300',
  view_calendar: 'text-base font-normal text-slate-700 dark:text-slate-300',
  view_form: 'text-base font-normal text-slate-700 dark:text-slate-300',
  view_timeline: 'text-base font-normal text-slate-700 dark:text-slate-300',
  view_chart: 'text-base font-normal text-slate-700 dark:text-slate-300',
  view_board: 'text-base font-normal text-slate-700 dark:text-slate-300',
};

const getControlsTopClass = (type: Block['type']): string => {
  switch (type) {
    case 'h1':
    case 'title':
      return 'md:top-3';
    case 'h2':
      return 'md:top-2.5';
    case 'h3':
      return 'md:top-2';
    case 'card_notice':
      return 'md:top-2';
    case 'callout':
      return 'md:top-1.5';
    case 'code':
      return 'md:top-1.5';
    default:
      return 'md:top-2.5';
  }
};

const getBadgeTopClass = (type: Block['type']): string => {
  switch (type) {
    case 'card_notice':
    case 'callout':
    case 'code':
      return 'md:top-[2px]';
    default:
      return 'md:top-2.5';
  }
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
  card_notice: 'Escribe el aviso de tarjeta...',
  divider: '',
  image: 'Describe la imagen',
  view_table: 'Tabla',
  view_cards: 'Tarjetas',
  view_detail: 'Detalle',
  view_calendar: 'Calendario',
  view_form: 'Formulario',
  view_timeline: 'Timeline',
  view_chart: 'Grafico',
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

const activityStatusOptions: Array<{
  value?: Block['activityStatus'];
  label: string;
  shortLabel: string;
  dotClass: string;
  chipClass: string;
  icon: typeof CircleDashed;
}> = [
  {
    value: 'pending',
    label: 'Pendiente',
    shortLabel: 'Pend.',
    dotClass: 'bg-slate-400',
    chipClass: 'border-slate-200 bg-slate-50 text-slate-600',
    icon: CircleDashed,
  },
  {
    value: 'in_progress',
    label: 'En proceso',
    shortLabel: 'Proceso',
    dotClass: 'bg-blue-500',
    chipClass: 'border-blue-200 bg-blue-50 text-blue-700',
    icon: Timer,
  },
  {
    value: 'needs_review',
    label: 'Falta corregir',
    shortLabel: 'Corregir',
    dotClass: 'bg-amber-500',
    chipClass: 'border-amber-200 bg-amber-50 text-amber-700',
    icon: RotateCcw,
  },
  {
    value: 'done',
    label: 'Completado',
    shortLabel: 'Listo',
    dotClass: 'bg-emerald-500',
    chipClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    icon: Check,
  },
  {
    value: 'blocked',
    label: 'Bloqueado',
    shortLabel: 'Bloq.',
    dotClass: 'bg-red-500',
    chipClass: 'border-red-200 bg-red-50 text-red-700',
    icon: CircleDot,
  },
  {
    value: undefined,
    label: 'Sin estado',
    shortLabel: 'Sin estado',
    dotClass: 'bg-slate-300',
    chipClass: 'border-slate-200 bg-white text-slate-500',
    icon: CircleDashed,
  },
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

  parsed.body.querySelectorAll('li').forEach((item) => removeLeadingListMarker(item, parsed.body));
  normalizePseudoLists(parsed.body);

  return parsed.body.innerHTML;
};

const normalizePastedText = (text: string) =>
  text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/^\n+|\n+$/g, '');

const listLinePattern = /^(\s*)(?:([•●○▪■‣–-])|(\d+|[a-zA-Z])[.)])\s+(.+)$/;
const leadingListMarkerPattern = /^(\s*)(?:[•●○▪■‣–-]|(?:\d+|[a-zA-Z])[.)])\s*/;

const removeLeadingListMarker = (element: Element, root: HTMLElement) => {
  const walker = root.ownerDocument.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let textNode = walker.nextNode() as Text | null;

  while (textNode) {
    const value = textNode.nodeValue || '';
    if (value.trim()) {
      textNode.nodeValue = value.replace(leadingListMarkerPattern, '');
      return;
    }
    textNode = walker.nextNode() as Text | null;
  }
};

const hasPlainTextList = (text: string) =>
  normalizePastedText(text)
    .split('\n')
    .some((line) => listLinePattern.test(line));

const getPlainTextListLevel = (indent: string) => Math.min(4, Math.floor(indent.replace(/\t/g, '    ').length / 2));

const plainTextListToHtml = (text: string) => {
  const lines = normalizePastedText(text).split('\n');
  const html: string[] = [];
  const listStack: Array<'ul' | 'ol'> = [];
  let openLi = false;

  const closeLi = () => {
    if (openLi) {
      html.push('</li>');
      openLi = false;
    }
  };

  const closeToLevel = (level: number) => {
    closeLi();
    while (listStack.length > level) {
      html.push(`</${listStack.pop()}>`);
    }
  };

  lines.forEach((line) => {
    const match = line.match(listLinePattern);
    if (!match) {
      if (!line.trim()) return;
      closeToLevel(0);
      html.push(escapeHtml(line.trim()), '<br>');
      return;
    }

    const [, indent, unorderedMarker, orderedMarker, content] = match;
    const listType: 'ul' | 'ol' = unorderedMarker ? 'ul' : 'ol';
    const level = getPlainTextListLevel(indent);

    closeLi();
    while (listStack.length > level + 1) {
      html.push(`</${listStack.pop()}>`);
    }
    while (listStack.length < level + 1) {
      html.push(`<${listType}>`);
      listStack.push(listType);
    }
    if (listStack[listStack.length - 1] !== listType) {
      html.push(`</${listStack.pop()}>`, `<${listType}>`);
      listStack.push(listType);
    }

    const value = orderedMarker && /^[a-zA-Z]$/.test(orderedMarker) ? orderedMarker : undefined;
    html.push(`<li${value ? ` value="${escapeHtml(value)}"` : ''}>${escapeHtml(content.trim())}`);
    openLi = true;
  });

  closeToLevel(0);
  return html.join('').replace(/<br>$/, '');
};

const plainTextToHtml = (text: string) =>
  hasPlainTextList(text)
    ? plainTextListToHtml(text)
    : normalizePastedText(text)
        .split('\n')
        .map((line) => escapeHtml(line))
        .join('<br>');

const normalizePseudoLists = (root: HTMLElement) => {
  const blockSelector = 'p, div';
  const blocks = Array.from(root.querySelectorAll(blockSelector)).filter(
    (element) => !element.closest('ul, ol') && listLinePattern.test(element.textContent || '')
  );

  blocks.forEach((element) => {
    const text = element.textContent || '';
    const match = text.match(listLinePattern);
    if (!match) return;

    const [, , unorderedMarker, , content] = match;
    const list = root.ownerDocument.createElement(unorderedMarker ? 'ul' : 'ol');
    const item = root.ownerDocument.createElement('li');
    item.innerHTML = element.innerHTML;
    removeLeadingListMarker(item, root);
    if (!item.textContent?.trim()) item.textContent = content.trim();
    list.appendChild(item);
    element.replaceWith(list);
  });
};

const imageExtensionPattern = /\.(apng|avif|gif|jpe?g|png|svg|webp|bmp|ico|tiff?)(\?.*)?$/i;

const isLikelyImageSource = (value: string) => {
  const source = value.trim();
  if (!source) return false;
  if (/^data:image\//i.test(source)) return true;

  try {
    const parsedUrl = new URL(source);
    return imageExtensionPattern.test(parsedUrl.pathname);
  } catch {
    return imageExtensionPattern.test(source);
  }
};

const clipboardHasImage = (clipboardData: DataTransfer) => {
  const hasImageFile =
    Array.from(clipboardData.items).some((item) => item.type.startsWith('image/')) ||
    Array.from(clipboardData.files).some((file) => file.type.startsWith('image/'));

  if (hasImageFile) return true;

  const html = clipboardData.getData('text/html');
  if (html.trim()) {
    const parsed = new DOMParser().parseFromString(html, 'text/html');
    const img = parsed.querySelector('img');
    const text = parsed.body.textContent?.trim();
    if (img && (!text || text.length <= 1)) return true;
  }

  return (
    isLikelyImageSource(clipboardData.getData('text/uri-list')) ||
    isLikelyImageSource(clipboardData.getData('text/plain'))
  );
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

const hasStructuredListContent = (html: string) => /<(ul|ol)\b/i.test(html);

const isSelectionAtStartOfElement = (element: HTMLElement) => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || !selection.isCollapsed) return false;

  const range = selection.getRangeAt(0);
  const beforeRange = range.cloneRange();
  beforeRange.selectNodeContents(element);
  beforeRange.setEnd(range.startContainer, range.startOffset);

  return beforeRange.toString().length === 0;
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
  listNumber,
  isFocused,
  dragPlacement,
  isInColumn = false,
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
  onSetActivityStatus,
  onKeyDown,
  onFocus,
  readOnly = false,
}: BlockWrapperProps) => {
  const [showSelector, setShowSelector] = useState(false);
  const [selectorPosition, setSelectorPosition] = useState<{ left: number; top: number } | null>(null);
  const [isTodoChecked, setIsTodoChecked] = useState(false);
  const [isImageSelected, setIsImageSelected] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState<{ left: number; top: number } | null>(null);
  const [toolbarMenu, setToolbarMenu] = useState<'style' | 'decor' | 'align' | 'color' | 'highlight' | null>(null);
  const [showActivityMenu, setShowActivityMenu] = useState(false);
  const [isGrabbed, setIsGrabbed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const richTextRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageFrameRef = useRef<HTMLDivElement>(null);
  const blockContainerRef = useRef<HTMLDivElement>(null);
  const imageWidth = block.imageWidth || 100;
  const imageAlign = block.imageAlign || 'center';
  const imageFlow = block.imageFlow || 'stack';
  const isViewBlock = isViewBlockType(block.type);
  const canCollapse = !isViewBlock && block.type !== 'image' && block.type !== 'code' && block.type !== 'divider';
  const canFavorite = true;
  const canTrackActivity = !isViewBlock && block.type !== 'image' && block.type !== 'divider';
  const hasIcon = ['todo', 'bullet_list', 'numbered_list', 'toggle_list', 'callout'].includes(block.type);
  const activeActivityStatus = block.activityStatus
    ? activityStatusOptions.find((item) => item.value === block.activityStatus)
    : undefined;
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
    if (!isFocused) setIsImageSelected(false);
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

  useEffect(() => {
    if (!showSelector || typeof window === 'undefined') return;

    const rect = blockContainerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const topSafeArea = 76;
    const margin = 12;
    const estimatedMenuHeight = Math.min(560, window.innerHeight - topSafeArea - margin);
    const openUp = rect.top + estimatedMenuHeight > window.innerHeight - margin;
    const top = openUp
      ? Math.max(topSafeArea + margin, rect.bottom - estimatedMenuHeight)
      : Math.max(topSafeArea + margin, rect.top + 8);

    setSelectorPosition({
      left: Math.max(margin, rect.left + 40),
      top,
    });
  }, [showSelector]);

  useEffect(() => {
    if (!showSelector) return;

    const closeSelector = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-block-type-selector="true"]')) return;
      if (target && blockContainerRef.current?.contains(target)) return;
      setShowSelector(false);
    };

    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setShowSelector(false);
    };

    document.addEventListener('mousedown', closeSelector);
    document.addEventListener('touchstart', closeSelector);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeSelector);
      document.removeEventListener('touchstart', closeSelector);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [showSelector]);

  useEffect(() => {
    if (!showActivityMenu) return;

    const closeActivityMenu = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-activity-status-menu="true"]')) return;
      setShowActivityMenu(false);
    };

    document.addEventListener('mousedown', closeActivityMenu);
    document.addEventListener('touchstart', closeActivityMenu);
    return () => {
      document.removeEventListener('mousedown', closeActivityMenu);
      document.removeEventListener('touchstart', closeActivityMenu);
    };
  }, [showActivityMenu]);

  const blockShell =
    block.type === 'code'
      ? 'rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-950/50'
      : block.type === 'callout'
        ? 'rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 dark:border-amber-900/30 dark:bg-amber-950/20'
        : block.type === 'card_notice'
          ? `rounded-xl border border-slate-200 bg-white py-1.5 px-3 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50 ${
              isInColumn || imageFlow === 'columns' ? 'w-full' : 'w-full md:w-fit md:max-w-md'
            }`
          : block.type === 'quote'
            ? 'border-l-4 border-slate-300 pl-4 dark:border-slate-700'
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

  const insertRichPlainText = (text: string) => {
    const editor = richTextRef.current;
    const html = plainTextToHtml(text);
    if (!editor || !html.trim()) return;

    editor.focus();
    document.execCommand('insertHTML', false, html);
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
    const selection = window.getSelection();
    const selectedNode = selection?.anchorNode;
    const selectedElement =
      selectedNode instanceof HTMLElement ? selectedNode : selectedNode?.parentElement;
    const selectedListItem = selectedElement?.closest('li');

    if (event.key === 'Tab' && selectedListItem) {
      event.preventDefault();
      applyRichTextCommand(event.shiftKey ? 'outdent' : 'indent');
      return;
    }

    if (event.key === 'Enter' && event.shiftKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      insertRichTextLineBreak();
      return;
    }

    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      selectedListItem
    ) {
      window.setTimeout(() => {
        if (richTextRef.current) onUpdate(richTextRef.current.innerHTML);
      });
      return;
    }

    if (
      event.key === 'Backspace' &&
      selectedListItem &&
      (!selectedListItem.textContent?.trim() || isSelectionAtStartOfElement(selectedListItem))
    ) {
      event.preventDefault();
      applyRichTextCommand('outdent');
      return;
    }

    onKeyDown(event);
  };

  const applyListStyle = (action: 'unordered' | 'ordered' | 'toggle' | 'checklist') => {
    if (action === 'toggle') {
      onChangeType('toggle_list');
      return;
    }

    if (action === 'checklist') {
      onChangeType('todo');
      return;
    }

    onChangeType(action === 'ordered' ? 'numbered_list' : 'bullet_list');
    applyRichTextCommand(action === 'ordered' ? 'insertOrderedList' : 'insertUnorderedList');
  };

  const handleRichTextPaste = (event: ClipboardEvent<HTMLDivElement>) => {
    if (clipboardHasImage(event.clipboardData)) return;

    const html = event.clipboardData.getData('text/html');
    if (/<\/?(ul|ol|li)\b/i.test(html)) {
      event.preventDefault();
      event.stopPropagation();
      insertRichHtml(html);
      return;
    }

    const text = event.clipboardData.getData('text/plain');
    if (text.trim()) {
      event.preventDefault();
      event.stopPropagation();
      insertRichPlainText(text);
      return;
    }

    if (!html) return;

    event.preventDefault();
    event.stopPropagation();
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
  const showImageActions = !readOnly && (isImageSelected || isFocused);

  const toolbarButtonClass =
    'flex h-10 min-w-10 items-center justify-center gap-1 rounded-lg px-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white md:h-9 md:min-w-9';

  const dropdownButtonClass =
    'flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 md:min-h-0';

  return (
    <div
      ref={blockContainerRef}
      id={`block-${block.id}`}
      data-editor-block="true"
      className={`group relative flex items-start rounded-md py-1 pl-12 transition-colors ${
        isInColumn ? 'md:pl-14' : 'md:-ml-10 md:pl-18'
      } ${
        block.type !== 'callout' && block.type !== 'card_notice' && block.type !== 'code' ? 'hover:bg-slate-50' : ''
      }`}
      onDragOver={readOnly ? undefined : onImageDragOver}
      onDrop={readOnly ? undefined : onImageDrop}
      draggable={!readOnly && block.type === 'card_notice' && isGrabbed}
      onDragStart={(event) => {
        if (readOnly || block.type !== 'card_notice') return;
        setIsDragging(true);
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', block.id);
        onImageDragStart();
      }}
      onDragEnd={() => {
        setIsDragging(false);
        setIsGrabbed(false);
        if (block.type === 'card_notice') {
          onImageDragEnd();
        }
      }}
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
        <div className="absolute right-1 top-1 z-30 flex rounded-full border border-slate-200 bg-white/95 p-0.5 shadow-sm dark:border-slate-700 dark:bg-[#2b2b2b]/95 md:hidden">
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
          className={`absolute left-1 top-1 z-[80] flex flex-col items-center gap-1 transition-opacity ${getControlsTopClass(
            block.type
          )} md:flex-row md:gap-0.5 md:opacity-0 md:group-hover:opacity-100 ${
            block.type === 'card_notice' || block.type === 'callout' || block.type === 'code' ? 'md:-left-5' : 'md:-left-4'
          } ${
            isFocused || showSelector || block.isFavorite ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {canFavorite && (
            <button
              type="button"
              onClick={onToggleFavorite}
              className={`hidden h-6 w-6 items-center justify-center rounded transition-all hover:bg-slate-100 dark:hover:bg-slate-800 md:flex ${
                block.isFavorite
                  ? 'text-amber-500'
                  : 'text-slate-300 hover:text-slate-400 dark:text-slate-600 dark:hover:text-slate-500'
              }`}
              title={block.isFavorite ? 'Quitar favorito' : 'Marcar favorito'}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full transition-all ${
                  block.isFavorite
                    ? 'bg-amber-400 scale-110 shadow-sm'
                    : 'border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800'
                }`}
              />
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowSelector(!showSelector)}
            onMouseEnter={() => {
              if (block.type === 'card_notice') {
                setIsGrabbed(true);
              }
            }}
            onMouseLeave={() => {
              if (!isDragging) {
                setIsGrabbed(false);
              }
            }}
            className={`flex h-8 w-8 items-center justify-center rounded text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 md:h-6 md:w-6 md:cursor-grab md:text-slate-300 ${
              showSelector || isFocused ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
            title="Cambiar tipo de bloque"
          >
            <GripVertical size={16} />
          </button>
        </div>
      )}

      {canTrackActivity && (
        <div
          data-activity-status-menu="true"
          className={`${
            isInColumn
              ? 'absolute right-2 top-2'
              : `absolute -left-4 top-1 md:-left-[72px] ${getBadgeTopClass(block.type)}`
          } flex items-center justify-center ${
            showActivityMenu ? 'z-[140]' : 'z-10'
          } ${
            block.activityStatus || showActivityMenu
              ? 'opacity-100'
              : isInColumn
                ? 'pointer-events-none opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto'
                : 'pointer-events-none opacity-0'
          } transition-opacity`}
        >
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setShowActivityMenu((value) => !value);
            }}
            className={`inline-flex h-5 w-5 items-center justify-center rounded-full border text-[0px] font-semibold leading-none transition-colors md:h-[22px] md:w-auto md:gap-1.5 md:px-2 md:text-[10px] ${
              activeActivityStatus?.chipClass || 'border-slate-200 bg-white text-slate-500'
            } dark:border-slate-700 dark:bg-[#2b2b2b] dark:text-slate-200`}
            title="Cambiar estado de actividad"
          >
            <span className={`h-2 w-2 rounded-full md:h-1.5 md:w-1.5 ${activeActivityStatus?.dotClass || 'bg-slate-300'}`} />
            <span className="hidden md:inline">{activeActivityStatus?.shortLabel || 'Estado'}</span>
          </button>

          {showActivityMenu && (
            <div className={`absolute ${isInColumn ? 'right-0' : 'left-0 md:left-0'} top-7 z-[150] max-h-[min(64vh,320px)] w-52 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-[#252525] sm:w-56`}>
              <p className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Estado
              </p>
              {activityStatusOptions
                .filter((status) => status.value || block.activityStatus)
                .map((status) => (
                <button
                  key={status.label}
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onSetActivityStatus(status.value);
                    setShowActivityMenu(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <span className={`h-2 w-2 rounded-full ${status.dotClass}`} />
                  <span className="flex-1">{status.label}</span>
                  {block.activityStatus === status.value && <Check size={14} />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {showSelector && !readOnly && (
        <div
          data-block-type-selector="true"
          className="fixed inset-x-2 bottom-20 z-[130] animate-in fade-in zoom-in-95 duration-150 md:inset-auto md:z-[70]"
          style={isNarrowViewport ? undefined : selectorPosition || undefined}
        >
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
            onSetActivityStatus={(status) => {
              onSetActivityStatus(status);
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

      <div
        className={`flex w-full items-start gap-2.5 ${blockShell}`}
      >
        {hasIcon && (
          <div
            className={`flex min-w-[22px] items-center justify-center text-slate-400 md:min-w-[28px] ${
              block.type === 'callout' ? 'min-h-6 mt-0.5' : 'min-h-7'
            }`}
          >
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
            {block.type === 'bullet_list' && !hasStructuredListContent(block.content) && (
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
            )}
            {block.type === 'numbered_list' && !hasStructuredListContent(block.content) && (
              <span className="text-lg font-medium leading-7 text-slate-400">{listNumber ?? index + 1}.</span>
            )}
            {block.type === 'toggle_list' && <ChevronRight size={16} />}
            {block.type === 'callout' && <Megaphone size={16} className="text-amber-600 shrink-0" />}
          </div>
        )}

      <div className={`relative w-full ${isInColumn ? 'pr-8 md:pr-20' : ''}`}>

        {toolbarPosition && !readOnly && (
          <div
            data-rich-text-toolbar="true"
            className="fixed inset-x-1 bottom-2 z-[120] flex max-w-[calc(100vw-0.5rem)] items-center gap-0.5 overflow-x-auto rounded-xl border border-slate-200 bg-white px-1.5 py-1.5 text-slate-600 shadow-xl dark:border-slate-700 dark:bg-[#252525] md:inset-auto md:bottom-auto md:max-w-none md:-translate-x-1/2 md:gap-1 md:overflow-visible md:rounded-full md:px-3 md:py-2"
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
                          applyListStyle(item.action as 'unordered' | 'ordered' | 'toggle' | 'checklist');
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
                {showImageActions && (
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
    </div>
  );
};
