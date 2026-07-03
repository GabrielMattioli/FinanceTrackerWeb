import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ImportModal from './ImportModal';
import { importCsv } from '../api/api';
import toast from 'react-hot-toast';

vi.mock('../api/api', () => ({
    importCsv: vi.fn(),
}));

vi.mock('react-hot-toast', () => {
    const t = vi.fn();
    t.success = vi.fn();
    t.error = vi.fn();
    return { default: t };
});

describe('ImportModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders and allows file selection', () => {
        const mockClose = vi.fn();
        render(<ImportModal onClose={mockClose} onSuccess={() => {}} />);
        
        expect(screen.getByText('Importar Extrato CSV')).toBeInTheDocument();
        
        // Find hidden input by testing its presence indirectly or directly
        const fileInput = document.querySelector('input[type="file"]');
        const file = new File(['dummy content'], 'test.csv', { type: 'text/csv' });
        
        fireEvent.change(fileInput, { target: { files: [file] } });
        
        expect(screen.getByText('test.csv')).toBeInTheDocument();
    });

    it('calls importCsv when import button is clicked', async () => {
        const mockClose = vi.fn();
        const mockSuccess = vi.fn();
        importCsv.mockResolvedValue({ imported: 5, skipped: 0, errors: 0 });

        render(<ImportModal onClose={mockClose} onSuccess={mockSuccess} />);
        
        const fileInput = document.querySelector('input[type="file"]');
        const file = new File(['dummy'], 'data.csv', { type: 'text/csv' });
        fireEvent.change(fileInput, { target: { files: [file] } });
        
        const importBtn = screen.getByText('Importar');
        fireEvent.click(importBtn);
        
        await waitFor(() => {
            expect(importCsv).toHaveBeenCalled();
            expect(toast.success).toHaveBeenCalledWith('5 transações importadas!');
            expect(mockSuccess).toHaveBeenCalled();
        });
    });
});
