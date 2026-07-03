import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRowSelection } from './useRowSelection';

describe('useRowSelection', () => {
    const items = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
        { id: '3', name: 'Item 3' },
    ];

    it('initializes with empty selection', () => {
        const { result } = renderHook(() => useRowSelection(items));
        expect(result.current.selected.size).toBe(0);
        expect(result.current.allSelected).toBe(false);
        expect(result.current.someSelected).toBe(false);
    });

    it('toggles individual items correctly', () => {
        const { result } = renderHook(() => useRowSelection(items));
        
        act(() => {
            result.current.toggleSelect('1');
        });
        expect(result.current.selected.has('1')).toBe(true);
        expect(result.current.someSelected).toBe(true);
        expect(result.current.allSelected).toBe(false);

        act(() => {
            result.current.toggleSelect('1');
        });
        expect(result.current.selected.has('1')).toBe(false);
        expect(result.current.someSelected).toBe(false);
    });

    it('toggles all items correctly', () => {
        const { result } = renderHook(() => useRowSelection(items));
        
        // Select all
        act(() => {
            result.current.toggleAll();
        });
        expect(result.current.selected.size).toBe(3);
        expect(result.current.allSelected).toBe(true);

        // Deselect all
        act(() => {
            result.current.toggleAll();
        });
        expect(result.current.selected.size).toBe(0);
        expect(result.current.allSelected).toBe(false);
    });

    it('clears selection', () => {
        const { result } = renderHook(() => useRowSelection(items));
        
        act(() => {
            result.current.toggleSelect('1');
            result.current.toggleSelect('2');
        });
        expect(result.current.selected.size).toBe(2);

        act(() => {
            result.current.clearSelection();
        });
        expect(result.current.selected.size).toBe(0);
    });
});
