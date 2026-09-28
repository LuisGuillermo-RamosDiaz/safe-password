const CORE: Record<string, [string, string]> = {
  a: ['4', '@'], e: ['3', '3'], i: ['1', '!'],
  o: ['0', '0'], s: ['5', '$'],
};
const FALLBACK: Record<string, [string, string]> = {
  b: ['8', '8'], g: ['9', '9'], l: ['1', '1'],
  t: ['7', '+'], z: ['2', '2'],
};
const EXTENDED: Record<string, [string, string]> = {
  c: ['(', '('], d: ['|)', '|)'], f: ['|=', '|='], h: ['#', '#'],
  j: ['_|', '_|'], k: ['|<', '|<'], m: ['^^', '^^'], n: ['^', '^'],
  p: ['|*', '|*'], q: ['9', '9'], r: ['2', '2'], u: ['(_)', '(_)'],
  v: ['\\/', '\\/'], w: ['vv', 'vv'], x: ['><', '><'], y: ['¥', '¥'],
};

function baseLetter(character: string): string {
  return character.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
}

export function transformLeet(phrase: string, variant: 0 | 1 | 2): string {
  const chars = [...phrase].filter(character => !/\s/u.test(character));
  const core = chars.flatMap((character, index) => CORE[baseLetter(character)] ? [index] : []);
  const fallback = chars.flatMap((character, index) => FALLBACK[baseLetter(character)] ? [index] : []);
  const extended = chars.flatMap((character, index) => EXTENDED[baseLetter(character)] ? [index] : []);
  const candidates = core.length ? core : fallback.length ? fallback : extended;
  if (!candidates.length) return chars.join('');

  // La cantidad crece con la frase y deja letras originales para reconocerla.
  const letters = chars.filter(character => /\p{L}/u.test(character)).length;
  const proportion = [0.4, 0.6, 0.8][variant];
  const count = Math.min(Math.ceil(candidates.length * proportion), candidates.length, Math.max(1, letters - 1));
  const chosen = new Set(Array.from({ length: count }, (_, position) =>
    candidates[count === 1 ? 0 : Math.round(position * (candidates.length - 1) / (count - 1))]));
  let compactIndex = 0;
  let wordStart = true;
  let replacementIndex = 0;
  return [...phrase].map(character => {
    if (/\s/u.test(character)) { wordStart = true; return ''; }
    const selected = chosen.has(compactIndex++);
    const base = baseLetter(character);
    const alphabet = CORE[base] || FALLBACK[base] || EXTENDED[base];
    if (selected && alphabet) {
      wordStart = false;
      return alphabet[variant === 0 ? 0 : variant === 1 ? 1 : replacementIndex++ % 2];
    }
    const result = wordStart ? character.toLocaleUpperCase('es') : character.toLocaleLowerCase('es');
    wordStart = false;
    return result;
  }).join('');
}
