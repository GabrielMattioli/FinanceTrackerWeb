import { useState, useCallback } from 'react';

/**
 * Custom hook for managing row selection state in tables.
 */
export function useRowSelection<T extends { id: string | number }>(items: readonly T[]) {
  type RowId = T['id'];
  const [selected, setSelected] = useState<Set<RowId>>(() => new Set());

  const toggleSelect = useCallback((id: RowId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prevSelected) => {
      if (prevSelected.size === items.length && items.length > 0) {
        return new Set();
      }
      return new Set(items.map((item) => item.id));
    });
  }, [items]);

  const clearSelection = useCallback(() => {
    setSelected(new Set());
  }, []);

  const allSelected = items.length > 0 && selected.size === items.length;
  const someSelected = selected.size > 0;

  return { selected, setSelected, toggleSelect, toggleAll, clearSelection, allSelected, someSelected };
}
