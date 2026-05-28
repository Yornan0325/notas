import { useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import {
  Copy,
  Download,
  Expand,
  FileInput,
  GripVertical,
  Link,
  MoreVertical,
  Plus,
  Table2,
  Trash2,
  Type,
} from 'lucide-react';
import { NewViewPicker } from './NewViewPicker';
import {
  getViewLabel,
  parseViewContent,
  stringifyViewContent,
  type ViewBlockContent,
  type ViewBlockType,
} from './viewBlocks';

interface ViewBlockProps {
  type: ViewBlockType;
  content: string;
  onUpdate: (content: string) => void;
  onAddView: (type: ViewBlockType) => void;
  onRemove: () => void;
  onFocus: () => void;
  readOnly?: boolean;
}

const updateCellValue = (
  view: ViewBlockContent,
  rowIndex: number,
  columnIndex: number,
  value: string
) => {
  const rows = view.rows.length ? view.rows : [view.columns.map(() => '')];

  return {
    ...view,
    rows: rows.map((row, currentRowIndex) =>
      currentRowIndex === rowIndex
        ? view.columns.map((_, currentColumnIndex) =>
            currentColumnIndex === columnIndex ? value : row[currentColumnIndex] || ''
          )
        : row
    ),
  };
};

const escapeCsvCell = (value: string) => {
  if (!/[",\n\r]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
};

const viewToCsv = (view: ViewBlockContent) => {
  const rows = view.rows.length ? view.rows : [view.columns.map(() => '')];
  return [view.columns, ...rows]
    .map((row) => view.columns.map((_, index) => escapeCsvCell(row[index] || '')).join(','))
    .join('\n');
};

const parseCsvRows = (csv: string) => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const nextChar = csv[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    cell += char;
  }

  row.push(cell);
  if (row.some((item) => item.trim())) rows.push(row);
  return rows;
};

export const ViewBlock = ({
  type,
  content,
  onUpdate,
  onAddView,
  onRemove,
  onFocus,
  readOnly = false,
}: ViewBlockProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showNewView, setShowNewView] = useState(false);
  const [showTitle, setShowTitle] = useState(true);
  const [titleStyle, setTitleStyle] = useState<'large' | 'compact'>('large');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [draggedColumnIndex, setDraggedColumnIndex] = useState<number | null>(null);
  const [draggedRowIndex, setDraggedRowIndex] = useState<number | null>(null);
  const viewBlockRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const resizingColumnRef = useRef<number | null>(null);
  const resizeStartXRef = useRef(0);
  const resizeStartWidthsRef = useRef<number[]>([]);
  const view = useMemo(() => parseViewContent(type, content), [content, type]);

  const commit = (nextView: ViewBlockContent) => onUpdate(stringifyViewContent(nextView));
  const visibleRows = view.rows.length ? view.rows : [view.columns.map(() => '')];
  const normalizedColumnWidths = useMemo(
    () =>
      view.columns.map((_, index) => {
        const width = Number(view.columnWidths?.[index]);
        return Number.isFinite(width) && width > 0 ? width : 280;
      }),
    [view.columnWidths, view.columns]
  );
  const tableContentWidth = normalizedColumnWidths.reduce((total, width) => total + width, 0);
  const actionColumnWidth = readOnly ? 0 : 64;
  const tableWidth = Math.max(640, tableContentWidth + actionColumnWidth);
  const columnBoundaries = normalizedColumnWidths.map((_, index) =>
    normalizedColumnWidths.slice(0, index + 1).reduce((total, width) => total + width, 0)
  );
  const titleClass =
    titleStyle === 'large'
      ? 'text-3xl font-bold tracking-tight'
      : 'text-base font-semibold tracking-normal';

  useEffect(() => {
    if (!showMenu && !showNewView) return;

    const closeOnOutsideClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (target && viewBlockRef.current?.contains(target)) return;

      setShowMenu(false);
      setShowNewView(false);
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setShowMenu(false);
      setShowNewView(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('touchstart', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('touchstart', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [showMenu, showNewView]);

  const addRow = () => {
    commit({ ...view, rows: [...view.rows, view.columns.map(() => '')] });
  };

  const removeRow = (rowIndex: number) => {
    commit({ ...view, rows: view.rows.filter((_, index) => index !== rowIndex) });
  };

  const addColumn = (afterColumnIndex = view.columns.length - 1) => {
    const insertIndex = Math.max(0, afterColumnIndex + 1);
    const nextColumns = [...view.columns];
    nextColumns.splice(insertIndex, 0, `Columna ${view.columns.length + 1}`);
    const nextColumnWidths = [...normalizedColumnWidths];
    nextColumnWidths.splice(insertIndex, 0, 280);

    commit({
      ...view,
      columns: nextColumns,
      columnWidths: nextColumnWidths,
      rows: visibleRows.map((row) => {
        const nextRow = view.columns.map((_, index) => row[index] || '');
        nextRow.splice(insertIndex, 0, '');
        return nextRow;
      }),
    });
  };

  const removeColumn = (columnIndex: number) => {
    if (view.columns.length <= 1) return;

    commit({
      ...view,
      columns: view.columns.filter((_, index) => index !== columnIndex),
      columnWidths: normalizedColumnWidths.filter((_, index) => index !== columnIndex),
      rows: visibleRows.map((row) =>
        view.columns
          .map((_, index) => row[index] || '')
          .filter((_, index) => index !== columnIndex)
      ),
    });
  };

  const reorderColumn = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= view.columns.length) return;

    const nextColumns = [...view.columns];
    const nextColumnWidths = [...normalizedColumnWidths];
    const [movedColumn] = nextColumns.splice(fromIndex, 1);
    const [movedWidth] = nextColumnWidths.splice(fromIndex, 1);
    nextColumns.splice(toIndex, 0, movedColumn);
    nextColumnWidths.splice(toIndex, 0, movedWidth);

    commit({
      ...view,
      columns: nextColumns,
      columnWidths: nextColumnWidths,
      rows: visibleRows.map((row) => {
        const normalizedRow = view.columns.map((_, index) => row[index] || '');
        const [movedCell] = normalizedRow.splice(fromIndex, 1);
        normalizedRow.splice(toIndex, 0, movedCell);
        return normalizedRow;
      }),
    });
  };

  const reorderRow = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= visibleRows.length) return;

    const nextRows = visibleRows.map((row) => view.columns.map((_, index) => row[index] || ''));
    const [movedRow] = nextRows.splice(fromIndex, 1);
    nextRows.splice(toIndex, 0, movedRow);
    commit({ ...view, rows: nextRows });
  };

  const cycleTitleStyle = () => {
    setTitleStyle((current) => (current === 'large' ? 'compact' : 'large'));
    setShowMenu(false);
  };

  const copyView = async () => {
    await navigator.clipboard?.writeText(viewToCsv(view));
    setShowMenu(false);
  };

  const copyLink = async () => {
    await navigator.clipboard?.writeText(window.location.href);
    setShowMenu(false);
  };

  const exportCsv = () => {
    const blob = new Blob([viewToCsv(view)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${view.title || getViewLabel(type)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setShowMenu(false);
  };

  const importCsv = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const rows = parseCsvRows(String(reader.result || ''));
      if (!rows.length) return;

      const columns = rows[0].map((column, index) => column.trim() || `Columna ${index + 1}`);
      const dataRows = rows.slice(1).map((row) => columns.map((_, index) => row[index] || ''));
      commit({
        ...view,
        columns,
        rows: dataRows.length ? dataRows : [columns.map(() => '')],
        columnWidths: columns.map(() => 280),
      });
      setShowMenu(false);
    };
    reader.readAsText(file);
  };

  const stopColumnResize = () => {
    resizingColumnRef.current = null;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    window.removeEventListener('mousemove', handleColumnResizeMove);
    window.removeEventListener('mouseup', stopColumnResize);
  };

  const handleColumnResizeMove = (event: MouseEvent) => {
    const columnIndex = resizingColumnRef.current;
    if (columnIndex === null) return;

    const deltaX = event.clientX - resizeStartXRef.current;
    const nextWidths = [...resizeStartWidthsRef.current];
    nextWidths[columnIndex] = Math.max(0, resizeStartWidthsRef.current[columnIndex] + deltaX);

    commit({
      ...view,
      columnWidths: nextWidths,
    });
  };

  const startColumnResize = (event: ReactMouseEvent<HTMLButtonElement>, columnIndex: number) => {
    if (readOnly) return;
    event.preventDefault();
    event.stopPropagation();

    resizingColumnRef.current = columnIndex;
    resizeStartXRef.current = event.clientX;
    resizeStartWidthsRef.current = [...normalizedColumnWidths];
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleColumnResizeMove);
    window.addEventListener('mouseup', stopColumnResize);
  };

  const renderTable = () => (
    <div ref={tableContainerRef} className="relative overflow-x-auto">
      <table
        className="border-collapse text-left table-fixed"
        style={{ width: `${tableWidth}px`, minWidth: `${tableWidth}px` }}
      >
        <colgroup>
          {view.columns.map((_, columnIndex) => (
            <col key={`col-${columnIndex}`} style={{ width: `${normalizedColumnWidths[columnIndex]}px` }} />
          ))}
          {!readOnly && <col style={{ width: `${actionColumnWidth}px` }} />}
        </colgroup>
        <thead>
          <tr className="border-b border-slate-200 text-sm font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400">
            {view.columns.map((column, columnIndex) => (
              <th
                key={columnIndex}
                className={`group/column relative px-2 py-2 ${
                  draggedColumnIndex === columnIndex ? 'bg-slate-100/70 dark:bg-slate-800/60' : ''
                }`}
                onDragOver={(event) => {
                  if (readOnly || draggedColumnIndex === null) return;
                  event.preventDefault();
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  if (draggedColumnIndex !== null) reorderColumn(draggedColumnIndex, columnIndex);
                  setDraggedColumnIndex(null);
                }}
              >
                <div className="flex items-center gap-1">
                  {!readOnly && (
                    <button
                      type="button"
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = 'move';
                        setDraggedColumnIndex(columnIndex);
                      }}
                      onDragEnd={() => setDraggedColumnIndex(null)}
                      className="flex h-7 w-5 shrink-0 cursor-grab items-center justify-center rounded text-slate-300 hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing dark:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                      title="Mover columna"
                      aria-label="Mover columna"
                    >
                      <GripVertical size={14} />
                    </button>
                  )}
                  <input
                    value={column}
                    readOnly={readOnly}
                    onChange={(event) =>
                      commit({
                        ...view,
                        columns: view.columns.map((item, index) =>
                          index === columnIndex ? event.target.value : item
                        ),
                      })
                    }
                    className="view-cell-input min-w-0 flex-1 bg-transparent px-1 py-1 font-medium text-slate-900 outline-none ring-0 focus:outline-none focus:ring-0 dark:text-slate-100"
                  />
                  {!readOnly && (
                    <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/column:opacity-100 focus-within:opacity-100">
                      <button
                        type="button"
                        onClick={() => addColumn(columnIndex)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                        title="Agregar columna"
                        aria-label="Agregar columna"
                      >
                        <Plus size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeColumn(columnIndex)}
                        disabled={view.columns.length <= 1}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 dark:text-slate-500 dark:hover:bg-red-950/30 dark:hover:text-red-400 dark:disabled:hover:text-slate-500"
                        title="Eliminar columna"
                        aria-label="Eliminar columna"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </th>
            ))}
            {!readOnly && (
              <th className="w-16 px-1 py-2">
                <button
                  type="button"
                  onClick={() => addColumn()}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  title="Agregar columna"
                  aria-label="Agregar columna"
                >
                  <Plus size={15} />
                </button>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={`group/row border-b border-slate-200 dark:border-slate-800 ${
                draggedRowIndex === rowIndex ? 'bg-slate-100/70 dark:bg-slate-800/60' : ''
              }`}
              onDragOver={(event) => {
                if (readOnly || draggedRowIndex === null) return;
                event.preventDefault();
              }}
              onDrop={(event) => {
                event.preventDefault();
                if (draggedRowIndex !== null) reorderRow(draggedRowIndex, rowIndex);
                setDraggedRowIndex(null);
              }}
            >
              {view.columns.map((_, columnIndex) => (
                <td key={`${rowIndex}-${columnIndex}`} className="px-2 py-2 align-top">
                  <input
                    value={row[columnIndex] || ''}
                    readOnly={readOnly}
                    onChange={(event) =>
                      commit(updateCellValue(view, rowIndex, columnIndex, event.target.value))
                    }
                    className="view-cell-input w-full bg-transparent px-1 py-1 text-sm font-medium text-slate-900 outline-none ring-0 focus:outline-none focus:ring-0 dark:text-slate-100"
                    placeholder="+"
                  />
                </td>
              ))}
              {!readOnly && (
                <td className="w-16 px-1 py-2 align-top">
                  <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover/row:opacity-100 focus-within:opacity-100">
                    <button
                      type="button"
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = 'move';
                        setDraggedRowIndex(rowIndex);
                      }}
                      onDragEnd={() => setDraggedRowIndex(null)}
                      className="flex h-7 w-7 cursor-grab items-center justify-center rounded-md text-slate-300 hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing dark:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                      title="Mover fila"
                      aria-label="Mover fila"
                    >
                      <GripVertical size={14} />
                    </button>
                  <button
                    type="button"
                    onClick={() => removeRow(rowIndex)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-slate-300 hover:bg-red-50 hover:text-red-600 dark:text-slate-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                    title="Eliminar fila"
                    aria-label="Eliminar fila"
                  >
                    <Trash2 size={14} />
                  </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!readOnly && view.columns.length > 0 && (
        <div className="pointer-events-none absolute inset-y-0 left-0 z-20" style={{ width: `${tableContentWidth}px` }}>
          {columnBoundaries.map((boundary, columnIndex) => (
            <div
              key={`resize-boundary-${columnIndex}`}
              className="group absolute inset-y-0 -ml-1.5 w-3"
              style={{ left: `${boundary}px` }}
            >
              <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-slate-300/80 dark:bg-slate-600/90 group-hover:bg-blue-500" />
              <button
                type="button"
                onMouseDown={(event) => startColumnResize(event, columnIndex)}
                className="pointer-events-auto absolute inset-y-0 left-0 w-full cursor-col-resize bg-transparent"
                title="Arrastrar columna"
                aria-label={`Redimensionar columna ${columnIndex + 1}`}
              />
            </div>
          ))}
        </div>
      )}
      {!readOnly && (
        <button
          type="button"
          onClick={addRow}
          className="mt-2 flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          title="Agregar fila"
        >
          <Plus size={18} />
        </button>
      )}
    </div>
  );

  const renderCards = () => (
    <div className="grid gap-3 md:grid-cols-2">
      {visibleRows.map((row, rowIndex) => (
        <div key={rowIndex} className="rounded-md border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-transparent">
          {view.columns.map((column, columnIndex) => (
            <label key={columnIndex} className="mb-2 block text-xs font-medium uppercase text-slate-400 dark:text-slate-500">
              {column}
              <input
                value={row[columnIndex] || ''}
                readOnly={readOnly}
                onChange={(event) =>
                  commit(updateCellValue(view, rowIndex, columnIndex, event.target.value))
                }
                className="view-cell-input mt-1 w-full bg-transparent px-2 py-1.5 text-sm normal-case text-slate-900 outline-none ring-0 focus:outline-none focus:ring-0 dark:text-slate-100"
              />
            </label>
          ))}
        </div>
      ))}
    </div>
  );

  const renderBoard = () => (
    <div className="grid gap-3 md:grid-cols-3">
      {['Pendiente', 'En proceso', 'Listo'].map((status) => (
        <div key={status} className="rounded-md border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900/40">
          <p className="mb-2 text-sm font-semibold text-slate-600 dark:text-slate-300">{status}</p>
          {visibleRows.map((row, rowIndex) => (
            <div key={rowIndex} className="mb-2 rounded-md border border-slate-200 bg-white p-2 text-sm dark:border-slate-800 dark:bg-transparent">
              <input
                value={row[0] || ''}
                readOnly={readOnly}
                onChange={(event) => commit(updateCellValue(view, rowIndex, 0, event.target.value))}
                className="view-cell-input w-full bg-transparent font-medium text-slate-900 outline-none dark:text-slate-100"
                placeholder="Nueva tarjeta"
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  const renderChart = () => (
    <div className="space-y-3">
      {visibleRows.map((row, rowIndex) => {
        const value = Math.min(100, Math.max(0, Number(row[1]) || 0));
        return (
          <div key={rowIndex} className="grid grid-cols-[120px_1fr_56px] items-center gap-3 text-sm">
            <input
              value={row[0] || ''}
              readOnly={readOnly}
              onChange={(event) => commit(updateCellValue(view, rowIndex, 0, event.target.value))}
              className="view-cell-input bg-transparent px-1 py-1 font-medium text-slate-900 outline-none ring-0 focus:outline-none focus:ring-0 dark:text-slate-100"
            />
            <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-full rounded-full bg-slate-900 dark:bg-slate-200" style={{ width: `${value}%` }} />
            </div>
            <input
              value={row[1] || ''}
              readOnly={readOnly}
              onChange={(event) => commit(updateCellValue(view, rowIndex, 1, event.target.value))}
              className="view-cell-input bg-transparent px-1 py-1 text-right text-slate-900 outline-none ring-0 focus:outline-none focus:ring-0 dark:text-slate-100"
            />
          </div>
        );
      })}
    </div>
  );

  const renderSpecialView = () => {
    if (type === 'view_table') return renderTable();
    if (type === 'view_cards' || type === 'view_detail' || type === 'view_form') return renderCards();
    if (type === 'view_board') return renderBoard();
    if (type === 'view_chart') return renderChart();
    return renderTable();
  };

  return (
    <div
      ref={viewBlockRef}
      className={`relative w-full rounded-md bg-white dark:bg-transparent ${
        isFullscreen ? 'fixed inset-3 z-[150] overflow-auto p-6 shadow-2xl md:inset-8' : ''
      }`}
      onFocus={onFocus}
    >
      <input
        ref={csvInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) importCsv(file);
          event.target.value = '';
        }}
      />
      <div className="mb-2 flex items-center gap-2">
        {!readOnly && (
          <button
            type="button"
            onClick={() => setShowMenu((value) => !value)}
            className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-950 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
            aria-label="Opciones de vista"
          >
            <MoreVertical size={18} />
          </button>
        )}
        {showTitle && (
          <input
            value={view.title}
            readOnly={readOnly}
            onChange={(event) => commit({ ...view, title: event.target.value })}
            className={`min-w-0 flex-1 bg-transparent text-slate-950 outline-none dark:text-slate-100 ${titleClass}`}
            placeholder={getViewLabel(type)}
          />
        )}
        {!showTitle && <div className="min-h-8 flex-1" />}
      </div>

      {showMenu && !readOnly && (
        <div className="absolute left-0 top-10 z-[80] w-[312px] rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-[#252525]">
          <button
            type="button"
            onClick={() => setShowTitle((value) => !value)}
            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <span className="flex items-center gap-3">
              <Type size={19} className="text-slate-500 dark:text-slate-400" />
              Título
            </span>
            <span className={`h-5 w-9 rounded-full p-0.5 ${showTitle ? 'bg-blue-600' : 'bg-slate-300'}`}>
              <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${showTitle ? 'translate-x-4' : ''}`} />
            </span>
          </button>
          <button
            type="button"
            onClick={cycleTitleStyle}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Type size={19} className="text-slate-500 dark:text-slate-400" />
            Estilo de título
          </button>
          <div className="my-2 border-t border-dashed border-slate-200 dark:border-slate-700" />
          <button
            type="button"
            onClick={() => setShowNewView((value) => !value)}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Table2 size={19} className="text-slate-500 dark:text-slate-400" />
            Añadir vista
          </button>
          <button
            type="button"
            onClick={() => {
              setIsFullscreen((value) => !value);
              setShowMenu(false);
            }}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Expand size={19} className="text-slate-500 dark:text-slate-400" />
            {isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          </button>
          <button
            type="button"
            onClick={() => csvInputRef.current?.click()}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <FileInput size={19} className="text-slate-500 dark:text-slate-400" />
            Importar CSV
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Download size={19} className="text-slate-500 dark:text-slate-400" />
            Exportar CSV
          </button>
          <button
            type="button"
            onClick={copyView}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Copy size={19} className="text-slate-500 dark:text-slate-400" />
            Copiar
          </button>
          <div className="my-2 border-t border-dashed border-slate-200 dark:border-slate-700" />
          <button
            type="button"
            onClick={copyLink}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Link size={19} className="text-slate-500 dark:text-slate-400" />
            Copiar link
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 size={19} />
            Eliminar
          </button>
        </div>
      )}

      {showNewView && !readOnly && (
        <div className="absolute left-[320px] top-24 z-[90]">
          <NewViewPicker
            onSelect={(selectedType) => {
              onAddView(selectedType);
              setShowNewView(false);
              setShowMenu(false);
            }}
          />
        </div>
      )}

      {renderSpecialView()}
    </div>
  );
};
