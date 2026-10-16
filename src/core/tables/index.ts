import type { Standard, TransliterationTable } from '../types';
import { gost } from './gost-7.79-2000-b';
import { icao } from './icao-passport';
import { bgn } from './bgn-pcgn';
import { popular } from './popular';

export const TABLES: Record<Standard, TransliterationTable> = { popular, gost, icao, bgn };

export const STANDARDS: Standard[] = ['popular', 'gost', 'icao', 'bgn'];

export function getTable(standard: Standard): TransliterationTable {
  return TABLES[standard] ?? TABLES.popular;
}
