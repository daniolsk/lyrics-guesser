const Genius = require('genius-lyrics');

import stringSim from 'string-similarity';

import { logRequest, timed } from '@/utils/requestLog';
import { Lyrics } from '@/utils/types';

const Client = new Genius.Client(process.env.GENIUS_SECRET as string);

const MIN_LYRIC_LINES = 4;
const LRCLIB_TIMEOUT_MS = 12_000;
const LRCLIB_USER_AGENT =
	'lyrics-guesser/0.1.0 (https://guessthesong.vercel.app)';

const isInstrumentalTitle = (title: string) =>
	title.toLowerCase().includes('instrumental');

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
		.filter(
			(line) =>
				line.length > 0 &&
				line[0] !== '[' &&
				!/^\d+\s+Contributors/i.test(line)
		);
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

const searchLrclib = async (params: URLSearchParams): Promise<LrclibResult[]> => {
	const startedAt = Date.now();
	const label = `GET /api/search?${params}`;
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), LRCLIB_TIMEOUT_MS);

	try {
		const response = await fetch(`https://lrclib.net/api/search?${params}`, {
			headers: {
				'User-Agent': LRCLIB_USER_AGENT,
			},
			signal: controller.signal,
		});

		if (!response.ok) {
			logRequest('LRCLIB', label, startedAt, {
				status: 'error',
				httpStatus: response.status,
				results: 0,
			});
			return [];
		}

		const results = (await response.json()) as LrclibResult[];
		const items = Array.isArray(results) ? results : [];
		logRequest('LRCLIB', label, startedAt, {
			status: 'ok',
			results: items.length,
		});
		return items;
	} catch (error) {
		logRequest('LRCLIB', label, startedAt, {
			status: 'error',
			error: error instanceof Error ? error.message : String(error),
			results: 0,
		});
		return [];
	} finally {
		clearTimeout(timeout);
	}
};

const scoreLrclibResult = (result: LrclibResult, title: string, artists: string[]) => {
	const titleScore = stringSim.compareTwoStrings(
		title.toUpperCase(),
		result.trackName.toUpperCase()
	);

	const artistScore = artists.length
		? Math.max(
				...artists.map((artist) =>
					stringSim.compareTwoStrings(
						artist.toUpperCase(),
						result.artistName.toUpperCase()
					)
				)
			)
		: 0.5;

	return titleScore * 0.6 + artistScore * 0.4;
};

