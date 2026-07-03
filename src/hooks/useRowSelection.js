import { useState, useCallback } from 'react';

/**
 * Custom hook for managing row selection state in tables.
 * Centralizes selection logic that was duplicated in PendingPage and HistoryPage.
 *
 * @param {Array} items - The current list of items displayed in the table.
 * @returns {{ selected: Set, setSelected: Function, toggleSelect: Function, toggleAll: Function, allSelected: boolean, someSelected: boolean, clearSelection: Function }}
 */
export function useRowSelection(items) {
    const [selected, setSelected] = useState(new Set());

    const toggleSelect = useCallback((id) => {
        setSelected(prev => {
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
        if (!items || !Array.isArray(items)) return;
        
        setSelected(prevSelected => {
            if (prevSelected.size === items.length) {
                return new Set();
            } else {
                return new Set(items.map(t => t.id));
            }
        });
    }, [items]);

    const clearSelection = useCallback(() => {
        setSelected(new Set());
    }, []);

    const allSelected = Array.isArray(items) && items.length > 0 && selected.size === items.length;
    const someSelected = selected.size > 0;

    return { selected, setSelected, toggleSelect, toggleAll, clearSelection, allSelected, someSelected };
}
