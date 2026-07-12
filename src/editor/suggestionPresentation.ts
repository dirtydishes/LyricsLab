import type { WordSuggestion } from './suggestions';

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
      role: label.toLocaleLowerCase().includes('near') ? 'near' : 'perfect',
    };
  }

  if (/\bperfect\b/i.test(label)) {
    return { label: 'Perfect', role: 'perfect' };
  }

  if (/\bnear\b/i.test(label)) {
    return { label: 'Near', role: 'near' };
  }

  return { label: 'Prompt', role: 'prompt' };
}
