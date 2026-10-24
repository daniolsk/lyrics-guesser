import { getSearchTitle, getSongKey, isCorrectGuess } from '@/utils/matchTitle';
import { timed } from '@/utils/requestLog';
import { normalize } from '@/utils/text';

// Spotify no longer returns preview clips for new apps, so the 30 second clips come from
// Deezer, with Apple's iTunes search as a backup. Both are free and need no keys.
const SEARCH_LIMIT = 10;

type Candidate = { title: string; artist: string; previewUrl: string };

type DeezerSearch = {
	data?: { title: string; preview: string; artist: { name: string } }[];
};

type ITunesSearch = {
	results?: { trackName?: string; artistName?: string; previewUrl?: string }[];
};

const fetchJson = async <T>(url: string): Promise<T> => {
	const response = await fetch(url, { headers: { Accept: 'application/json' } });
	if (!response.ok) {
		throw new Error(`Preview search failed: ${response.status}`);
	}
	return response.json();
};

const searchDeezer = async (query: string): Promise<Candidate[]> => {
	const data = await fetchJson<DeezerSearch>(
		`https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=${SEARCH_LIMIT}`,
	);
	return (data.data ?? []).map((item) => ({
		title: item.title,
		artist: item.artist.name,
		previewUrl: item.preview,
	}));
};

const searchITunes = async (query: string): Promise<Candidate[]> => {
	const data = await fetchJson<ITunesSearch>(
		`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=${SEARCH_LIMIT}`,
	);
	return (data.results ?? []).map((item) => ({
		title: item.trackName ?? '',
		artist: item.artistName ?? '',
		previewUrl: item.previewUrl ?? '',
	}));
};

const isSameArtist = (found: string, artists: string[]) => {
	const name = normalize(found);
	return artists.some(
		(artist) => name.length > 0 && (name.includes(artist) || artist.includes(name)),
	);
};

// Prefers the exact song over a remix or live version that only looks similar.
const pickPreview = (candidates: Candidate[], title: string, artists: string[]) => {
	const playable = candidates.filter(
		(candidate) => candidate.previewUrl && isSameArtist(candidate.artist, artists),
	);
	const songKey = getSongKey(title);
	const match =
		playable.find((candidate) => getSongKey(candidate.title) === songKey) ??
		playable.find((candidate) => isCorrectGuess(getSearchTitle(candidate.title), title));
	return match?.previewUrl ?? null;
};

export const findPreviewUrl = async (title: string, artistNames: string) =>
	timed(
		'Preview',
		`findPreviewUrl("${title}")`,
		async () => {
			const artists = artistNames
				.split(',')
				.map(normalize)
				.filter((artist) => artist.length > 0);
			const query = `${artistNames.split(',')[0]} ${getSearchTitle(title)}`;

			for (const search of [searchDeezer, searchITunes]) {
				const candidates = await search(query).catch(() => []);
				const previewUrl = pickPreview(candidates, title, artists);
				if (previewUrl) {
					return previewUrl;
				}
			}
			return null;
		},
		(previewUrl) => ({ found: Boolean(previewUrl) }),
	);
