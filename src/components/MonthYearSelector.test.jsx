import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { YearSelector, MonthBar } from './MonthYearSelector';
import * as api from '../api/api';

vi.mock('../api/api', () => ({
    getYearlySummary: vi.fn(),
}));

describe('MonthYearSelector', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('YearSelector', () => {
        it('renders year and calls onYearChange', () => {
            const mockChange = vi.fn();
            render(<YearSelector year={2024} onYearChange={mockChange} />);
            
            expect(screen.getByText('2024')).toBeInTheDocument();
            
            const buttons = screen.getAllByRole('button');
            fireEvent.click(buttons[0]); // Prev
            expect(mockChange).toHaveBeenCalledWith(2023);
            
            fireEvent.click(buttons[1]); // Next
            expect(mockChange).toHaveBeenCalledWith(2025);
        });
    });

    describe('MonthBar', () => {
        it('renders months from api', async () => {
            api.getYearlySummary.mockResolvedValue({
                months: [
                    { month: 1, hasData: true, netBalance: 100 },
                    { month: 2, hasData: false, netBalance: 0 },
                ]
            });
            const mockChange = vi.fn();
            
            render(<MonthBar year={2024} month={1} onMonthChange={mockChange} allowAllMonths={true} />);
            
            await waitFor(() => {
                expect(screen.getByText('Jan')).toBeInTheDocument();
                expect(screen.getByText('Fev')).toBeInTheDocument();
            });

            // 'Todos' tab is present because allowAllMonths is true
            const todos = screen.getByText('Todos');
            expect(todos).toBeInTheDocument();
            
            // Clicking Jan should call mock
            fireEvent.click(screen.getByText('Jan'));
            expect(mockChange).toHaveBeenCalledWith(1);
            
            // Fev is disabled (hasData = false)
            expect(screen.getByText('Fev')).toBeDisabled();
        });
    });
});
