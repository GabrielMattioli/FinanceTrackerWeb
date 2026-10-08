import { supabase } from '../supabaseClient';
import { checkError } from './common';

const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user;
};

export const getSettings = async () => {
  const user = await getCurrentUser();
  const { data, error } = await supabase.from('settings').select('*').eq('user_id', user.id).maybeSingle();

  if (error) {
    return checkError(error, data);
  }

  // Se não existir (maybeSingle retorna null), retorna um padrão
  if (!data) {
    return { baseCurrency: 'EUR', initialBalance: 0, expectedMonthlyIncome: null, has_seen_onboarding: false };
  }

  return {
    ...data,
    baseCurrency: data.base_currency || 'EUR',
    initialBalance: data.initial_balance || 0,
    expectedMonthlyIncome: data.expected_monthly_income,
    has_seen_onboarding: data.has_seen_onboarding || false
  };
};


export const updateInitialBalance = async (initialBalance: number) => {
  const user = await getCurrentUser();
  const { data: existing } = await supabase.from('settings').select('id').eq('user_id', user.id).maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('settings')
      .update({ initial_balance: initialBalance })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return { initialBalance: data.initial_balance };
  } else {
    const { data, error } = await supabase
      .from('settings')
      .insert({ initial_balance: initialBalance, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return { initialBalance: data.initial_balance };
  }
};


export const updateCurrency = async (baseCurrency: string) => {
  const user = await getCurrentUser();
  const { data: existing } = await supabase.from('settings').select('id').eq('user_id', user.id).maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('settings')
      .update({ base_currency: baseCurrency })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return { baseCurrency: data.base_currency };
  } else {
    // Let the database generate the ID
    const { data, error } = await supabase
      .from('settings')
      .insert({ base_currency: baseCurrency, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return { baseCurrency: data.base_currency };
  }
};


export const dismissOnboarding = async () => {
  const user = await getCurrentUser();
  const { data: existing } = await supabase.from('settings').select('id').eq('user_id', user.id).maybeSingle();
  if (existing) {
    const { data, error } = await supabase
      .from('settings')
      .update({ has_seen_onboarding: true })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data.has_seen_onboarding;
  } else {
    const { data, error } = await supabase
      .from('settings')
      .insert({ has_seen_onboarding: true, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return data.has_seen_onboarding;
  }
};

export interface ImportCsvOptions {
  dateColumn?: number;
  descColumn?: number;
  amountColumn?: number;
}

export const importCsv = async (file: File, options: ImportCsvOptions = {}) => {
  const text = await file.text();
  const firstLine = text.split('\n')[0] || '';
  const delimiter = firstLine.includes(';') ? ';' : ',';
  
  const parseRow = (row: string) => {
    const cells = [];
    let currentCell = '';
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"') {
        inQuotes = !inQuotes;
        currentCell += char;
      } else if (char === delimiter && !inQuotes) {
        cells.push(currentCell.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    cells.push(currentCell.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
    return cells;
  };

  const rows = text.split('\n').map(parseRow);

  if (rows.length === 0) return { imported: 0, skipped: 0, errors: 0 };

  const headers = rows[0];

  if (headers.includes('Auftragskonto') && headers.includes('BLZ') && !headers.includes('Glaeubiger ID')) {
    throw new Error('Formato MT940 legado. Por favor, exporte usando a opção "Excel (CSV-CAMT V2)" ou "V8".');
  }

  const dataRows = rows.slice(1).filter(r => r.some(cell => cell));

  let dateCol = options.dateColumn;
  let descCol = options.descColumn;
  let amountCol = options.amountColumn;
  let payeeCol = -1;

  if (dateCol === undefined || descCol === undefined || amountCol === undefined) {
    // Attempt auto-detect
    dateCol = headers.findIndex(h => /data|date|datum|buchungstag/i.test(h));
    descCol = headers.findIndex(h => /descrição|description|verwendungszweck|payment reference/i.test(h));
    payeeCol = headers.findIndex(h => /nome|name|partner|payee|empfänger|empfaenger|beguenstigter|zahlungspflichtiger/i.test(h));
    
    if (descCol === -1 && payeeCol !== -1) {
      descCol = payeeCol;
    }
    
    amountCol = headers.findIndex(h => /^valor$|amount|^betrag$/i.test(h.trim()));

    if (dateCol === -1 || descCol === -1 || amountCol === -1) {
      return {
        requiresManualMapping: true,
        headers,
        previewRows: dataRows.slice(0, 3)
      };
    }
  }

  // Fetch rules for auto-categorization
  let rules: { keyword: string; category_id: string }[] = [];
  try {
    const { data } = await supabase.from('category_rules').select('keyword, category_id');
    if (data) {
      rules = data
        .filter(r => r.category_id !== null)
        .map(r => ({ keyword: r.keyword, category_id: r.category_id as string }));
    }
  } catch (e) {
    // Ignore error, rules are optional
  }

  const transactions = [];
  for (const row of dataRows) {
    let dateStr = row[dateCol];
    
    let descStr = row[descCol] || '';
    if (payeeCol !== -1 && payeeCol !== descCol && row[payeeCol]) {
      const payeeVal = row[payeeCol].trim();
      const descVal = descStr.trim();
      
      if (!descVal) {
        descStr = payeeVal;
      } else if (payeeVal.toLowerCase() === descVal.toLowerCase()) {
        descStr = payeeVal;
      } else {
        descStr = `${payeeVal} - ${descVal}`;
      }
    }
    let desc = descStr || 'Sem descrição';
    
    let amountStr = row[amountCol];

    if (!dateStr || !desc || !amountStr) continue;

    // Convert DD/MM/YYYY or DD.MM.YYYY to YYYY-MM-DD if needed
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        if (parts[2].length === 4) { // DD/MM/YYYY
          dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
        } else if (parts[2].length === 2) { // DD/MM/YY
          dateStr = `20${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }
    } else if (dateStr.includes('.')) {
      const parts = dateStr.split('.');
      if (parts.length === 3) {
        if (parts[2].length === 4) { // DD.MM.YYYY
          dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
        } else if (parts[2].length === 2) { // DD.MM.YY
          dateStr = `20${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }
    }

    // Convert amount string to number. Ex: "1.234,56" or "1,234.56"
    amountStr = amountStr.replace(/R\$|\$|€/g, '').trim();
    if (amountStr.includes(',') && amountStr.includes('.')) {
      if (amountStr.indexOf(',') < amountStr.indexOf('.')) {
        amountStr = amountStr.replace(/,/g, '');
      } else {
        amountStr = amountStr.replace(/\./g, '').replace(',', '.');
      }
    } else if (amountStr.includes(',')) {
      amountStr = amountStr.replace(',', '.');
    }

    const amount = Number(amountStr);

    // Quick validate date YYYY-MM-DD
    const dateMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (isNaN(amount) || !dateMatch) continue;

    // Format to strict YYYY-MM-DD for PG
    const cleanDate = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;

    // Apply auto-categorization
    let category_id = null;
    const lowerDesc = desc.toLowerCase();
    for (const rule of rules) {
      if (lowerDesc.includes(rule.keyword.toLowerCase())) {
        category_id = rule.category_id;
        break;
      }
    }

    transactions.push({
      date: cleanDate,
      description: desc,
      amount: amount,
      category_id: category_id
    });
  }

  if (transactions.length > 0) {
    let minDate = transactions[0].date;
    let maxDate = transactions[0].date;
    for (const tx of transactions) {
      if (tx.date < minDate) minDate = tx.date;
      if (tx.date > maxDate) maxDate = tx.date;
    }

    const { data: existingTxs, error: fetchError } = await supabase
      .from('transactions')
      .select('date, description, amount')
      .gte('date', minDate)
      .lte('date', maxDate);

    if (fetchError) throw fetchError;

    const dbCounts: Record<string, number> = {};
    for (const tx of existingTxs || []) {
      const sig = `${tx.date}|${tx.description}|${Number(tx.amount)}`;
      dbCounts[sig] = (dbCounts[sig] || 0) + 1;
    }

    const toInsert = [];
    for (const tx of transactions) {
      const sig = `${tx.date}|${tx.description}|${Number(tx.amount)}`;
      if (dbCounts[sig] && dbCounts[sig] > 0) {
        dbCounts[sig]--;
      } else {
        toInsert.push(tx);
      }
    }

    if (toInsert.length > 0) {
      const { error } = await supabase.from('transactions').insert(toInsert);
      if (error) throw error;
    }

    return { imported: toInsert.length, skipped: dataRows.length - toInsert.length, errors: 0 };
  }

  return { imported: 0, skipped: dataRows.length, errors: 0 };
};




export const updateExpectedMonthlyIncome = async (expectedIncome: number | null) => {
  const user = await getCurrentUser();
  const { data: existing } = await supabase.from('settings').select('id').eq('user_id', user.id).maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('settings')
      .update({ expected_monthly_income: expectedIncome })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return { expectedMonthlyIncome: data.expected_monthly_income };
  } else {
    const { data, error } = await supabase
      .from('settings')
      .insert({ expected_monthly_income: expectedIncome, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return { expectedMonthlyIncome: data.expected_monthly_income };
  }
};
