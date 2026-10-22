import stringSim from 'string-similarity';

import { levenshtein, normalize } from '@/utils/text';

const SIMILARITY_THRESHOLD = 0.75;
// Dice similarity is too harsh on short titles ("Hallo" vs "Hello" scores 0.5),
// so short titles are matched by allowing a single typo instead.
const SHORT_TITLE_MAX_LENGTH = 6;
const SHORT_TITLE_MIN_LENGTH = 3;

const stripSuffix = (title: string) => title.split(/\s[-–—]\s/)[0];

const stripBrackets = (title: string) => title.replace(/\([^)]*\)|\[[^\]]*\]/g, ' ');

const stripTrailingBrackets = (title: string) =>
	title.replace(/(\s*(\([^)]*\)|\[[^\]]*\]))+\s*$/, '');

// Drops version extras like " - Remastered 2011", " (feat. X)" or " [Live]" so lyrics
// searches find the original song. Leading brackets are part of the name, as in
// "(I Can't Get No) Satisfaction", so they are kept.
export const getSearchTitle = (title: string) =>
	stripTrailingBrackets(stripSuffix(title)).trim() || title.trim();

const getCandidates = (title: string) => {
	const candidates = [
		title,
		stripSuffix(title),
		stripBrackets(title),
		stripBrackets(stripSuffix(title)),
	]
		.map(normalize)
		.filter((candidate) => candidate.length > 0);

	return candidates.filter((candidate, index) => candidates.indexOf(candidate) === index);
};

const matchesCandidate = (guess: string, candidate: string) => {
	if (guess === candidate) {
		return true;
	}

	if (
		candidate.length >= SHORT_TITLE_MIN_LENGTH &&
		candidate.length <= SHORT_TITLE_MAX_LENGTH &&
		levenshtein(guess, candidate) <= 1
	) {
		return true;
	}

	return stringSim.compareTwoStrings(guess, candidate) >= SIMILARITY_THRESHOLD;
};

export const isCorrectGuess = (guess: string, title: string) => {
	const normalizedGuess = normalize(guess);

	if (!normalizedGuess) {
		return false;
	}

	return getCandidates(title).some((candidate) => matchesCandidate(normalizedGuess, candidate));
};
