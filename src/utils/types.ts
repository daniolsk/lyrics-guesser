export interface Song extends Lyrics {
	previewUrl: string | null;
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
