import { describe, expect, it } from 'vitest';
import {
  sanitizeCsvTextCell,
  serializeTransactionsToCsv,
  serializeTransactionsToJson,
} from '../exportTransactions';
import type { Transaction } from '../../types/domain';

const sampleTx: Transaction = {
  id: 'tx-1',
  date: '2026-05-12',
  description: 'Café "Central", Lisboa',
  amount: -14.5,
  category_id: 'cat-1',
  user_id: 'user-1',
  ignore_in_reports: false,
  created_at: '2026-05-12T10:00:00Z',
  category: { id: 'cat-1', name: 'Alimentação', color: '#ef4444' },
};

describe('exportTransactions', () => {
  it('neutralizes spreadsheet formula injection characters', () => {
    expect(sanitizeCsvTextCell('=SUM(A1:A5)')).toBe("'=SUM(A1:A5)");
    expect(sanitizeCsvTextCell('+cmd')).toBe("'+cmd");
    expect(sanitizeCsvTextCell('-100')).toBe("'-100");
    expect(sanitizeCsvTextCell('@import')).toBe("'@import");
  });

  it('escapes quotes and commas per RFC 4180 and prefixes UTF-8 BOM', () => {
    const csv = serializeTransactionsToCsv([sampleTx]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    const [, dataRow] = csv.slice(1).split('\r\n');
    expect(dataRow).toBe('2026-05-12,"Café ""Central"", Lisboa",Alimentação,-14.50,Não');
  });

  it('serializes clean JSON backup', () => {
    const parsed = JSON.parse(serializeTransactionsToJson([sampleTx])) as Array<{
      description: string;
      amount: number;
      category: string | null;
    }>;
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toMatchObject({
      description: 'Café "Central", Lisboa',
      amount: -14.5,
      category: 'Alimentação',
    });
  });
});
