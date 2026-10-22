// Lower-cases, strips accents and punctuation, and collapses whitespace so names
// and titles can be compared regardless of formatting.
export const normalize = (text: string) =>
	text
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/&/g, ' and ')
		.replace(/['’`]/g, '')
		.replace(/[!-\/:-@\[-^_{-~“”‘…–—¿¡«»]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();

export const levenshtein = (a: string, b: string) => {
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
