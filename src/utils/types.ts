export interface Song extends Lyrics {
	previewUrl: string;
	url: string;
	id: string;
}

export type Lyrics = {
	firstVerse: string;
	secondVerse: string;
	nextVerses: string[];
	songTitle: string;
	songImage: string;
	songArtist: string;
	songArtistNames: string;
};

export type Album = {
	name: string;
	releaseDate: string;
	artist: string;
	url: string;
	id: string;
	totalTracks: number;
	tracks: any;
	image: string;
};
