import { describe, expect, it } from 'vitest';
import { transliterate } from '../../src/core';

describe('transliterate', () => {
  it('auto-detects direction', () => {
    expect(transliterate('Привет')).toEqual({ text: 'Privet', direction: 'cyr2lat', standard: 'popular' });
    expect(transliterate('Privet')).toEqual({ text: 'Привет', direction: 'lat2cyr', standard: 'popular' });
  });
  it('respects an explicit direction', () => {
    expect(transliterate('Привет', { direction: 'lat2cyr' }).text).toBe('Привет');
    expect(transliterate('abc', { direction: 'cyr2lat' }).text).toBe('abc');
  });
  it('respects the standard', () => {
    expect(transliterate('хорошо', { standard: 'gost' }).text).toBe('xorosho');
    expect(transliterate('хорошо', { standard: 'icao' }).text).toBe('khorosho');
  });
  it('round-trips popular text', () => {
    const src = 'Съешь же ещё этих мягких французских булок, да выпей чаю';
    const lat = transliterate(src, { standard: 'popular', direction: 'cyr2lat' }).text;
    expect(lat).toBe("S''esh' zhe eshchyo etikh myagkikh frantsuzskikh bulok, da vypey chayu");
    const back = transliterate(lat, { standard: 'popular', direction: 'lat2cyr' }).text;
    // э and е both become "e" in the popular scheme, so the reverse is lossy by design.
    expect(back).toBe('Съешь же ещё етих мягких французских булок, да выпей чаю');
  });
  it('round-trips GOST text exactly', () => {
    const src = 'Шеф взъярён тчк щипцы с эхом гудбай Жюль';
    const lat = transliterate(src, { standard: 'gost', direction: 'cyr2lat' }).text;
    const back = transliterate(lat, { standard: 'gost', direction: 'lat2cyr' }).text;
    expect(back).toBe(src);
  });
  it('handles long multi-line input', () => {
    const src = 'Строка один\nСтрока два\n\nСтрока четыре';
    expect(transliterate(src).text).toBe('Stroka odin\nStroka dva\n\nStroka chetyre');
  });
});
