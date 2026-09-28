export const CRITERIA = [
  { id: 'length', label: '12 caracteres o más' },
  { id: 'uppercase', label: 'Una letra mayúscula' },
  { id: 'lowercase', label: 'Una letra minúscula' },
  { id: 'numbers', label: 'Un número (0–9)' },
  { id: 'symbols', label: 'Un símbolo (!, @, #)' },
  { id: 'patterns', label: 'Sin patrones comunes' },
] as const;

const COMMON_WORDS = ['password', 'contrasena', 'admin', 'welcome', 'bienvenido', 'qwerty', 'asdf'];

function hasSequence(value: string): boolean {
  for (let index = 0; index <= value.length - 4; index++) {
    const part = value.slice(index, index + 4);
    if (!/^[a-z]{4}$|^[0-9]{4}$/.test(part)) continue;
    const codes = [...part].map(character => character.charCodeAt(0));
    if (codes.every((code, offset) => !offset || code - codes[offset - 1] === 1)) return true;
    if (codes.every((code, offset) => !offset || code - codes[offset - 1] === -1)) return true;
  }
  return false;
}

export function hasCommonPattern(password: string): boolean {
  const lower = password.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
  const leetFolded = lower.replace(/[4@]/g, 'a').replace(/3/g, 'e').replace(/[1!]/g, 'i')
    .replace(/0/g, 'o').replace(/[5$]/g, 's').replace(/[7+]/g, 't').replace(/8/g, 'b').replace(/9/g, 'g');
  return COMMON_WORDS.some(word => leetFolded.includes(word))
    || /(.)\1{3,}/u.test(lower)
    || hasSequence(lower);
}

export function checkCriteria(password: string) {
  return {
    length: [...password].length >= 12,
    uppercase: /\p{Lu}/u.test(password),
    lowercase: /\p{Ll}/u.test(password),
    numbers: /[0-9]/.test(password),
    symbols: /[^\p{L}\p{N}\s]/u.test(password),
    patterns: [...password].length >= 12 && !hasCommonPattern(password),
  };
}
