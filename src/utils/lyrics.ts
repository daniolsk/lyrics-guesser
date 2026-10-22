import stringSim from 'string-similarity';

import { getSearchTitle } from '@/utils/matchTitle';
import { logRequest, timed } from '@/utils/requestLog';
import { Lyrics } from '@/utils/types';

const MIN_LYRIC_LINES = 4;
const LRCLIB_TIMEOUT_MS = 6_000;
const LRCLIB_RETRY_DELAY_MS = 500;
const LRCLIB_USER_AGENT = 'lyrics-guesser/0.1.0 (https://guessthesong.vercel.app)';

const isInstrumentalTitle = (title: string) => title.toLowerCase().includes('instrumental');

type LrclibResult = {
	id: number;
	trackName: string;
	artistName: string;
	albumName: string;
	duration: number;
	instrumental: boolean;
	plainLyrics: string | null;
	syncedLyrics: string | null;
};

type SongMetadata = {
	songTitle: string;
	songImage: string;
	songArtist: string;
	songArtistNames: string;
};

export const isValidLyrics = (lyrics: Lyrics | null | undefined): lyrics is Lyrics => {
	if (!lyrics) {
		return false;
	}

	const hasVerses =
		typeof lyrics.firstVerse === 'string' &&
		lyrics.firstVerse.length > 0 &&
		typeof lyrics.secondVerse === 'string' &&
		lyrics.secondVerse.length > 0 &&
		Array.isArray(lyrics.nextVerses) &&
		lyrics.nextVerses.length === 2 &&
		typeof lyrics.nextVerses[0] === 'string' &&
		lyrics.nextVerses[0].length > 0 &&
		typeof lyrics.nextVerses[1] === 'string' &&
		lyrics.nextVerses[1].length > 0;

	const hasMetadata =
		typeof lyrics.songTitle === 'string' &&
		lyrics.songTitle.length > 0 &&
		typeof lyrics.songImage === 'string' &&
		lyrics.songImage.length > 0 &&
		typeof lyrics.songArtist === 'string' &&
		lyrics.songArtist.length > 0 &&
		typeof lyrics.songArtistNames === 'string' &&
		lyrics.songArtistNames.length > 0;

	return hasVerses && hasMetadata;
};

const parseLyricsLines = (lyrics: string): string[] => {
	return lyrics
		.split('\n')
		.map((line) => line.replace(/^\[\d{2}:\d{2}(?:\.\d+)?\]\s*/, '').trim())
		.map((line) => line.replace(/^\d+\s+Contributors.*$/i, '').trim())
		.filter((line) => line.length > 0 && line[0] !== '[' && !/^\d+\s+Contributors/i.test(line));
};

const expandArtistNames = (artists: (string | undefined)[]): string[] => {
	const names = new Set<string>();

	for (const artist of artists) {
		if (!artist) {
			continue;
		}

		names.add(artist.trim());

		for (const part of artist.split(/[,&]/)) {
			const trimmed = part.trim();
			if (trimmed) {
				names.add(trimmed);
			}
		}
	}

	return Array.from(names);
};

const getLrclibLyricsText = (result: LrclibResult): string | null => {
	if (result.plainLyrics?.trim()) {
		return result.plainLyrics;
	}

	if (result.syncedLyrics?.trim()) {
		return result.syncedLyrics;
	}

	return null;
};

// Thrown when a lyrics service failed (error status, timeout), so we can't tell whether
// the song has lyrics. Unlike "Lyrics not found", the song shouldn't be avoided later.
export class LyricsUnavailableError extends Error {
	constructor() {
		super('Lyrics service unavailable');
		this.name = 'LyricsUnavailableError';
	}
}

type LrclibResponse<T> = { status: 'ok'; data: T } | { status: 'not-found' } | { status: 'error' };

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// LRCLIB is often briefly overloaded (503), so a failed request is retried once. Timeouts
// are not retried, as they already took long and the service is likely struggling.
const lrclibRequest = async <T>(
	path: string,
	params: URLSearchParams,
	retriesLeft = 1,
): Promise<LrclibResponse<T>> => {
	const startedAt = Date.now();
	const label = `GET ${path}?${params}`;

	try {
		const response = await fetch(`https://lrclib.net${path}?${params}`, {
			headers: {
				'User-Agent': LRCLIB_USER_AGENT,
			},
			signal: AbortSignal.timeout(LRCLIB_TIMEOUT_MS),
		});

		if (response.status === 404) {
			logRequest('LRCLIB', label, startedAt, { status: 'not-found' });
			return { status: 'not-found' };
		}

		if (!response.ok) {
			logRequest('LRCLIB', label, startedAt, {
				status: 'error',
				httpStatus: response.status,
				retriesLeft,
			});
			if (retriesLeft > 0 && (response.status === 429 || response.status >= 500)) {
				await wait(LRCLIB_RETRY_DELAY_MS);
				return lrclibRequest(path, params, retriesLeft - 1);
			}
			return { status: 'error' };
		}

		const data = (await response.json()) as T;
		logRequest('LRCLIB', label, startedAt, { status: 'ok' });
		return { status: 'ok', data };
	} catch (error) {
		const timedOut = error instanceof DOMException && error.name === 'TimeoutError';
		logRequest('LRCLIB', label, startedAt, {
			status: 'error',
			error: error instanceof Error ? error.message : String(error),
			retriesLeft,
		});
		if (retriesLeft > 0 && !timedOut) {
			await wait(LRCLIB_RETRY_DELAY_MS);
			return lrclibRequest(path, params, retriesLeft - 1);
		}
		return { status: 'error' };
	}
};

