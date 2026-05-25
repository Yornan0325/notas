import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import toast from 'react-hot-toast';
import { Check, ChevronDown, Copy, Search } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-abap';
import 'prismjs/components/prism-actionscript';
import 'prismjs/components/prism-ada';
import 'prismjs/components/prism-agda';
import 'prismjs/components/prism-applescript';
import 'prismjs/components/prism-arduino';
import 'prismjs/components/prism-autohotkey';
import 'prismjs/components/prism-basic';

type CodeLanguageOption = {
  value: string;
  label: string;
  shortLabel: string;
  prismLanguage?: string;
  searchTerms?: string;
};

const codeLanguageOptions: CodeLanguageOption[] = [
  { value: 'plain', label: 'Plain text', shortLabel: 'Text' },
  { value: 'javascript', label: 'JavaScript', shortLabel: 'JS', prismLanguage: 'javascript' },
  { value: 'jsx', label: 'JSX', shortLabel: 'JSX', prismLanguage: 'jsx', searchTerms: 'react' },
  { value: 'typescript', label: 'TypeScript', shortLabel: 'TS', prismLanguage: 'typescript' },
  { value: 'tsx', label: 'TSX', shortLabel: 'TSX', prismLanguage: 'tsx', searchTerms: 'react typescript' },
  { value: 'json', label: 'JSON', shortLabel: 'JSON', prismLanguage: 'json' },
  { value: 'html', label: 'HTML', shortLabel: 'HTML', prismLanguage: 'markup', searchTerms: 'xml markup' },
  { value: 'css', label: 'CSS', shortLabel: 'CSS', prismLanguage: 'css' },
  { value: 'markdown', label: 'Markdown', shortLabel: 'MD', prismLanguage: 'markdown' },
  { value: 'bash', label: 'Bash', shortLabel: 'Bash', prismLanguage: 'bash', searchTerms: 'shell terminal' },
  { value: 'python', label: 'Python', shortLabel: 'PY', prismLanguage: 'python' },
  { value: 'sql', label: 'SQL', shortLabel: 'SQL', prismLanguage: 'sql' },
  { value: 'java', label: 'Java', shortLabel: 'Java', prismLanguage: 'java' },
  { value: 'c', label: 'C', shortLabel: 'C', prismLanguage: 'c' },
  { value: 'cpp', label: 'C++', shortLabel: 'C++', prismLanguage: 'cpp' },
  { value: 'csharp', label: 'C#', shortLabel: 'C#', prismLanguage: 'csharp' },
  { value: 'go', label: 'Go', shortLabel: 'Go', prismLanguage: 'go' },
  { value: 'rust', label: 'Rust', shortLabel: 'Rust', prismLanguage: 'rust' },
  { value: 'yaml', label: 'YAML', shortLabel: 'YAML', prismLanguage: 'yaml' },
  { value: 'abap', label: 'ABAP', shortLabel: 'ABAP', prismLanguage: 'abap' },
  { value: 'actionscript', label: 'ActionScript', shortLabel: 'AS', prismLanguage: 'actionscript' },
  { value: 'ada', label: 'Ada', shortLabel: 'Ada', prismLanguage: 'ada' },
  { value: 'agda', label: 'Agda', shortLabel: 'Agda', prismLanguage: 'agda' },
  { value: 'applescript', label: 'AppleScript', shortLabel: 'Apple', prismLanguage: 'applescript' },
  { value: 'arduino', label: 'Arduino', shortLabel: 'INO', prismLanguage: 'arduino' },
  { value: 'autohotkey', label: 'AutoIt / Hotkey', shortLabel: 'AHK', prismLanguage: 'autohotkey' },
  { value: 'basic', label: 'Basic', shortLabel: 'Basic', prismLanguage: 'basic' },
];

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const getDesktopMenuPosition = (button: HTMLButtonElement | null) => {
  if (!button || window.innerWidth < 768) return undefined;

  const rect = button.getBoundingClientRect();
  const menuWidth = 256;
  const margin = 12;
  const gap = 6;
  const menuHeaderHeight = 53;
  const availableBelow = window.innerHeight - rect.bottom - gap - margin;
  const availableAbove = rect.top - gap - margin;
  const openAbove = availableAbove > availableBelow && availableBelow < 280;
  const availableHeight = openAbove ? availableAbove : availableBelow;
  const menuHeight = Math.min(424, Math.max(132, availableHeight));

  return {
    left: Math.max(margin, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - margin)),
    top: openAbove ? Math.max(margin, rect.top - menuHeight - gap) : rect.bottom + gap,
    listMaxHeight: Math.max(80, menuHeight - menuHeaderHeight),
  };
};

