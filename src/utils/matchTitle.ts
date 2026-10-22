import stringSim from 'string-similarity';

const SIMILARITY_THRESHOLD = 0.75;
// Dice similarity is too harsh on short titles ("Hallo" vs "Hello" scores 0.5),
// so short titles are matched by allowing a single typo instead.
const SHORT_TITLE_MAX_LENGTH = 6;
const SHORT_TITLE_MIN_LENGTH = 3;

const normalize = (text: string) =>
	text
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/&/g, ' and ')
		.replace(/['’`]/g, '')
		.replace(/[!-\/:-@\[-^_{-~“”‘…–—¿¡«»]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();

const stripSuffix = (title: string) => title.split(/\s[-–—]\s/)[0];

const stripBrackets = (title: string) => title.replace(/\([^)]*\)|\[[^\]]*\]/g, ' ');

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

const levenshtein = (a: string, b: string) => {
	let previous = Array.from({ length: b.length + 1 }, (_, i) => i);

	for (let i = 1; i <= a.length; i++) {
		const current = [i];
		for (let j = 1; j <= b.length; j++) {
			const cost = a[i - 1] === b[j - 1] ? 0 : 1;
			current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
		}
		previous = current;
	}

	return previous[b.length];
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
