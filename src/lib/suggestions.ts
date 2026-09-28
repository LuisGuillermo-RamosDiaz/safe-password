import { randomIndex } from './generator';
import { checkCriteria, hasCommonPattern } from './criteria';
import { transformLeet } from './leet';

const OPTIONS = [
  { label: 'Básica' },
  { label: 'Intermedia' },
  { label: 'Avanzada' },
] as const;
const MIN_LENGTH = 12;
const RANDOM_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%*?';

export type Suggestion = {
  label: string;
  transformed: string;
  randomCount: number;
  value: string;
};

function randomChars(length: number): string {
  return Array.from({ length }, () => RANDOM_CHARS[randomIndex(RANDOM_CHARS.length)]).join('');
}

export function suggestFromPhrase(input: string): Suggestion[] {
  const raw = input.normalize('NFC').trim();
  const phrase = raw.replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/gu, ' ');
  if (!phrase || !/\p{L}/u.test(phrase)) throw new Error('Escribe una palabra o frase con letras.');
  if ([...raw].length > 48) throw new Error('Usa una frase de 48 caracteres o menos.');
  if (/[\p{Cc}\p{Cf}]/u.test(raw)) throw new Error('Quita los caracteres de control.');
  const transformedVariants = OPTIONS.map((_, index) => transformLeet(phrase, index as 0 | 1 | 2));

  return OPTIONS.map((option, index) => {
    const transformed = transformedVariants[index];
    const commonBase = hasCommonPattern(transformed);
    const baseChecks = checkCriteria(transformed);
    const missingGroups = [baseChecks.uppercase, baseChecks.lowercase, baseChecks.numbers, baseChecks.symbols].filter(value => !value).length;
    const randomCount = Math.max(1, MIN_LENGTH - [...transformed].length, missingGroups);
    for (let attempt = 0; attempt < 10000; attempt++) {
      const value = transformed + randomChars(randomCount);
      const checks = checkCriteria(value);
      if (checks.length && checks.uppercase && checks.lowercase && checks.numbers && checks.symbols && (checks.patterns || commonBase)) {
        return { label: option.label, transformed, randomCount, value };
      }
    }
    throw new Error('No se pudieron crear las opciones. Prueba otra frase.');
  });
}
