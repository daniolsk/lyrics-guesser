export interface Song extends Lyrics {
	previewUrl: string | null;
	url: string;
	id: string;
	// Version-independent song identifier, used to avoid repeating songs.
	songKey: string;
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
