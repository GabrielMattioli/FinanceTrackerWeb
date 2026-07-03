import { useState } from 'react';

/**
 * Custom hook for managing row selection state in tables.
 * Centralizes selection logic that was duplicated in PendingPage and HistoryPage.
 *
 * @param {Array} items - The current list of items displayed in the table.
 * @returns {{ selected: Set, setSelected: Function, toggleSelect: Function, toggleAll: Function, allSelected: boolean, someSelected: boolean, clearSelection: Function }}
 */
export function useRowSelection(items) {
    const [selected, setSelected] = useState(new Set());

    const toggleSelect = (id) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (selected.size === items.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(items.map(t => t.id)));
        }
    };

    const clearSelection = () => setSelected(new Set());

    const allSelected = items.length > 0 && selected.size === items.length;
    const someSelected = selected.size > 0;

    return { selected, setSelected, toggleSelect, toggleAll, clearSelection, allSelected, someSelected };
}
