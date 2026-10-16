import { isUpper, isWordChar } from './tables/common';

/**
 * For every index in `text`, tells whether the word containing it should be
 * treated as ALL CAPS (at least two cased letters and none of them lowercase).
 */
export function computeUpperWords(chars: string[]): boolean[] {
  const result = new Array<boolean>(chars.length).fill(false);
  let i = 0;
  while (i < chars.length) {
    if (!isWordChar(chars[i]!)) {
      i++;
      continue;
    }
    const start = i;
    let cased = 0;
    let upper = 0;
    while (i < chars.length && isWordChar(chars[i]!)) {
      const ch = chars[i]!;
      if (ch.toLowerCase() !== ch.toUpperCase()) {
        cased++;
        if (isUpper(ch)) upper++;
      }
      i++;
    }
    const allUpper = cased >= 2 && upper === cased;
    for (let k = start; k < i; k++) result[k] = allUpper;
  }
  return result;
}

/** Applies the casing of a source character to a (lowercase) output string. */
export function applyCase(output: string, sourceIsUpper: boolean, wordIsUpper: boolean): string {
  if (!sourceIsUpper || output.length === 0) return output;
  if (wordIsUpper) return output.toUpperCase();
  return output.charAt(0).toUpperCase() + output.slice(1);
}
