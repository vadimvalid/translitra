import type { LatRule, Standard } from './types';
import { getTable } from './tables';
import { isUpper, isWordChar } from './tables/common';

interface Compiled {
  tokens: string[];
  rules: Record<string, LatRule>;
}

const cache = new Map<Standard, Compiled>();

function compile(standard: Standard): Compiled {
  const cached = cache.get(standard);
  if (cached) return cached;
  const rules = getTable(standard).toCyrillic;
  const tokens = Object.keys(rules).sort((a, b) => b.length - a.length);
  const compiled = { tokens, rules };
  cache.set(standard, compiled);
  return compiled;
}

function isPlainLetter(ch: string | undefined): boolean {
  return ch !== undefined && isWordChar(ch);
}

function hasCase(ch: string): boolean {
  return ch.toLowerCase() !== ch.toUpperCase();
}

/**
 * Output is uppercase when the first cased letter of the token is uppercase.
 * Caseless tokens (apostrophes, backticks, quotes) follow the surrounding
 * letters of the word: uppercase only when both neighbours are uppercase,
 * so "CZAR`" → "ЦАРЬ" but "S''esh'" → "Съешь".
 */
function shouldUpper(text: string, start: number, length: number): boolean {
  for (let k = start; k < start + length; k++) {
    const ch = text[k]!;
    if (hasCase(ch)) return isUpper(ch);
  }
  const prev = nearestCased(text, start - 1, -1);
  if (prev === undefined || !isUpper(prev)) return false;
  const next = nearestCased(text, start + length, 1);
  return next === undefined || isUpper(next);
}

function nearestCased(text: string, from: number, step: 1 | -1): string | undefined {
  for (let k = from; k >= 0 && k < text.length; k += step) {
    const ch = text[k]!;
    if (hasCase(ch)) return ch;
    if (!isWordChar(ch) && !"'`\"".includes(ch)) return undefined;
  }
  return undefined;
}

export function toCyrillic(text: string, standard: Standard): string {
  const { tokens, rules } = compile(standard);
  const lowerText = text.toLowerCase();
  let out = '';
  let i = 0;

  while (i < text.length) {
    let matched: string | undefined;
    for (const token of tokens) {
      if (lowerText.startsWith(token, i)) {
        matched = token;
        break;
      }
    }

    if (matched === undefined) {
      out += text[i];
      i++;
      continue;
    }

    const prevSrc = i > 0 ? lowerText[i - 1] : undefined;
    const nextSrc = lowerText[i + matched.length];
    const rule = rules[matched]!;
    const mapped =
      typeof rule === 'function'
        ? rule({
            prev: prevSrc,
            next: nextSrc,
            wordStart: !isPlainLetter(prevSrc),
            wordEnd: !isPlainLetter(nextSrc),
          })
        : rule;

    out += shouldUpper(text, i, matched.length) ? mapped.toUpperCase() : mapped;
    i += matched.length;
  }
  return out;
}