interface CodeBlockEditorProps {
  content: string;
  language?: string;
  isFocused: boolean;
  onChange: (content: string) => void;
  onLanguageChange: (language: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  onFocus: () => void;
  readOnly?: boolean;
}

export const CodeBlockEditor = ({
  content,
  language = 'plain',
  isFocused,
  onChange,
  onLanguageChange,
  onKeyDown,
  onFocus,
  readOnly = false,
}: CodeBlockEditorProps) => {
  const [showLanguages, setShowLanguages] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [desktopMenuPosition, setDesktopMenuPosition] = useState<{
    left: number;
    top: number;
    listMaxHeight: number;
  }>();
  const menuRef = useRef<HTMLDivElement>(null);
  const languageButtonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const activeLanguage =
    codeLanguageOptions.find((option) => option.value === language) || codeLanguageOptions[0];
  const normalizedSearch = searchValue.trim().toLowerCase();
  const filteredLanguages = codeLanguageOptions.filter((option) =>
    `${option.label} ${option.value} ${option.searchTerms || ''}`.toLowerCase().includes(normalizedSearch)
  );
  const renderedContent = content.length === 0
    ? ' '
    : content.endsWith('\n')
      ? `${content} `
      : content;
  const highlightedContent = useMemo(() => {
    if (!activeLanguage.prismLanguage) return escapeHtml(renderedContent);

    const grammar = Prism.languages[activeLanguage.prismLanguage];
    return grammar
      ? Prism.highlight(renderedContent, grammar, activeLanguage.prismLanguage)
      : escapeHtml(renderedContent);
  }, [activeLanguage.prismLanguage, renderedContent]);

  useEffect(() => {
    if (!isFocused || !textareaRef.current || document.activeElement === textareaRef.current) return;

    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(content.length, content.length);
  }, [content.length, isFocused]);

  useEffect(() => {
    if (!showLanguages) return;

    searchRef.current?.focus();

    const closeMenu = (event: MouseEvent | TouchEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setShowLanguages(false);
      }
    };
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowLanguages(false);
        textareaRef.current?.focus();
      }
    };
    const repositionMenu = () => {
      setDesktopMenuPosition(getDesktopMenuPosition(languageButtonRef.current));
    };

