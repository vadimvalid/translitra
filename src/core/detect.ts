import type { Direction } from './types';
import { isCyrillicLetter, isLatinLetter } from './tables/common';

export interface ScriptStats {
  cyrillic: number;
  latin: number;
}

export function countScripts(text: string): ScriptStats {
  let cyrillic = 0;
  let latin = 0;
  for (const ch of text) {
    if (isCyrillicLetter(ch)) cyrillic++;
    else if (isLatinLetter(ch)) latin++;
  }
  return { cyrillic, latin };
}

/**
 * Picks the direction by the dominant script.
 * Ties and empty input default to Cyrillic → Latin.
 */
export function detectDirection(text: string): Direction {
  const { cyrillic, latin } = countScripts(text);
  return latin > cyrillic ? 'lat2cyr' : 'cyr2lat';
}
