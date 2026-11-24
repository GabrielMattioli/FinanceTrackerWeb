import type { Transaction } from '../types/domain';

const FORMULA_PREFIX = /^[=+\-@\t\r]/;

/**
 * Neutralizes spreadsheet formula injection in text cells and applies RFC 4180 quoting.
 */
export function sanitizeCsvTextCell(value: string): string {
  const safe = FORMULA_PREFIX.test(value) ? `'${value}` : value;
  if (/[",\r\n;]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export function serializeTransactionsToCsv(transactions: readonly Transaction[]): string {
  const headers = ['Data', 'Descrição', 'Categoria', 'Valor', 'Ignorada'];
  const lines = [headers.join(',')];

  for (const tx of transactions) {
    const row = [
      tx.date,
      sanitizeCsvTextCell(tx.description),
      sanitizeCsvTextCell(tx.category?.name ?? 'Sem Categoria'),
      Number(tx.amount).toFixed(2),
      tx.ignore_in_reports ? 'Sim' : 'Não',
    ];
    lines.push(row.join(','));
  }

  // UTF-8 BOM ensures Excel opens accents cleanly on Windows
  return `\uFEFF${lines.join('\r\n')}`;
}

export function serializeTransactionsToJson(transactions: readonly Transaction[]): string {
  const clean = transactions.map((tx) => ({
    id: tx.id,
    date: tx.date,
    description: tx.description,
    amount: Number(tx.amount),
    category: tx.category?.name ?? null,
    ignore_in_reports: Boolean(tx.ignore_in_reports),
  }));
  return JSON.stringify(clean, null, 2);
}

export function downloadTextFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
