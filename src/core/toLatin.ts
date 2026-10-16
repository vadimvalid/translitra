import type { Standard } from './types';
import { getTable } from './tables';
import { isUpper, isWordChar } from './tables/common';
import { applyCase, computeUpperWords } from './casing';

export function toLatin(text: string, standard: Standard): string {
  const table = getTable(standard).toLatin;
  const chars = Array.from(text);
  const upperWords = computeUpperWords(chars);
  let out = '';

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]!;
    const lower = ch.toLowerCase();
    const rule = table[lower];
    if (rule === undefined) {
      out += ch;
      continue;
    }
    const prevCh = chars[i - 1];
    const nextCh = chars[i + 1];
    const mapped =
      typeof rule === 'function'
        ? rule({
            prev: prevCh?.toLowerCase(),
            next: nextCh?.toLowerCase(),
            wordStart: prevCh === undefined || !isWordChar(prevCh),
            wordEnd: nextCh === undefined || !isWordChar(nextCh),
          })
        : rule;
    out += applyCase(mapped, isUpper(ch), upperWords[i]!);
  }
  return out;
}
