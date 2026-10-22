import { normalize } from '@/utils/text';

// Remembers, per artist, which songs the player saw recently and which songs had no
// lyrics, so the next rounds can avoid them, even after the page is closed.
const MAX_STORED_SONGS = 30;

type ListName = 'seenSongs' | 'noLyricsSongs';

const getStorageKey = (list: ListName, artist: string) =>
	`${list}:${normalize(artist).replace(/^the /, '')}`;

const readList = (list: ListName, artist: string): string[] => {
	try {
		const stored = JSON.parse(localStorage.getItem(getStorageKey(list, artist)) ?? '[]');
		return Array.isArray(stored) ? stored.filter((key) => typeof key === 'string') : [];
	} catch {
		return [];
	}
};

const writeList = (list: ListName, artist: string, keys: string[]) => {
	try {
		localStorage.setItem(
			getStorageKey(list, artist),
			JSON.stringify(keys.slice(-MAX_STORED_SONGS)),
		);
	} catch {
		// Storage can be unavailable (e.g. private mode); repeats are then possible.
	}
};

// Oldest first, so the server can prefer songs seen longest ago.
export const getSeenSongs = (artist: string) => readList('seenSongs', artist);

export const getNoLyricsSongs = (artist: string) => readList('noLyricsSongs', artist);

export const addSeenSong = (artist: string, songKey: string) => {
	writeList('seenSongs', artist, [
		...getSeenSongs(artist).filter((key) => key !== songKey),
		songKey,
	]);
	// Lyrics were found this time, so stop avoiding it.
	writeList(
		'noLyricsSongs',
		artist,
		getNoLyricsSongs(artist).filter((key) => key !== songKey),
	);
};

export const addNoLyricsSongs = (artist: string, songKeys: string[]) => {
	if (!songKeys.length) {
		return;
	}
	writeList('noLyricsSongs', artist, [
		...getNoLyricsSongs(artist).filter((key) => !songKeys.includes(key)),
		...songKeys,
	]);
};
