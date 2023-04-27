import Genius from 'genius-lyrics';

const Client = new Genius.Client();

export const getLyrics = async (title: string, artist?: string) => {
	let songs;
	try {
		songs = await Client.songs.search(title + ' ' + (artist ? artist : ''));
	} catch (error) {
		throw new Error(`Genius: lyrics for artist: "${artist}" and track: "${title}" not found`);
	}

	const songTitle = songs[0].title.replace(/(^[\s\u200b]*|[\s\u200b]*$)/g, '');
	const songImageArt = songs[0].raw.song_art_image_url;
	const songImage = songs[0].image;
	const songArtist = songs[0].artist.name;

	const lyrics = await songs[0].lyrics();
	const lyricsArray = lyrics.split('\n').filter((l: string) => l.length && l[0] !== '[');
	const indexLyrics = Math.floor(Math.random() * (lyricsArray.length - 3));

	return {
		firstVerse: lyricsArray[indexLyrics],
		secondVerse: lyricsArray[indexLyrics + 1],
		nextVerses: [lyricsArray[indexLyrics + 2], lyricsArray[indexLyrics + 3]],
		songTitle,
		songImage,
		songArtist,
		songImageArt,
	};
};
