import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCategories, createCategory, getPending } from './api';
import { supabase } from '../supabaseClient';

vi.mock('../supabaseClient', () => {
    return {
        supabase: {
            from: vi.fn(),
        },
    };
});

describe('api', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getCategories', () => {
        it('returns data when successful', async () => {
            const mockData = [{ id: 1, name: 'Food', is_essential: false, expected_amount: null }];
            const expectedData = [{ id: 1, name: 'Food', is_essential: false, expected_amount: null, isEssential: false, expectedAmount: null }];
            const mockOrder = vi.fn().mockResolvedValue({ data: mockData, error: null });
            const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
            supabase.from.mockReturnValue({ select: mockSelect });

            const result = await getCategories();
            expect(supabase.from).toHaveBeenCalledWith('categories');
            expect(mockSelect).toHaveBeenCalledWith('*');
            expect(mockOrder).toHaveBeenCalledWith('name');
            expect(result).toEqual(expectedData);
        });

        it('throws error when unsuccessful', async () => {
            const mockError = new Error('Database error');
            const mockOrder = vi.fn().mockResolvedValue({ data: null, error: mockError });
            const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
            supabase.from.mockReturnValue({ select: mockSelect });

            await expect(getCategories()).rejects.toThrow('Database error');
        });
    });

    describe('createCategory', () => {
        it('returns created category on success', async () => {
            const mockData = { id: 1, name: 'Food' };
            const dto = { name: 'Food' };
            const mockSingle = vi.fn().mockResolvedValue({ data: mockData, error: null });
            const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
            const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
            supabase.from.mockReturnValue({ insert: mockInsert });

            const result = await createCategory(dto);
            expect(supabase.from).toHaveBeenCalledWith('categories');
            expect(mockInsert).toHaveBeenCalledWith([dto]);
            expect(result).toEqual(mockData);
        });
    });

    describe('getPending', () => {
        it('returns paginated transactions with exact count', async () => {
            const mockData = [{ id: 10, amount: 100 }];
            const mockRange = vi.fn().mockResolvedValue({ data: mockData, error: null, count: 50 });
            const mockOrder = vi.fn().mockReturnValue({ range: mockRange });
            const mockIs = vi.fn().mockReturnValue({ order: mockOrder });
            const mockSelect = vi.fn().mockReturnValue({ is: mockIs });
            
            supabase.from.mockReturnValue({ select: mockSelect });

            const result = await getPending(0, 10);
            expect(supabase.from).toHaveBeenCalledWith('transactions');
            expect(mockSelect).toHaveBeenCalledWith('*, categories(id, name, color)', { count: 'exact' });
            expect(result).toEqual({ content: mockData, totalElements: 50 });
        });
    });
});
