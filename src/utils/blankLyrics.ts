import { levenshtein, normalize } from '@/utils/text';

const MAX_BLANKS = 3;
// A gap of one short word ("a", "the") is too easy, so a lone gap needs a longer word.
const MIN_SINGLE_WORD_LENGTH = 4;
// Long words forgive a single typo, short ones must be exact so "a" vs "i" still counts.
const TYPO_MIN_LENGTH = 5;

export type LyricsPart = { text: string } | { blank: number; answer: string };

// Splits "love," into the word and its punctuation, so only the word is blanked.
const splitToken = (token: string) => {
	const match = token.match(/^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/u);
	return match ? { before: match[1], word: match[2], after: match[3] } : null;
};

const getWord = (token: string) => splitToken(token)?.word ?? '';

const isBlankable = (token: string) => /\p{L}/u.test(getWord(token));

// Blanks a random run of 1 to 3 neighbouring words, so the gap reads like a piece of the line.
export const blankVerse = (
	verse: string,
	minSingleWordLength = MIN_SINGLE_WORD_LENGTH,
): LyricsPart[] | null => {
	const tokens = verse.split(/(\s+)/).filter((token) => token.length > 0);
	const wordIndexes = tokens.flatMap((token, index) => (/\S/.test(token) ? [index] : []));

	// Tries fewer words first, then more, e.g. two short words when no lone word is long enough.
	const wanted = 1 + Math.floor(Math.random() * MAX_BLANKS);
	const counts = [
		...Array.from({ length: wanted }, (_, index) => wanted - index),
		...Array.from({ length: MAX_BLANKS - wanted }, (_, index) => wanted + index + 1),
	];
	for (const count of counts) {
		const starts = wordIndexes
			.map((_, position) => position)
			.filter(
				(position) =>
					position + count <= wordIndexes.length &&
					wordIndexes
						.slice(position, position + count)
						.every((index) => isBlankable(tokens[index])) &&
					(count > 1 ||
						normalize(getWord(tokens[wordIndexes[position]])).length >= minSingleWordLength),
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
