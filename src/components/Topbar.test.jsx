import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Topbar from './Topbar';

describe('Topbar', () => {
    it('renders the title correctly', () => {
        render(<Topbar title="Meu Dashboard" onImportClick={() => {}} theme="light" toggleTheme={() => {}} />);
        expect(screen.getByText('Meu Dashboard')).toBeInTheDocument();
    });

    it('calls onImportClick when the import button is clicked', () => {
        const mockOnImportClick = vi.fn();
        render(<Topbar title="Dashboard" onImportClick={mockOnImportClick} theme="light" toggleTheme={() => {}} />);
        
        const button = screen.getByText('Adicionar Gastos');
        fireEvent.click(button);
        
        expect(mockOnImportClick).toHaveBeenCalledTimes(1);
    });

    it('calls toggleTheme when the theme button is clicked', () => {
        const mockToggleTheme = vi.fn();
        render(<Topbar title="Dashboard" onImportClick={() => {}} theme="light" toggleTheme={mockToggleTheme} />);
        
        const button = screen.getByLabelText('Toggle Theme');
        fireEvent.click(button);
        
        expect(mockToggleTheme).toHaveBeenCalledTimes(1);
    });
});
