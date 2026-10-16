import type { Direction, DirectionOption, Standard } from './types';
import { detectDirection } from './detect';
import { toLatin } from './toLatin';
import { toCyrillic } from './toCyrillic';

export type { Direction, DirectionOption, Standard } from './types';
export { detectDirection, countScripts } from './detect';
export { toLatin } from './toLatin';
export { toCyrillic } from './toCyrillic';
export { STANDARDS, TABLES, getTable } from './tables';

export interface TransliterateOptions {
  standard?: Standard;
  direction?: DirectionOption;
}

export interface TransliterateResult {
  text: string;
  direction: Direction;
  standard: Standard;
}

export function transliterate(text: string, options: TransliterateOptions = {}): TransliterateResult {
  const standard = options.standard ?? 'popular';
  const requested = options.direction ?? 'auto';
  const direction: Direction = requested === 'auto' ? detectDirection(text) : requested;
  const result = direction === 'cyr2lat' ? toLatin(text, standard) : toCyrillic(text, standard);
  return { text: result, direction, standard };
}
