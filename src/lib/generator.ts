export const GROUPS = {
  uppercase: { label: 'Mayúsculas', sample: 'A–Z', chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' },
  lowercase: { label: 'Minúsculas', sample: 'a–z', chars: 'abcdefghijklmnopqrstuvwxyz' },
  numbers: { label: 'Números', sample: '0–9', chars: '0123456789' },
  symbols: { label: 'Símbolos', sample: '!@#$', chars: '!@#$%^&*()-_=+[]{};:,.?' },
} as const;

export type Group = keyof typeof GROUPS;
export type Options = { length: number; groups: Group[]; excludeSimilar: boolean };
export const DEFAULT_OPTIONS: Options = {
  length: 20, groups: ['uppercase', 'lowercase', 'numbers', 'symbols'], excludeSimilar: false,
};
export const SIMILAR = 'Il1O0o';

export function alphabets(options: Options): string[] {
  if (!Number.isInteger(options.length) || options.length < 12 || options.length > 64)
    throw new Error('Elige una longitud entera entre 12 y 64 caracteres.');
  if (!options.groups.length) throw new Error('Activa al menos un tipo de carácter.');
  if (new Set(options.groups).size !== options.groups.length || options.groups.some(g => !(g in GROUPS)))
    throw new Error('La selección de caracteres no es válida.');
  return options.groups.map(g => [...GROUPS[g].chars]
    .filter(c => !options.excludeSimilar || !SIMILAR.includes(c)).join(''));
}

// Rejection sampling eliminates modulo bias. No Math.random fallback.
export function randomIndex(size: number, nextUint32 = secureUint32): number {
  if (!Number.isInteger(size) || size < 1 || size > 0x100000000) throw new Error('Alfabeto inválido.');
  const ceiling = Math.floor(0x100000000 / size) * size;
  for (;;) {
    const value = nextUint32();
    if (value < ceiling) return value % size;
  }
}

function secureUint32(): number {
  if (!globalThis.crypto?.getRandomValues) throw new Error('Tu navegador no dispone de generación criptográfica. Usa un navegador actualizado.');
  return globalThis.crypto.getRandomValues(new Uint32Array(1))[0];
}

// The full candidate is rejected if a selected category is missing; all valid
// strings therefore retain the same probability (unlike forced insertion).
export function generatePassword(options: Options): string {
  const groups = alphabets(options);
  const pool = groups.join('');
  for (let attempt = 0; attempt < 10000; attempt++) {
    const candidate = Array.from({ length: options.length }, () => pool[randomIndex(pool.length)]).join('');
    if (groups.every(group => [...candidate].some(c => group.includes(c)))) return candidate;
  }
  throw new Error('No se pudo generar una clave. Intenta de nuevo.');
}

// Inclusion-exclusion: exact number of strings containing every chosen group.
export function validCombinations(options: Options): bigint {
  const sizes = alphabets(options).map(g => g.length);
  const poolSize = sizes.reduce((sum, size) => sum + size, 0);
  let count = 0n;
  for (let mask = 0; mask < 1 << sizes.length; mask++) {
    let missing = 0, parity = 0;
    sizes.forEach((size, i) => { if (mask & (1 << i)) { missing += size; parity++; } });
    const term = BigInt(poolSize - missing) ** BigInt(options.length);
    count += parity % 2 ? -term : term;
  }
  return count;
}

export function entropyBits(options: Options): number {
  return Math.log2(Number(validCombinations(options)));
}

export function generationLevel(bits: number) {
  if (bits < 60) return { label: 'Mejorable', tone: 'weak', value: 1 };
  if (bits < 80) return { label: 'Buena diversidad', tone: 'fair', value: 3 };
  return { label: 'Alta diversidad', tone: 'strong', value: 5 };
}
