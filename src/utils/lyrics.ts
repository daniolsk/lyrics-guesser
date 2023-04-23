import Genius from 'genius-lyrics';

const Client = new Genius.Client();

export const getLyrics = async (title: string, artist?: string) => {
	const songs = await Client.songs.search(title + ' ' + (artist ? artist : ''));

	const songTitle = songs[0].title;
	const songImageArt = songs[0].raw.song_art_image_url;
	const songImage = songs[0].image;
	const songArtist = songs[0].artist.name;

	// console.log(songs);

	const lyrics = await songs[0].lyrics();
	const lyricsArray = lyrics.split('\n').filter((l: string) => l.length && l[0] !== '[');
	const indexLyrics = Math.floor(Math.random() * (lyricsArray.length - 1));

	return {
		firstVerse: lyricsArray[indexLyrics],
		secondVerse: lyricsArray[indexLyrics + 1],
		songTitle,
		songImage,
		songArtist,
		songImageArt,
	};
};
