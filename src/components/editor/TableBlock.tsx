import React, { useEffect, useMemo, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { ViewBlockType } from './viewBlocks';
import type { TableBlockContent, TableColumn } from './tableTypes';
import { migrateOldViewFormat } from './tableTypes';
import { useTableStore } from './tableStore';
import { TableBlockHeader } from './TableBlockHeader';
import { TableColumnHeader } from './TableColumnHeader';
import { TableRowList } from './TableRowList';

interface TableBlockProps {
  type: ViewBlockType;
  content: string;
  onUpdate: (content: string) => void;
  onDuplicate?: () => void;
  onRemove?: () => void;
  readOnly?: boolean;
}

export const TableBlock = React.memo(function TableBlock({
  type,
  content,
  onUpdate,
  onDuplicate,
  onRemove,
  readOnly = false,
}: TableBlockProps) {
  const store = useTableStore();
  const lastSyncedRef = useRef<string>('');
  const isInitializedRef = useRef(false);

  // Parsear contenido y migrar si es necesario
  const tableContent = useMemo(() => {
    try {
      const parsed = JSON.parse(content) as Partial<TableBlockContent>;

      // Detectar formato antiguo (array de strings para columnas)
      if (Array.isArray(parsed.columns) && parsed.columns.length > 0) {
        if (typeof parsed.columns[0] === 'string') {
          // Formato antiguo: migrar
          return migrateOldViewFormat(
            parsed.columns as string[],
            (parsed.rows as string[][]) || [],
            (parsed.columnWidths as number[]) || undefined
          );
        }
      }

      // Formato nuevo
      if (parsed.columns && parsed.rows && Array.isArray(parsed.columns)) {
        return parsed as TableBlockContent;
      }
    } catch (error) {
      console.error('Error parsing table content:', error);
    }

    // Contenido vacío o inválido
    return {
      id: `table_${Date.now()}`,
      title: 'Nueva Tabla',
      columns: [],
      rows: [],
    };
  }, [content]);

  // Inicializar store con el contenido parseado
  useEffect(() => {
    if (!isInitializedRef.current) {
      store.reset(tableContent);
      lastSyncedRef.current = JSON.stringify(tableContent);
      isInitializedRef.current = true;
    }
  }, []);

  // Sincronizar cambios del store al padre (evitar loops)
  const storeContent = useTableStore((state) => state.content);
  useEffect(() => {
    // No sincronizar en la inicialización
    if (!isInitializedRef.current) return;

    const serialized = JSON.stringify(storeContent);
    
    // Solo sincronizar si realmente cambió
    if (serialized !== lastSyncedRef.current) {
      lastSyncedRef.current = serialized;
      onUpdate(serialized);
    }
  }, [storeContent]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      distance: 8,
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const columnIds = storeContent.columns.map((c) => c.id);

  const handleColumnDragEnd = (event: any) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = columnIds.indexOf(active.id as string);
      const newIndex = columnIds.indexOf(over.id as string);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderColumns = useTableStore.getState().reorderColumns;
        const newOrder = arrayMove(columnIds, oldIndex, newIndex);
        reorderColumns(newOrder);
      }
    }
  };

  if (storeContent.columns.length === 0) {
    return (
      <div className="w-full bg-white rounded border border-gray-200">
        <TableBlockHeader
          title={storeContent.title}
          onDuplicate={onDuplicate}
          onRemove={onRemove}
          readOnly={readOnly}
        />
        <div className="p-8 text-center text-gray-500">
          <p>No hay columnas. Haz clic en "+ Columna" para empezar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded border border-gray-200 overflow-hidden">
      <TableBlockHeader
        title={storeContent.title}
        onDuplicate={onDuplicate}
        onRemove={onRemove}
        readOnly={readOnly}
      />

      <div className="overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleColumnDragEnd}
        >
          <table className="w-full border-collapse">
            <SortableContext
              items={columnIds}
              strategy={horizontalListSortingStrategy}
            >
              <thead className="bg-gray-50">
                <tr>
                  {!readOnly && (
                    <th className="w-12 px-2 py-2 sticky left-0 bg-gray-50 border-b">
                      {/* Drag handle column */}
                    </th>
                  )}

                  {storeContent.columns.map((column) => (
                    <TableColumnHeader
                      key={column.id}
                      column={column}
                      readOnly={readOnly}
                    />
                  ))}

                  {!readOnly && (
                    <th className="w-12 px-2 py-2 sticky right-0 bg-gray-50 border-b">
                      {/* Actions column */}
                    </th>
                  )}
                </tr>
              </thead>
            </SortableContext>

            <TableRowList
              rows={storeContent.rows}
              columns={storeContent.columns}
              readOnly={readOnly}
            />
          </table>
        </DndContext>
      </div>
    </div>
  );
});

TableBlock.displayName = 'TableBlock';
