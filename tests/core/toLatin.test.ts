import { describe, expect, it } from 'vitest';
import { toLatin } from '../../src/core/toLatin';

describe('toLatin / popular', () => {
  const t = (s: string) => toLatin(s, 'popular');

  it('maps the basic alphabet', () => {
    expect(t('абвгдежзийклмнопрстуфхцчшщъыьэюя')).toBe(
      "abvgdezhziyklmnoprstufkhtschshshch''y'eyuya",
    );
  });
  it('handles ё and щ', () => {
    expect(t('ёлка')).toBe('yolka');
    expect(t('щука')).toBe('shchuka');
  });
  it('preserves title case', () => {
    expect(t('Щука')).toBe('Shchuka');
    expect(t('Москва')).toBe('Moskva');
  });
  it('preserves ALL CAPS words', () => {
    expect(t('ЩУКА')).toBe('SHCHUKA');
    expect(t('США')).toBe('SSHA');
  });
  it('title-cases a single capital letter', () => {
    expect(t('Я')).toBe('Ya');
    expect(t('Ч.')).toBe('Ch.');
  });
  it('keeps punctuation, digits and whitespace', () => {
    expect(t('Привет, мир! 2026')).toBe('Privet, mir! 2026');
    expect(t('а\nб\tв')).toBe('a\nb\tv');
  });
  it('leaves Latin letters, URLs and brands untouched', () => {
    expect(t('Купить iPhone на https://example.com')).toBe('Kupit\' iPhone na https://example.com');
  });
  it('handles hard and soft signs', () => {
    expect(t('подъезд')).toBe("pod''ezd");
    expect(t('семья')).toBe("sem'ya");
  });
  it('handles mixed case inside a word', () => {
    expect(t('МоСкВа')).toBe('MoSkVa');
  });
  it('returns empty string for empty input', () => {
    expect(t('')).toBe('');
  });
});

describe('toLatin / gost', () => {
  const t = (s: string) => toLatin(s, 'gost');

  it('uses GOST 7.79-2000 B letters', () => {
    expect(t('жизнь')).toBe('zhizn`');
    expect(t('хорошо')).toBe('xorosho');
    expect(t('щи')).toBe('shhi');
    expect(t('йод')).toBe('jod');
    expect(t('эхо')).toBe('e`xo');
    expect(t('быть')).toBe('by`t`');
    expect(t('объём')).toBe('ob``yom');
  });
  it('writes ц as c before i, e, y, j and cz otherwise', () => {
    expect(t('цирк')).toBe('cirk');
    expect(t('центр')).toBe('centr');
    expect(t('цыган')).toBe('cy`gan');
    expect(t('царь')).toBe('czar`');
    expect(t('отец')).toBe('otecz');
  });
  it('keeps case', () => {
    expect(t('Царь')).toBe('Czar`');
    expect(t('ЦАРЬ')).toBe('CZAR`');
  });
});

describe('toLatin / icao', () => {
  const t = (s: string) => toLatin(s, 'icao');

  it('follows passport rules', () => {
    expect(t('Андрей')).toBe('Andrei');
    expect(t('Юлия')).toBe('Iuliia');
    expect(t('Яна')).toBe('Iana');
    expect(t('Ёлкин')).toBe('Elkin');
    expect(t('Хабаровск')).toBe('Khabarovsk');
    expect(t('Цой')).toBe('Tsoi');
    expect(t('Щедрин')).toBe('Shchedrin');
  });
  it('drops soft sign and writes hard sign as ie', () => {
    expect(t('Игорь')).toBe('Igor');
    expect(t('Подъячев')).toBe('Podieiachev');
  });
});

describe('toLatin / bgn', () => {
  const t = (s: string) => toLatin(s, 'bgn');

  it('iotates е and ё at word start and after vowels / й / ъ / ь', () => {
    expect(t('Елена')).toBe('Yelena');
    expect(t('Ёлка')).toBe('Yëlka');
    expect(t('Достоевский')).toBe('Dostoyevskiy');
    expect(t('подъезд')).toBe('pod"yezd');
    expect(t('Васильев')).toBe("Vasil'yev");
    expect(t('Андреев')).toBe('Andreyev');
  });
  it('does not iotate after consonants', () => {
    expect(t('Петров')).toBe('Petrov');
    expect(t('Фёдор')).toBe('Fëdor');
  });
  it('uses y for й and ы', () => {
    expect(t('Йошкар-Ола')).toBe('Yoshkar-Ola');
    expect(t('Крым')).toBe('Krym');
  });
  it('keeps ALL CAPS', () => {
    expect(t('ЕЛЕНА')).toBe('YELENA');
  });
});
