'use strict';

const { normalizeRhymeToken } = require('../rhyme/normalizeCore.cjs');

function isCuratedEntryEligible(normalizedWord, flags, context) {
  if (context.mode === 'anchor') {
    return true;
  }

  if (flags.safetyBlocked) {
    return false;
  }

  if (!flags.properNoun) {
    return true;
  }

  const prefix = normalizeRhymeToken(context.activePrefix);
  return prefix.length > 0 && normalizedWord.startsWith(prefix);
}

module.exports = { isCuratedEntryEligible };
