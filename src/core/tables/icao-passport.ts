import type { TransliterationTable } from '../types';

/** ICAO Doc 9303 — used in Russian international passports since 2014. */
export const icao: TransliterationTable = {
  id: 'icao',
  name: 'ICAO / Passport',
  toLatin: {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
    и: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh',
    щ: 'shch', ъ: 'ie', ы: 'y', ь: '', э: 'e', ю: 'iu', я: 'ia',
  },
  toCyrillic: {
    a: 'а', b: 'б', v: 'в', g: 'г', d: 'д', e: 'е', zh: 'ж', z: 'з',
    i: 'и', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п', r: 'р',
    s: 'с', t: 'т', u: 'у', f: 'ф', kh: 'х', ts: 'ц', ch: 'ч', sh: 'ш',
    shch: 'щ', y: 'ы', iu: 'ю', ia: 'я',
    // Common variants people type even when they mean "passport" style.
    yu: 'ю', ya: 'я', yo: 'ё', j: 'й', x: 'х', h: 'х', "'": 'ь',
  },
};
