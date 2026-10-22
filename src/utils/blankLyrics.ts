import { levenshtein, normalize } from '@/utils/text';

const MAX_BLANKS = 3;
// Long words forgive a single typo, short ones must be exact so "a" vs "i" still counts.
const TYPO_MIN_LENGTH = 5;

export type LyricsPart = { text: string } | { blank: number; answer: string };

// Splits "love," into the word and its punctuation, so only the word is blanked.
const splitToken = (token: string) => {
	const match = token.match(/^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/u);
	return match ? { before: match[1], word: match[2], after: match[3] } : null;
};

const isBlankable = (token: string) => /\p{L}/u.test(splitToken(token)?.word ?? '');

// Blanks a random run of 1 to 3 neighbouring words, so the gap reads like a piece of the line.
export const blankVerse = (verse: string): LyricsPart[] | null => {
	const tokens = verse.split(/(\s+)/).filter((token) => token.length > 0);
	const wordIndexes = tokens.flatMap((token, index) => (/\S/.test(token) ? [index] : []));

	const wanted = 1 + Math.floor(Math.random() * MAX_BLANKS);
	for (let count = wanted; count > 0; count--) {
		const starts = wordIndexes
			.map((_, position) => position)
			.filter(
				(position) =>
					position + count <= wordIndexes.length &&
					wordIndexes
						.slice(position, position + count)
						.every((index) => isBlankable(tokens[index])),
			);
		if (!starts.length) {
			continue;
		}

		const start = starts[Math.floor(Math.random() * starts.length)];
		const blanked = new Set(wordIndexes.slice(start, start + count));
		let blank = 0;

		return tokens.flatMap((token, index): LyricsPart[] => {
			const parts = blanked.has(index) ? splitToken(token) : null;
			if (!parts) {
				return [{ text: token }];
			}
			return [
				...(parts.before ? [{ text: parts.before }] : []),
				{ blank: blank++, answer: parts.word },
				...(parts.after ? [{ text: parts.after }] : []),
			];
		});
	}

	return null;
};

export const isCorrectWord = (guess: string, answer: string) => {
	const normalizedGuess = normalize(guess);
	const normalizedAnswer = normalize(answer);

	if (!normalizedGuess) {
		return false;
	}

	return (
		normalizedGuess === normalizedAnswer ||
		(normalizedAnswer.length >= TYPO_MIN_LENGTH &&
			levenshtein(normalizedGuess, normalizedAnswer) <= 1)
	);
};
