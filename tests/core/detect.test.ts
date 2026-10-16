import { describe, expect, it } from 'vitest';
import { countScripts, detectDirection } from '../../src/core/detect';

describe('detectDirection', () => {
  it('detects Cyrillic text', () => {
    expect(detectDirection('Привет, мир')).toBe('cyr2lat');
  });
  it('detects Latin text', () => {
    expect(detectDirection('Privet, mir')).toBe('lat2cyr');
  });
  it('picks the dominant script in mixed text', () => {
    expect(detectDirection('Купить iPhone')).toBe('cyr2lat');
    expect(detectDirection('Buy айфон today')).toBe('lat2cyr');
  });
  it('defaults to cyr2lat for empty or symbol-only input', () => {
    expect(detectDirection('')).toBe('cyr2lat');
    expect(detectDirection('123 !?')).toBe('cyr2lat');
  });
  it('counts letters only', () => {
    expect(countScripts('аб cd 12')).toEqual({ cyrillic: 2, latin: 2 });
  });
});
