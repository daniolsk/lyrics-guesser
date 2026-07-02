const Genius = require('genius-lyrics');

import stringSim from 'string-similarity';

import { Lyrics } from '@/utils/types';

const Client = new Genius.Client(process.env.GENIUS_SECRET as string);

const MIN_LYRIC_LINES = 4;
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
		.filter((line) => line.length > 0 && line[0] !== '[');
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
	const response = await fetch(`https://lrclib.net/api/search?${params}`, {
		headers: {
			'User-Agent': LRCLIB_USER_AGENT,
		},
	});

	if (!response.ok) {
		return [];
	}

	const results = (await response.json()) as LrclibResult[];
	return Array.isArray(results) ? results : [];
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

const getLyricsTextFromLrclib = async (
	title: string,
	artists: string[] = []
): Promise<string> => {
	const artistNames = expandArtistNames(artists);
	const searches: Promise<LrclibResult[]>[] = [];

	for (const artist of artistNames) {
		searches.push(
			searchLrclib(
				new URLSearchParams({
					track_name: title,
					artist_name: artist,
				})
			)
		);
		searches.push(searchLrclib(new URLSearchParams({ q: `${artist} ${title}` })));
	}

	searches.push(searchLrclib(new URLSearchParams({ track_name: title })));
	searches.push(searchLrclib(new URLSearchParams({ q: title })));

	const resultSets = await Promise.all(searches);
	const resultsById = new Map<number, LrclibResult>();

	for (const resultSet of resultSets) {
		for (const result of resultSet) {
			resultsById.set(result.id, result);
		}
	}

	const candidates = Array.from(resultsById.values())
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

	if (!candidates.length) {
		throw new Error('Lyrics not found');
	}

	return candidates[0].lyricsText;
};

const buildLyricsFromText = (
	lyricsText: string,
	metadata: {
		songTitle: string;
		songImage: string;
		songArtist: string;
		songArtistNames: string;
	}
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

export const getLyrics = async (title: string, artist?: string): Promise<Lyrics> => {
	if (isInstrumentalTitle(title)) {
		throw new Error('Lyrics not found');
	}

	let songs;
	try {
		songs = await Client.songs.search(title + ' ' + (artist ? artist : ''));
	} catch (error) {
		console.error(
			`Genius: metadata for artist: "${artist}" and track: "${title}" not found`,
			error
		);
		throw new Error('Lyrics not found');
	}

	if (!songs?.length) {
		console.error(
			`Genius: no search results for artist: "${artist}" and track: "${title}"`
		);
		throw new Error('Lyrics not found');
	}

	const songTitle = songs[0].title.replace(/(^[\s\u200b]*|[\s\u200b]*$)/g, '');
	const songImage = songs[0]._raw.song_art_image_url;
	const songArtist = songs[0].artist.name;
	const songArtistNames = songs[0]._raw.artist_names;

	if (isInstrumentalTitle(songTitle)) {
		throw new Error('Lyrics not found');
	}

	if (!songTitle || !songImage || !songArtist || !songArtistNames) {
		console.error(
			`Genius: incomplete metadata for artist: "${artist}" and track: "${title}"`
		);
		throw new Error('Lyrics not found');
	}

	let lyricsText: string;
	try {
		lyricsText = await getLyricsTextFromLrclib(title, [
			artist,
			songArtist,
			songArtistNames,
		]);
	} catch (error) {
		console.error(
			`LRCLIB: lyrics for artist: "${artist}" and track: "${title}" not found`,
			error
		);
		throw new Error('Lyrics not found');
	}

	return buildLyricsFromText(lyricsText, {
		songTitle,
		songImage,
		songArtist,
		songArtistNames,
	});
};