    document.addEventListener('mousedown', closeMenu);
    document.addEventListener('touchstart', closeMenu);
    document.addEventListener('keydown', closeOnEscape);
    window.addEventListener('resize', repositionMenu);
    return () => {
      document.removeEventListener('mousedown', closeMenu);
      document.removeEventListener('touchstart', closeMenu);
      document.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('resize', repositionMenu);
    };
  }, [showLanguages]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Codigo copiado');
    } catch {
      toast.error('No se pudo copiar el codigo');
    }
  };

  const handleCodeKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Tab' && !readOnly) {
      event.preventDefault();
      const editor = event.currentTarget;
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      const nextContent = `${content.slice(0, start)}  ${content.slice(end)}`;
      onChange(nextContent);
      requestAnimationFrame(() => {
        textareaRef.current?.setSelectionRange(start + 2, start + 2);
      });
      return;
    }

    if (event.key === 'Enter' && !event.ctrlKey && !event.metaKey) {
      return;
    }

    onKeyDown(event);
  };

  return (
    <section className="code-editor w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-[#404040] dark:bg-[#282828]">
      <header className="flex min-h-11 items-center justify-end gap-1 border-b border-slate-200 px-2 py-1 dark:border-[#404040]">
        <div ref={menuRef} className="relative">
          <button
            ref={languageButtonRef}
            type="button"
            disabled={readOnly}
            onClick={() => {
              setSearchValue('');
              if (!showLanguages) {
                setDesktopMenuPosition(getDesktopMenuPosition(languageButtonRef.current));
              }
              setShowLanguages(!showLanguages);
            }}
            className="flex h-9 min-w-[4.5rem] items-center justify-center gap-1 rounded-md px-2 text-sm font-medium text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 disabled:cursor-default disabled:hover:bg-transparent dark:text-slate-200 dark:hover:bg-[#363636] dark:hover:text-white"
            aria-expanded={showLanguages}
            aria-label={`Lenguaje: ${activeLanguage.label}`}
            title="Cambiar lenguaje"
          >
            {activeLanguage.shortLabel}
            {!readOnly && <ChevronDown size={14} />}
          </button>
          {showLanguages && !readOnly && (
            <div
              style={
                desktopMenuPosition
                  ? { left: desktopMenuPosition.left, top: desktopMenuPosition.top }
                  : undefined
              }
              className="fixed bottom-4 left-3 right-3 z-[160] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-[#474747] dark:bg-[#303030] md:bottom-auto md:right-auto md:w-64"
            >
              <label className="flex items-center gap-2 border-b border-slate-200 px-3 py-2 dark:border-[#474747]">
                <Search size={16} className="shrink-0 text-slate-400" />
                <input
                  ref={searchRef}
                  type="search"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  className="h-8 w-full border-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:bg-transparent dark:text-slate-100"
                  placeholder="Buscar lenguaje"
                  aria-label="Buscar lenguaje"
                />
              </label>
              <div
                style={desktopMenuPosition ? { maxHeight: desktopMenuPosition.listMaxHeight } : undefined}
                className="max-h-[min(23rem,60vh)] overflow-y-auto p-1.5"
              >
                {filteredLanguages.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-slate-500">Sin coincidencias</p>
                ) : (
                  filteredLanguages.map((option) => (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => {
                        onLanguageChange(option.value);
                        setShowLanguages(false);
                        textareaRef.current?.focus();
                      }}
                      className={`flex min-h-10 w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${
                        option.value === activeLanguage.value
                          ? 'bg-slate-100 font-medium text-slate-900 dark:bg-[#3a3a3a] dark:text-white'
                          : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-[#363636]'
                      }`}
                    >
                      {option.label}
                      {option.value === activeLanguage.value && <Check size={16} />}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={copyCode}
          className="flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-[#363636] dark:hover:text-white"
          title="Copiar codigo"
          aria-label="Copiar codigo"
        >
          <Copy size={17} />
        </button>
      </header>
      <div className="relative min-h-[6rem] w-full">
        <pre
          aria-hidden="true"
          className={`m-0 min-h-[6rem] overflow-x-auto whitespace-pre p-4 text-sm leading-6 language-${activeLanguage.prismLanguage || 'plain'}`}
        >
          <code dangerouslySetInnerHTML={{ __html: highlightedContent }} />
        </pre>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={readOnly ? undefined : handleCodeKeyDown}
          onFocus={onFocus}
          placeholder="Escribe codigo..."
          readOnly={readOnly}
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
          aria-label="Codigo"
          className="absolute inset-0 h-full w-full resize-none overflow-x-auto whitespace-pre border-0 bg-transparent p-4 font-mono text-sm leading-6 text-transparent caret-slate-900 outline-none placeholder:text-slate-400 focus:ring-0 dark:caret-slate-100 dark:placeholder:text-slate-500"
        />
      </div>
    </section>
  );
};
