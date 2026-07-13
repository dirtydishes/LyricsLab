import type { WordSuggestion } from './suggestions';
import type { ProductionSuggestionViewKind } from './productionSuggestions';

export type SuggestionPresentation = {
  label: string;
  role: 'near' | 'perfect' | 'prompt';
};

export function getSuggestionPresentation(
  suggestion: WordSuggestion,
): SuggestionPresentation {
  const label = suggestion.label?.trim();

  if (!label) {
    return { label: 'Prompt', role: 'prompt' };
  }

  const syllableMatch = label.match(/\b([2-9]|\d{2,})[- ]syllable\b/i);

  if (syllableMatch) {
    return {
      label: `${syllableMatch[1]}-syllable`,
      role:
        suggestion.role ??
        (label.toLocaleLowerCase().includes('near') ? 'near' : 'perfect'),
    };
  }

  if (suggestion.role) {
    return { label: roleLabel(suggestion.role), role: suggestion.role };
  }

  if (/\bperfect\b/i.test(label)) {
    return { label: 'Perfect', role: 'perfect' };
  }

  if (/\bnear\b/i.test(label)) {
    return { label: 'Near', role: 'near' };
  }

  return { label: 'Prompt', role: 'prompt' };
}

export function getSuggestionAccessibilityLabel(
  presentation: SuggestionPresentation,
  word: string,
) {
  return presentation.label.endsWith('-syllable')
    ? `${roleLabel(presentation.role)} rhyme, ${presentation.label} match, ${word}`
    : `${presentation.label} rhyme, ${word}`;
}

export function getSuggestionStateLabel(kind: ProductionSuggestionViewKind) {
  switch (kind) {
    case 'error':
    case 'unavailable':
      return 'Unavailable';
    case 'loading':
      return 'Loading';
    case 'hidden':
    case 'prompt':
    case 'results':
      return 'Prompt';
  }
}

function roleLabel(role: SuggestionPresentation['role']) {
  return `${role.charAt(0).toLocaleUpperCase()}${role.slice(1)}`;
}
