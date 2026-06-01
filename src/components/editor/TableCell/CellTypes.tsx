import React, { useState } from 'react';
import type { TableColumn } from '../tableTypes';

interface BaseCellProps {
  value: any;
  onChange: (value: any) => void;
  onBlur?: () => void;
  isEditing?: boolean;
  isRequired?: boolean;
}

export const TextCell = React.memo(function TextCell({
  value,
  onChange,
  onBlur,
  isEditing = false,
}: BaseCellProps) {
  const [isEdit, setIsEdit] = useState(isEditing);

  const handleCommit = (finalValue: string) => {
    onChange(finalValue);
    setIsEdit(false);
  };

  if (isEdit) {
    return (
      <input
        autoFocus
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => {
          setIsEdit(false);
          onBlur?.();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleCommit(value || '');
          if (e.key === 'Escape') setIsEdit(false);
        }}
        className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-sm"
      />
    );
  }

  return (
    <div
      onClick={() => setIsEdit(true)}
      className="px-2 py-1 cursor-text hover:bg-gray-100 rounded transition-colors"
    >
      {value || ''}
    </div>
  );
});

export const NumberCell = React.memo(function NumberCell({
  value,
  onChange,
  onBlur,
  isEditing = false,
}: BaseCellProps) {
  const [isEdit, setIsEdit] = useState(isEditing);

  if (isEdit) {
    return (
      <input
        autoFocus
        type="number"
        value={value || ''}
        onChange={(e) => onChange(e.target.valueAsNumber || 0)}
        onBlur={() => {
          setIsEdit(false);
          onBlur?.();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') setIsEdit(false);
          if (e.key === 'Escape') setIsEdit(false);
        }}
        className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-sm"
      />
    );
  }

  return (
    <div
      onClick={() => setIsEdit(true)}
      className="px-2 py-1 cursor-text hover:bg-gray-100 rounded transition-colors text-right"
    >
      {value || ''}
    </div>
  );
});

export const CheckboxCell = React.memo(function CheckboxCell({
  value,
  onChange,
}: BaseCellProps) {
  return (
    <div className="px-2 py-1 flex items-center justify-center">
      <input
        type="checkbox"
        checked={value === true || value === 'true'}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 cursor-pointer"
      />
    </div>
  );
});

export const SelectCell = React.memo(function SelectCell({
  value,
  onChange,
  isEditing = false,
  options = [],
}: BaseCellProps & { options?: string[] }) {
  const [isEdit, setIsEdit] = useState(isEditing);

  if (isEdit) {
    return (
      <select
        autoFocus
        value={value || ''}
        onChange={(e) => {
          onChange(e.target.value);
          setIsEdit(false);
        }}
        onBlur={() => setIsEdit(false)}
        className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-sm"
      >
        <option value="">Seleccionar...</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div
      onClick={() => setIsEdit(true)}
      className="px-2 py-1 cursor-pointer hover:bg-gray-100 rounded transition-colors"
    >
      {value && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {value}
        </span>
      )}
    </div>
  );
});

export const DateCell = React.memo(function DateCell({
  value,
  onChange,
  onBlur,
  isEditing = false,
}: BaseCellProps) {
  const [isEdit, setIsEdit] = useState(isEditing);

  const formatDate = (date: string | null): string => {
    if (!date) return '';
    try {
      return new Date(date).toISOString().split('T')[0];
    } catch {
      return date;
    }
  };

  if (isEdit) {
    return (
      <input
        autoFocus
        type="date"
        value={formatDate(value)}
        onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
        onBlur={() => {
          setIsEdit(false);
          onBlur?.();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') setIsEdit(false);
          if (e.key === 'Escape') setIsEdit(false);
        }}
        className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-sm"
      />
    );
  }

  return (
    <div
      onClick={() => setIsEdit(true)}
      className="px-2 py-1 cursor-text hover:bg-gray-100 rounded transition-colors"
    >
      {value ? formatDate(value) : ''}
    </div>
  );
});
