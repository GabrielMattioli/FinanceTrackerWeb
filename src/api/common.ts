import type { PostgrestError, User } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

export const checkError = <T>(error: PostgrestError | null, data: T): T => {
  if (error) throw error;
  return data;
};

export const getAuthenticatedUser = async (): Promise<User> => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) {
    const authError = new Error('Usuário não autenticado');
    authError.name = 'AuthError';
    throw authError;
  }
  return user;
};

const POSTGREST_PAGE_SIZE = 1000;

interface RangeQueryResult<T> {
  data: T[] | null;
  error: PostgrestError | null;
}

/**
 * Fetches all rows for a Supabase query by paging in 1,000-row chunks.
 * Prevents silent PostgREST truncation on accounts with > 1,000 transactions.
 */
export async function fetchAllPages<T>(
  buildQuery: (from: number, to: number) => PromiseLike<RangeQueryResult<T>>
): Promise<T[]> {
  const allRows: T[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await buildQuery(offset, offset + POSTGREST_PAGE_SIZE - 1);
    if (error) throw error;

    const batch = data ?? [];
    allRows.push(...batch);

    if (batch.length < POSTGREST_PAGE_SIZE) {
      break;
    }
    offset += POSTGREST_PAGE_SIZE;
  }

  return allRows;
}
