import { describe, expect, it } from 'vitest';
import { toCyrillic } from '../../src/core/toCyrillic';

describe('toCyrillic / popular', () => {
  const t = (s: string) => toCyrillic(s, 'popular');

  it('matches the longest token first', () => {
    expect(t('shchuka')).toBe('щука');
    expect(t('shuka')).toBe('шука');
    expect(t('schuka')).toBe('щука');
    expect(t('skhema')).toBe('схема');
  });
  it('handles digraphs', () => {
    expect(t('zhizn')).toBe('жизн');
    expect(t('chas')).toBe('час');
    expect(t('tsar')).toBe('цар');
    expect(t('khleb')).toBe('хлеб');
    expect(t('hleb')).toBe('хлеб');
  });
  it('handles iotated vowels', () => {
    expect(t('ya')).toBe('я');
    expect(t('yu')).toBe('ю');
    expect(t('yo')).toBe('ё');
    expect(t('yolka')).toBe('ёлка');
    expect(t('Yulia')).toBe('Юлиа');
  });
  it('treats y as й after a vowel and as ы otherwise', () => {
    expect(t('Andrey')).toBe('Андрей');
    expect(t('moy')).toBe('мой');
    expect(t('byt')).toBe('быт');
    expect(t('Krym')).toBe('Крым');
    expect(t('Dmitriy')).toBe('Дмитрий');
  });
  it('treats j as й', () => {
    expect(t('jod')).toBe('йод');
    expect(t('Sergej')).toBe('Сергей');
  });
  it('handles soft and hard signs', () => {
    expect(t("sem'ya")).toBe('семья');
    expect(t("pod''ezd")).toBe('подъезд');
    expect(t("Igor'")).toBe('Игорь');
  });
  it('preserves case', () => {
    expect(t('Shchuka')).toBe('Щука');
    expect(t('SHCHUKA')).toBe('ЩУКА');
    expect(t('Moskva')).toBe('Москва');
    expect(t('MOSKVA')).toBe('МОСКВА');
    expect(t('Ya')).toBe('Я');
    expect(t('YA')).toBe('Я');
  });
  it('keeps punctuation, digits and Cyrillic untouched', () => {
    expect(t('Privet, mir! 2026')).toBe('Привет, мир! 2026');
    expect(t('Privet мир')).toBe('Привет мир');
  });
  it('maps w and q', () => {
    expect(t('Wadim')).toBe('Вадим');
    expect(t('qwerty')).toBe('кверты');
  });
  it('returns empty string for empty input', () => {
    expect(t('')).toBe('');
  });
});

describe('toCyrillic / gost', () => {
  const t = (s: string) => toCyrillic(s, 'gost');

  it('reverses GOST 7.79-2000 B', () => {
    expect(t('zhizn`')).toBe('жизнь');
    expect(t('xorosho')).toBe('хорошо');
    expect(t('shhi')).toBe('щи');
    expect(t('jod')).toBe('йод');
    expect(t('e`xo')).toBe('эхо');
    expect(t('by`t`')).toBe('быть');
    expect(t('ob``yom')).toBe('объём');
    expect(t('czar`')).toBe('царь');
    expect(t('cirk')).toBe('цирк');
  });
  it('keeps case', () => {
    expect(t('Czar`')).toBe('Царь');
    expect(t('CZAR`')).toBe('ЦАРЬ');
  });
});

describe('toCyrillic / icao', () => {
  const t = (s: string) => toCyrillic(s, 'icao');

  it('reverses passport spelling where unambiguous', () => {
    expect(t('Khabarovsk')).toBe('Хабаровск');
    expect(t('Shchedrin')).toBe('Щедрин');
    expect(t('Iuliia')).toBe('Юлия');
    expect(t('Tsoi')).toBe('Цои');
  });
});

describe('toCyrillic / bgn', () => {
  const t = (s: string) => toCyrillic(s, 'bgn');

  it('reverses BGN/PCGN', () => {
    expect(t('Yelena')).toBe('Елена');
    expect(t('Yëlka')).toBe('Ёлка');
    expect(t('Dostoyevskiy')).toBe('Достоевский');
    expect(t('pod"yezd')).toBe('подъезд');
    expect(t("Vasil'yev")).toBe('Васильев');
    expect(t('Fëdor')).toBe('Фёдор');
  });
});
