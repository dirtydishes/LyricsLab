'use strict';

const CURLY_APOSTROPHE_PATTERN = /[\u2018\u2019\u201A\u201B\u02BC\uFF07]/gu;
const TOKEN_EDGE_PATTERN = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu;

function normalizeRhymeToken(token) {
  return token
    .normalize('NFC')
    .toLowerCase()
    .replace(CURLY_APOSTROPHE_PATTERN, "'")
    .trim()
    .replace(TOKEN_EDGE_PATTERN, '');
}

module.exports = { normalizeRhymeToken };
