import { Song } from '@/utils/types';
import { addNoLyricsSongs, getNoLyricsSongs, getSeenSongs } from '@/utils/seenSongs';
import { updateSongsPlayed } from '@/components/ui/Footer';

export const DEFAULT_ERROR = 'Something went wrong on our side. Try again in a moment.';
const CONNECTION_ERROR = "Couldn't reach the server. Check your internet connection and try again.";
const TIMEOUT_ERROR = 'Finding a song took too long. Try again.';
const RATE_LIMIT_ERROR = "You're going a bit too fast. Wait a minute and try again.";

export const requestSong = async (
	artist: string,
	market: string | undefined,
	signal?: AbortSignal,
): Promise<{ song: Song } | { error: string }> => {
	const params = new URLSearchParams({ artist });
	if (market) {
		params.set('market', market);
	}
	const seenSongs = getSeenSongs(artist);
	if (seenSongs.length) {
		params.set('seen', seenSongs.join(','));
	}
	const noLyricsSongs = getNoLyricsSongs(artist);
	if (noLyricsSongs.length) {
		params.set('noLyrics', noLyricsSongs.join(','));
	}

	let response: Response;
	try {
		response = await fetch(`/api/guess?${params.toString()}`, { signal });
	} catch {
		return { error: CONNECTION_ERROR };
	}

	// Timeouts and crashes from the hosting platform may not return JSON.
	const data = await response.json().catch(() => null);

	if (Array.isArray(data?.noLyricsSongs)) {
		addNoLyricsSongs(artist, data.noLyricsSongs);
	}

	if (response.ok && data?.song) {
		if (typeof data.songsPlayed === 'number') {
			updateSongsPlayed(data.songsPlayed);
		}
		return { song: data.song };
	}

	if (data?.error) {
		return { error: data.error };
	}

	// The Vercel Firewall rate limit answers with 429 before the request reaches our API.
	if (response.status === 429) {
		return { error: RATE_LIMIT_ERROR };
	}

	return { error: response.status === 504 ? TIMEOUT_ERROR : DEFAULT_ERROR };
};
