import type { TransliterationTable } from '../types';

/** GOST 7.79-2000 System B (ASCII-only, reversible). */
export const gost: TransliterationTable = {
  id: 'gost',
  name: 'GOST 7.79-2000 (B)',
  toLatin: {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z',
    и: 'i', й: 'j', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', у: 'u', ф: 'f', х: 'x',
    ц: ({ next }) => (next !== undefined && 'иеыj'.includes(next) ? 'c' : 'cz'),
    ч: 'ch', ш: 'sh', щ: 'shh', ъ: '``', ы: 'y`', ь: '`', э: 'e`', ю: 'yu', я: 'ya',
  },
  toCyrillic: {
    a: 'а', b: 'б', v: 'в', g: 'г', d: 'д', e: 'е', yo: 'ё', zh: 'ж', z: 'з',
    i: 'и', j: 'й', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п', r: 'р',
    s: 'с', t: 'т', u: 'у', f: 'ф', x: 'х', kh: 'х', cz: 'ц', c: 'ц',
    ch: 'ч', sh: 'ш', shh: 'щ', shch: 'щ', '``': 'ъ', 'y`': 'ы', y: 'ы', '`': 'ь',
    "''": 'ъ', "'": 'ь', 'e`': 'э', yu: 'ю', ya: 'я',
  },
};
