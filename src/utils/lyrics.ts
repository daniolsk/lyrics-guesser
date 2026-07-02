const Genius = require('genius-lyrics');

import { Lyrics } from '@/utils/types';

const Client = new Genius.Client(process.env.GENIUS_SECRET as string);

const MIN_LYRIC_LINES = 4;

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

export const getLyrics = async (title: string, artist?: string): Promise<Lyrics> => {
	let songs;
	try {
		songs = await Client.songs.search(title + ' ' + (artist ? artist : ''));
	} catch (error) {
		console.error(
			`Genius: lyrics for artist: "${artist}" and track: "${title}" not found`
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

	const lyrics = await songs[0].lyrics();
	const lyricsArray = lyrics
		.split('\n')
		.filter((l: string) => l.length && l[0] !== '[');

	if (lyricsArray.length < MIN_LYRIC_LINES) {
		console.error(
			`Genius: not enough lyric lines for artist: "${artist}" and track: "${title}"`
		);
		throw new Error('Lyrics not found');
	}

	const maxIndex = lyricsArray.length - MIN_LYRIC_LINES;
	const indexLyrics = Math.floor(Math.random() * (maxIndex + 1));

	const result: Lyrics = {
		firstVerse: lyricsArray[indexLyrics],
		secondVerse: lyricsArray[indexLyrics + 1],
		nextVerses: [lyricsArray[indexLyrics + 2], lyricsArray[indexLyrics + 3]],
		songTitle,
		songImage,
		songArtist,
		songArtistNames,
	};

	if (!isValidLyrics(result)) {
		console.error(
			`Genius: incomplete lyrics for artist: "${artist}" and track: "${title}"`
		);
		throw new Error('Lyrics not found');
	}

	return result;
};
