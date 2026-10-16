export const CYR_VOWELS = new Set(['а', 'е', 'ё', 'и', 'о', 'у', 'ы', 'э', 'ю', 'я']);
export const LAT_VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'y', 'ë']);

/** Letters after which е/ё are iotated (pronounced ye/yo) in BGN/PCGN. */
export const IOTATION_TRIGGERS = new Set([...CYR_VOWELS, 'й', 'ъ', 'ь']);

export function isCyrillicLetter(ch: string): boolean {
  return /^[Ѐ-ӿ]$/u.test(ch);
}

export function isLatinLetter(ch: string): boolean {
  return /^[A-Za-zÀ-ɏ]$/u.test(ch);
}

/** Letters of either script, plus the GOST apostrophe/backtick helpers. */
export function isWordChar(ch: string): boolean {
  return isCyrillicLetter(ch) || isLatinLetter(ch);
}

export function isUpper(ch: string): boolean {
  return ch !== ch.toLowerCase() && ch === ch.toUpperCase();
}

export function isLower(ch: string): boolean {
  return ch !== ch.toUpperCase() && ch === ch.toLowerCase();
}
