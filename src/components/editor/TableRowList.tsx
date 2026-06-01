import React, { useCallback } from 'react';
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { TableRow, TableColumn } from './tableTypes';
import { TableRowComponent } from './TableRow';
import { useTableStore } from './tableStore';

interface TableRowListProps {
  rows: TableRow[];
  columns: TableColumn[];
  readOnly?: boolean;
}

export const TableRowList = React.memo(function TableRowList({
  rows,
  columns,
  readOnly = false,
}: TableRowListProps) {
  const reorderRows = useTableStore((state) => state.reorderRows);
  const removeRow = useTableStore((state) => state.removeRow);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      distance: 8,
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const rowIds = rows.map((r) => r.id);

  const handleDragEnd = useCallback(
    (event: any) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = rowIds.indexOf(active.id as string);
        const newIndex = rowIds.indexOf(over.id as string);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newOrder = arrayMove(rowIds, oldIndex, newIndex);
          reorderRows(newOrder);
        }
      }
    },
    [rowIds, reorderRows]
  );

  if (rows.length === 0) {
    return (
      <tbody>
        <tr>
          <td
            colSpan={columns.length + (readOnly ? 0 : 2)}
            className="px-4 py-8 text-center text-gray-500"
          >
            No hay filas. Haz clic en "+ Fila" para agregar una.
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
        <tbody>
          {rows.map((row) => (
            <TableRowComponent
              key={row.id}
              row={row}
              columns={columns}
              readOnly={readOnly}
              onRemoveRow={removeRow}
            />
          ))}
        </tbody>
      </SortableContext>
    </DndContext>
  );
});

TableRowList.displayName = 'TableRowList';