const pickBestLrclibMatch = (
	results: LrclibResult[],
	title: string,
	artistNames: string[]
): string | null => {
	const candidates = results
		.map((result) => {
			const lyricsText = getLrclibLyricsText(result);
			if (!lyricsText || result.instrumental) {
				return null;
			}

			if (
				!isInstrumentalTitle(title) &&
				isInstrumentalTitle(result.trackName)
			) {
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
				candidate
			): candidate is {
				lyricsText: string;
				lineCount: number;
				score: number;
			} => candidate !== null && candidate.lineCount >= MIN_LYRIC_LINES
		)
		.sort((a, b) => b.score - a.score);

	return candidates[0]?.lyricsText ?? null;
};

const getLyricsTextFromLrclib = async (
	title: string,
	artists: string[] = []
): Promise<string> => {
	return timed('LRCLIB', `getLyricsText("${title}")`, async () => {
		const artistNames = expandArtistNames(artists);
		const primaryArtist = artistNames[0] ?? '';

		const resultSets = await Promise.all([
			searchLrclib(new URLSearchParams({ q: `${primaryArtist} ${title}` })),
			primaryArtist
				? searchLrclib(
						new URLSearchParams({
							track_name: title,
							artist_name: primaryArtist,
						})
					)
				: Promise.resolve([]),
		]);

		const resultsById = new Map<number, LrclibResult>();
		for (const resultSet of resultSets) {
			for (const result of resultSet) {
				resultsById.set(result.id, result);
			}
		}

		const match = pickBestLrclibMatch(
			Array.from(resultsById.values()),
			title,
			artistNames
		);

		if (!match) {
			throw new Error('Lyrics not found');
		}

		return match;
	});
};

const buildLyricsFromText = (
	lyricsText: string,
	metadata: SongMetadata
): Lyrics => {
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

const getGeniusLyrics = async (
	title: string,
	queryArtist: string,
	metadata: SongMetadata
): Promise<Lyrics | null> => {
	const startedAt = Date.now();

	try {
		const searchStartedAt = Date.now();
		const songs = await Client.songs.search(`${title} ${queryArtist}`);
		logRequest('Genius', `search("${title}" "${queryArtist}")`, searchStartedAt, {
			status: 'ok',
			results: songs?.length ?? 0,
		});

		if (!songs?.length) {
			return null;
		}

		const songTitle = songs[0].title.replace(/(^[\s\u200b]*|[\s\u200b]*$)/g, '');
		const songImage = songs[0]._raw.song_art_image_url;
		const songArtist = songs[0].artist.name;
		const songArtistNames = songs[0]._raw.artist_names;

		if (
			isInstrumentalTitle(songTitle) ||
			!songTitle ||
			!songArtist ||
			!songArtistNames
		) {
			logRequest('Genius', `getLyrics("${songTitle}")`, startedAt, {
				status: 'error',
				error: 'incomplete metadata',
			});
			return null;
		}

		const lyricsStartedAt = Date.now();
		const lyricsText = await songs[0].lyrics();
		logRequest('Genius', `getLyrics("${songTitle}")`, lyricsStartedAt, {
			status: 'ok',
			lines: parseLyricsLines(lyricsText).length,
		});

		if (parseLyricsLines(lyricsText).length < MIN_LYRIC_LINES) {
			return null;
		}

		logRequest('Genius', `fallback("${title}")`, startedAt, { status: 'ok' });
		return buildLyricsFromText(lyricsText, {
			songTitle,
			songImage: metadata.songImage || songImage,
			songArtist,
			songArtistNames,
		});
	} catch (error) {
		logRequest('Genius', `fallback("${title}")`, startedAt, {
			status: 'error',
			error: error instanceof Error ? error.message : String(error),
		});
		return null;
	}
};

export const getLyricsForTrack = async (
	title: string,
	queryArtist: string,
	metadata: SongMetadata
): Promise<Lyrics> => {
	return timed('Lyrics', `getLyricsForTrack("${title}")`, async () => {
		if (isInstrumentalTitle(title)) {
			throw new Error('Lyrics not found');
		}

		const artistHints = expandArtistNames([
			queryArtist,
			metadata.songArtist,
			metadata.songArtistNames,
		]);

		try {
			const lyricsText = await getLyricsTextFromLrclib(title, artistHints);
			return buildLyricsFromText(lyricsText, metadata);
		} catch {
			// Genius scrapes HTML and is often blocked from Vercel — use only as fallback.
		}

		if (process.env.VERCEL !== '1') {
			const geniusLyrics = await getGeniusLyrics(title, queryArtist, metadata);
			if (geniusLyrics) {
				return geniusLyrics;
			}
		}

		throw new Error('Lyrics not found');
	});
};

/** @deprecated Use getLyricsForTrack with Spotify metadata */
export const getLyrics = async (title: string, artist?: string): Promise<Lyrics> => {
	try {
		const lyricsText = await getLyricsTextFromLrclib(title, [artist ?? '']);
		return buildLyricsFromText(lyricsText, {
			songTitle: title,
			songImage: '',
			songArtist: artist ?? '',
			songArtistNames: artist ?? '',
		});
	} catch {
		// Genius scrapes HTML and is often blocked from Vercel — use only as fallback.
	}

	if (process.env.VERCEL !== '1') {
		const geniusLyrics = await getGeniusLyrics(title, artist ?? '', {
			songTitle: title,
			songImage: '',
			songArtist: artist ?? '',
			songArtistNames: artist ?? '',
		});

		if (geniusLyrics) {
			return geniusLyrics;
		}
	}

	throw new Error('Lyrics not found');
};
