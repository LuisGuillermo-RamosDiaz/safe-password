import { describe, expect, it } from 'vitest';
import { checkCriteria, hasCommonPattern } from './criteria';

describe('criterios visibles del manual', () => {
  it('empieza con las seis casillas incumplidas y responde a cambios concretos', () => {
    expect(Object.values(checkCriteria(''))).toEqual([false, false, false, false, false, false]);
    expect(checkCriteria('abcdefghijkl')).toEqual({ length: true, uppercase: false, lowercase: true, numbers: false, symbols: false, patterns: false });
    expect(checkCriteria('BosqueLunar82!')).toEqual({ length: true, uppercase: true, lowercase: true, numbers: true, symbols: true, patterns: true });
  });
  it('reconoce letras españolas y cuenta puntos de código', () => {
    expect(checkCriteria('Ñá')).toMatchObject({ uppercase: true, lowercase: true, length: false });
    expect(checkCriteria('🔑'.repeat(12)).length).toBe(true);
  });
  it.each(['Password123!', 'P@ssw0rd2026!', '1234azulLuna!', 'ABCD!árbol2026', 'Cielo0000Azul!', 'qwerty2026!A'])('rechaza un patrón común en %s sin espera ni estado intermedio', value => {
    expect(hasCommonPattern(value)).toBe(true);
    expect(checkCriteria(value).patterns).toBe(false);
  });
  it('no confunde una frase poco común con patrones de la lista', () => {
    expect(hasCommonPattern('BosqueLunar82!')).toBe(false);
  });
});
