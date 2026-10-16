import type { TransliterationTable } from '../types';

/** The informal "everyday" transliteration most people type in chats and URLs. */
export const popular: TransliterationTable = {
  id: 'popular',
  name: 'Popular',
  toLatin: {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z',
    и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh',
    щ: 'shch', ъ: "''", ы: 'y', ь: "'", э: 'e', ю: 'yu', я: 'ya',
  },
  toCyrillic: {
    a: 'а', b: 'б', v: 'в', g: 'г', d: 'д', e: 'е', ye: 'е', yo: 'ё',
    zh: 'ж', j: 'й', z: 'з', i: 'и', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о',
    p: 'п', r: 'р', s: 'с', t: 'т', u: 'у', f: 'ф', kh: 'х', h: 'х', x: 'х',
    ts: 'ц', c: 'ц', ch: 'ч', sh: 'ш', shch: 'щ', sch: 'щ', w: 'в', q: 'к',
    "''": 'ъ', '"': 'ъ', "'": 'ь', yu: 'ю', ya: 'я',
    y: ({ prev, wordStart }) =>
      !wordStart && prev !== undefined && 'aeiouy'.includes(prev) ? 'й' : 'ы',
  },
};
