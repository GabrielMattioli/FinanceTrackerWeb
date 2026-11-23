/**
 * Escapes PostgreSQL LIKE/ILIKE wildcard characters (%, _, \) so user-supplied
 * search terms or rule keywords are matched literally.
 */
export function escapeLikePattern(input: string): string {
  return input.replace(/[\\%_]/g, (char) => `\\${char}`);
}
