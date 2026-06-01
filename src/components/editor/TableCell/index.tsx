import React from 'react';
import type { TableColumn } from '../tableTypes';
import { TextCell, NumberCell, CheckboxCell, SelectCell, DateCell } from './CellTypes';

interface TableCellProps {
  rowId: string;
  column: TableColumn;
  value: any;
  onChange: (value: any) => void;
}

export const TableCell = React.memo(function TableCell({
  rowId,
  column,
  value,
  onChange,
}: TableCellProps) {
  // Usar rowId en la clave para asegurar distinción entre celdas
  const cellKey = `${rowId}-${column.id}`;

  const commonProps = {
    value,
    onChange,
    isRequired: column.isRequired,
  };

  switch (column.type) {
    case 'text':
      return <TextCell key={cellKey} {...commonProps} />;

    case 'number':
      return <NumberCell key={cellKey} {...commonProps} />;

    case 'checkbox':
      return <CheckboxCell key={cellKey} {...commonProps} />;

    case 'select':
      return <SelectCell key={cellKey} {...commonProps} options={column.options} />;

    case 'date':
      return <DateCell key={cellKey} {...commonProps} />;

    default:
      return <TextCell key={cellKey} {...commonProps} />;
  }
});

TableCell.displayName = 'TableCell';
