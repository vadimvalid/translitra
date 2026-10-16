import type { TransliterationTable } from '../types';
import { IOTATION_TRIGGERS } from './common';

const iotated = (ctx: { prev: string | undefined; wordStart: boolean }) =>
  ctx.wordStart || (ctx.prev !== undefined && IOTATION_TRIGGERS.has(ctx.prev));

/** BGN/PCGN 1947 romanization of Russian (ASCII apostrophes). */
export const bgn: TransliterationTable = {
  id: 'bgn',
  name: 'BGN/PCGN',
  toLatin: {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd',
    е: (ctx) => (iotated(ctx) ? 'ye' : 'e'),
    ё: (ctx) => (iotated(ctx) ? 'yë' : 'ë'),
    ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
    п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch',
    ш: 'sh', щ: 'shch', ъ: '"', ы: 'y', ь: "'", э: 'e', ю: 'yu', я: 'ya',
  },
  toCyrillic: {
    a: 'а', b: 'б', v: 'в', g: 'г', d: 'д', e: 'е', ye: 'е', ë: 'ё', 'yë': 'ё',
    yo: 'ё', zh: 'ж', z: 'з', i: 'и', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о',
    p: 'п', r: 'р', s: 'с', t: 'т', u: 'у', f: 'ф', kh: 'х', h: 'х', x: 'х',
    ts: 'ц', ch: 'ч', sh: 'ш', shch: 'щ', '"': 'ъ', "''": 'ъ', "'": 'ь',
    yu: 'ю', ya: 'я', j: 'й',
    y: ({ prev, wordStart }) =>
      !wordStart && prev !== undefined && 'aeiouyë'.includes(prev) ? 'й' : 'ы',
  },
};
