const VOWELS = new Set([
  'AA', 'AE', 'AH', 'AO', 'AW', 'AY', 'EH', 'ER',
  'EY', 'IH', 'IY', 'OW', 'OY', 'UH', 'UW',
]);

const CONSONANT_MANNERS = Object.freeze({
  B: 'stop', CH: 'affricate', D: 'stop', DH: 'fricative', F: 'fricative',
  G: 'stop', HH: 'fricative', JH: 'affricate', K: 'stop', L: 'liquid',
  M: 'nasal', N: 'nasal', NG: 'nasal', P: 'stop', R: 'liquid', S: 'fricative',
  SH: 'fricative', T: 'stop', TH: 'fricative', V: 'fricative', W: 'glide',
  Y: 'glide', Z: 'fricative', ZH: 'fricative',
});

const VOWEL_FAMILY_IDS = new Map([
  ['IY', 0], ['IH', 0],
  ['EY', 1], ['EH', 1], ['AE', 1],
  ['AA', 2], ['AO', 2],
  ['OW', 3], ['UH', 3], ['UW', 3],
  ['AH', 4], ['ER', 4],
]);

const CURLY_APOSTROPHE_PATTERN = /[\u2018\u2019\u201A\u201B\u02BC\uFF07]/gu;
const TOKEN_EDGE_PATTERN = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu;

export function normalizeRhymeWord(word) {
  return word
    .normalize('NFC')
    .toLowerCase()
    .replace(CURLY_APOSTROPHE_PATTERN, "'")
    .trim()
    .replace(TOKEN_EDGE_PATTERN, '');
}

export function createRhymeKeys(phones) {
  const tail = findRhymeTail(phones);

  if (!tail) {
    throw new Error(`Pronunciation has no vowel: ${phones.join(' ')}`);
  }

  return {
    exactKey: tail.join(' '),
    familyKey: tail
      .map((phone) => {
        const base = phone.replace(/[0-2]$/u, '');
        return VOWELS.has(base)
          ? `v:${base}`
          : `c:${CONSONANT_MANNERS[base] ?? base}`;
      })
      .join('|'),
  };
}

export function createSlantBucketKey(familyKey) {
  const vowels = familyKey
    .split('|')
    .filter((segment) => segment.startsWith('v:'))
    .map((segment) => {
      const phone = segment.slice(2);
      const familyId = VOWEL_FAMILY_IDS.get(phone);
      return familyId === undefined ? segment : `vf:${familyId}`;
    });
  return vowels.length <= 3 ? vowels.join('|') : `vc:${vowels.length}`;
}

export function isValidArpabetPhone(phone) {
  if (typeof phone !== 'string') return false;
  const match = phone.match(/^([A-Z]+)([0-2])?$/u);
  if (!match) return false;
  const [, base, stress] = match;
  return VOWELS.has(base)
    ? stress !== undefined
    : stress === undefined && Object.hasOwn(CONSONANT_MANNERS, base);
}

function findRhymeTail(phones) {
  for (const preferredStress of ['1', '2']) {
    for (let index = phones.length - 1; index >= 0; index -= 1) {
      const phone = phones[index];
      if (phone.endsWith(preferredStress) && isVowel(phone)) {
        return phones.slice(index);
      }
    }
  }

  for (let index = phones.length - 1; index >= 0; index -= 1) {
    if (isVowel(phones[index])) return phones.slice(index);
  }

  return null;
}

function isVowel(phone) {
  return VOWELS.has(phone.replace(/[0-2]$/u, ''));
}
