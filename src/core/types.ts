export type Standard = 'gost' | 'icao' | 'bgn' | 'popular';
export type Direction = 'cyr2lat' | 'lat2cyr';
export type DirectionOption = Direction | 'auto';

/** Context passed to context-sensitive Cyrillic → Latin rules. */
export interface CyrContext {
  /** Previous source character (lowercased), undefined at text start. */
  prev: string | undefined;
  /** Next source character (lowercased), undefined at text end. */
  next: string | undefined;
  /** True if the current character starts a word. */
  wordStart: boolean;
  /** True if the current character ends a word. */
  wordEnd: boolean;
}

export type CyrRule = string | ((ctx: CyrContext) => string);

/** Context passed to context-sensitive Latin → Cyrillic rules. */
export interface LatContext {
  /** Previous source character (lowercased), undefined at text start. */
  prev: string | undefined;
  /** Next source character after the matched token (lowercased). */
  next: string | undefined;
  wordStart: boolean;
  wordEnd: boolean;
}

export type LatRule = string | ((ctx: LatContext) => string);

export interface TransliterationTable {
  id: Standard;
  /** Human-readable name (English). */
  name: string;
  /** Cyrillic (lowercase) → Latin. */
  toLatin: Record<string, CyrRule>;
  /** Latin token (lowercase) → Cyrillic. Longest tokens are matched first. */
  toCyrillic: Record<string, LatRule>;
}
