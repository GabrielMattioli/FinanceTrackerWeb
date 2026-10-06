import type { PostgrestError } from '@supabase/supabase-js';

export const checkError = <T>(error: PostgrestError | null, data: T): T => {
  if (error) throw error;
  return data;
};
