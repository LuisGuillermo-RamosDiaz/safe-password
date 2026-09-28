import { describe, expect, it } from 'vitest';
import { checkCriteria } from './criteria';
import { suggestFromPhrase } from './suggestions';
import { transformLeet } from './leet';

describe('tres opciones derivadas de una frase', () => {
  it('devuelve tres variantes diferentes, reconocibles y completas hasta con una palabra corta', () => {
    for (const phrase of ['sol', 'cielo azul', 'una luna verde', 'ppr']) {
      const suggestions = suggestFromPhrase(phrase);
      expect(suggestions).toHaveLength(3);
      expect(suggestions.map(item => item.label)).toEqual(['Básica', 'Intermedia', 'Avanzada']);
      expect(new Set(suggestions.map(item => item.value)).size).toBe(3);
      suggestions.forEach((item, index) => {
        expect(item.transformed).toBe(transformLeet(phrase, index as 0 | 1 | 2));
        expect(item.value).not.toContain('-');
        expect([...item.value].length - [...item.transformed].length).toBe(item.randomCount);
        expect(item.randomCount).toBeGreaterThanOrEqual(1);
        if ([...item.transformed].length < 12) expect([...item.value].length).toBe(12);
        expect(Object.values(checkCriteria(item.value)).every(Boolean)).toBe(true);
      });
      suggestions.forEach(item => expect(item.value.startsWith(item.transformed)).toBe(true));
      expect(suggestions.map(item => [...item.value].length)).toEqual([...suggestions.map(item => [...item.value].length)].sort((a, b) => a - b));
      expect([...suggestions[2].value].length).toBeLessThanOrEqual(18);
    }
  });
  it('genera un sufijo nuevo en una segunda solicitud', () => {
    const first = suggestFromPhrase('sol');
    const second = suggestFromPhrase('sol');
    expect(first.some(item => second.some(other => item.value === other.value))).toBe(false);
  });
  it('sustituye al menos una letra en cada variante cuando hay letras leet disponibles', () => {
    const prefixes = suggestFromPhrase('academia').map(item => item.transformed);
    prefixes.forEach(prefix => expect(prefix).toMatch(/[0341!@]/));
    expect(transformLeet('aei', 2)).toMatch(/[a-z]/i);
  });
  it('reparte el leetspeak por la frase de la captura sin insertar ruido', () => {
    expect(transformLeet('hola como estas', 0)).toBe('H0laC0moE5ta5');
    expect(transformLeet('hola como estas', 1)).toBe('H0laC0mo3$ta$');
    expect(transformLeet('hola como estas', 2)).toBe('H0l@C0mo35t@5');
    expect(transformLeet('cielo azul', 0)).toBe('C1elo4zul');
    expect(transformLeet('cielo azul', 1)).toBe('C!el0@zul');
    expect(transformLeet('cielo azul', 2)).toBe('C13l0@zul');
    expect(transformLeet('Árbol único', 0)).toContain('4');
    expect(transformLeet('luz', 0)).toBe('1uz');
    expect(transformLeet('luz', 1)).toBe('1u2');
    expect(transformLeet('Montaña', 0)).toBe('M0ntañ4');
    expect(transformLeet('ppr', 0)).toBe('|*p2');
  });
  it('genera aun con patrones comunes y limpia los guiones de la frase', () => {
    for (const phrase of ['password', '1234 cielo', 'pass word', 'a'.repeat(48), 'una-frase-larga-y-segura']) {
      const suggestions = suggestFromPhrase(phrase);
      expect(suggestions).toHaveLength(3);
      suggestions.forEach(item => {
        expect(item.value).not.toContain('-');
        const checks = checkCriteria(item.value);
        expect(Object.entries(checks).filter(([key]) => key !== 'patterns').every(([, passes]) => passes)).toBe(true);
      });
    }
    expect(suggestFromPhrase('password').every(item => !checkCriteria(item.value).patterns)).toBe(true);
  });
  it.each(['', '   ', '12345', 'a'.repeat(49)])('rechaza frases inválidas: %s', phrase => {
    expect(() => suggestFromPhrase(phrase)).toThrow();
  });
});