const scoreLrclibResult = (result: LrclibResult, title: string, artists: string[]) => {
	const titleScore = stringSim.compareTwoStrings(
		title.toUpperCase(),
		result.trackName.toUpperCase(),
	);

	const artistScore = artists.length
		? Math.max(
				...artists.map((artist) =>
					stringSim.compareTwoStrings(artist.toUpperCase(), result.artistName.toUpperCase()),
				),
			)
		: 0.5;

	return titleScore * 0.6 + artistScore * 0.4;
};

const pickBestLrclibMatch = (
	results: LrclibResult[],
	title: string,
	artistNames: string[],
): string | null => {
	const candidates = results
		.map((result) => {
			const lyricsText = getLrclibLyricsText(result);
			if (!lyricsText || result.instrumental) {
				return null;
			}

			if (!isInstrumentalTitle(title) && isInstrumentalTitle(result.trackName)) {
				return null;
			}

			return {
				lyricsText,
				lineCount: parseLyricsLines(lyricsText).length,
				score: scoreLrclibResult(result, title, artistNames),
			};
		})
		.filter(
			(
				candidate,
			): candidate is {
				lyricsText: string;
				lineCount: number;
				score: number;
			} => candidate !== null && candidate.lineCount >= MIN_LYRIC_LINES,
		)
		.sort((a, b) => b.score - a.score);

	return candidates[0]?.lyricsText ?? null;
};

// Tries LRCLIB's exact lookup first (fast and cheap), and falls back to a fuzzy search
// only when it finds nothing usable.
const getLyricsTextFromLrclib = async (
	title: string,
	artists: string[],
	durationSeconds?: number,
): Promise<string> => {
	return timed('LRCLIB', `getLyricsText("${title}")`, async () => {
		const artistNames = expandArtistNames(artists);
		const primaryArtist = artistNames[0] ?? '';

		if (primaryArtist) {
			const params = new URLSearchParams({ track_name: title, artist_name: primaryArtist });
			if (durationSeconds) {
				// Picks the version closest in length, e.g. the studio recording over a live one.
				params.set('duration', String(durationSeconds));
			}

			const exact = await lrclibRequest<LrclibResult>('/api/get', params);
			if (exact.status === 'error') {
				throw new LyricsUnavailableError();
			}
			if (exact.status === 'ok') {
				const match = pickBestLrclibMatch([exact.data], title, artistNames);
				if (match) {
					return match;
				}
			}
		}

		const search = await lrclibRequest<LrclibResult[]>(
			'/api/search',
			new URLSearchParams({ q: `${primaryArtist} ${title}`.trim() }),
		);
		if (search.status === 'error') {
			throw new LyricsUnavailableError();
		}

		const results = search.status === 'ok' && Array.isArray(search.data) ? search.data : [];
		const match = pickBestLrclibMatch(results, title, artistNames);
		if (!match) {
			throw new Error('Lyrics not found');
		}

		return match;
	});
};

const buildLyricsFromText = (lyricsText: string, metadata: SongMetadata): Lyrics => {
	const lyricsArray = parseLyricsLines(lyricsText);

	if (lyricsArray.length < MIN_LYRIC_LINES) {
		throw new Error('Lyrics not found');
	}

	const maxIndex = lyricsArray.length - MIN_LYRIC_LINES;
	const indexLyrics = Math.floor(Math.random() * (maxIndex + 1));

	const result: Lyrics = {
		firstVerse: lyricsArray[indexLyrics],
		secondVerse: lyricsArray[indexLyrics + 1],
		nextVerses: [lyricsArray[indexLyrics + 2], lyricsArray[indexLyrics + 3]],
		...metadata,
	};

	if (!isValidLyrics(result)) {
		throw new Error('Lyrics not found');
	}

	return result;
};

export const getLyricsForTrack = async (
	title: string,
	queryArtist: string,
	metadata: SongMetadata,
	durationSeconds?: number,
): Promise<Lyrics> => {
	return timed('Lyrics', `getLyricsForTrack("${title}")`, async () => {
		if (isInstrumentalTitle(title)) {
			throw new Error('Lyrics not found');
		}

		// Spotify's artist name first: it matches LRCLIB's data better than what was typed.
		const artistHints = expandArtistNames([
			metadata.songArtist,
			metadata.songArtistNames,
			queryArtist,
		]);

		const searchTitle = getSearchTitle(title);

		const lyricsText = await getLyricsTextFromLrclib(searchTitle, artistHints, durationSeconds);
		return buildLyricsFromText(lyricsText, metadata);
	});
};
