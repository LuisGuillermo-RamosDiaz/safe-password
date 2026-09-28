import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_OPTIONS, GROUPS, SIMILAR, alphabets, entropyBits, generatePassword, randomIndex, validCombinations, type Group } from './generator';

afterEach(() => vi.unstubAllGlobals());
describe('generación criptográfica', () => {
  it('respeta longitud, alfabeto y todos los grupos en las 90 configuraciones de frontera', () => {
    const keys = Object.keys(GROUPS) as Group[];
    for (let mask = 1; mask < 16; mask++) for (const length of [12, 20, 64]) for (const excludeSimilar of [false, true]) {
      const options = { length, excludeSimilar, groups: keys.filter((_, i) => mask & (1 << i)) };
      for (let sample = 0; sample < 5; sample++) {
        const password = generatePassword(options);
        const groups = alphabets(options);
        expect(password).toHaveLength(length);
        expect([...password].every(c => groups.join('').includes(c))).toBe(true);
        expect(groups.every(group => [...password].some(c => group.includes(c)))).toBe(true);
        if (excludeSimilar) expect([...password].some(c => SIMILAR.includes(c))).toBe(false);
      }
    }
  });
  it('rechaza el excedente de uint32 antes de aplicar módulo', () => {
    const source = vi.fn().mockReturnValueOnce(4294967295).mockReturnValueOnce(4294967290).mockReturnValueOnce(17);
    expect(randomIndex(10, source)).toBe(7);
    expect(source).toHaveBeenCalledTimes(3);
  });
  it('cuenta exactamente las cadenas válidas con uno y dos grupos', () => {
    expect(validCombinations({ length: 12, groups: ['numbers'], excludeSimilar: false })).toBe(10n ** 12n);
    expect(validCombinations({ length: 12, groups: ['uppercase', 'numbers'], excludeSimilar: false })).toBe(36n ** 12n - 26n ** 12n - 10n ** 12n);
    expect(entropyBits(DEFAULT_OPTIONS)).toBeGreaterThan(120);
    expect(entropyBits({ ...DEFAULT_OPTIONS, excludeSimilar: true })).toBeLessThan(entropyBits(DEFAULT_OPTIONS));
  });
  it('falla explícitamente si falta Web Crypto', () => {
    vi.stubGlobal('crypto', undefined);
    expect(() => generatePassword(DEFAULT_OPTIONS)).toThrow('criptográfica');
  });
  it.each([0, 11, 65, 12.5, NaN, Infinity])('rechaza longitud inválida: %s', length => {
    expect(() => generatePassword({ ...DEFAULT_OPTIONS, length })).toThrow();
  });
  it('rechaza grupos vacíos o duplicados', () => {
    expect(() => generatePassword({ ...DEFAULT_OPTIONS, groups: [] })).toThrow('al menos');
    expect(() => generatePassword({ ...DEFAULT_OPTIONS, groups: ['numbers', 'numbers'] })).toThrow('válida');
  });
});
