import { UserFacingError } from '@/utils/errors';
import { getSongKey } from '@/utils/matchTitle';
import { logRequest, timed } from '@/utils/requestLog';
import { levenshtein, normalize } from '@/utils/text';

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

type Album = {
	album_type: string;
	album_group: string;
	name: string;
	total_tracks: number;
	release_date: string;
	id: string;
	external_urls: { spotify: string };
	images: { url: string }[];
};

type Track = {
	name: string;
	preview_url: string | null;
	id: string;
	external_urls: { spotify: string };
	artists?: { name: string }[];
};

export type TrackResult = {
	randomTrack: string;
	songKey: string;
	previewUrl: string | null;
	url: string;
	id: string;
	albumImage: string;
	artistName: string;
	artistNames: string;
};

export type ArtistContext = {
	artistId: string;
	artistName: string;
	albums: Album[];
	albumTracks: Map<string, Promise<Track[]>>;
	// Songs the player saw recently, mapped to their order (0 = seen longest ago).
	seenSongs: Map<string, number>;
	// Songs we failed to find lyrics for before; picked only when nothing else is left.
	noLyricsSongs: Set<string>;
	// Songs already picked during this request, never picked twice.
	triedSongs: Set<string>;
};

export type SongHistory = {
	seen: string[];
	noLyrics: string[];
};

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

const isInstrumentalTrack = (trackName: string) => trackName.toLowerCase().includes('instrumental');

const MAX_ALBUMS_TO_SEARCH = 4;

const pickRandom = <T>(items: T[]) => items[Math.floor(Math.random() * items.length)];

const shuffle = <T>(items: T[]) => {
	const shuffled = [...items];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
};

const toTrackResult = (track: Track, album: Album, fallbackArtistName: string): TrackResult => ({
	randomTrack: track.name,
	songKey: getSongKey(track.name),
	previewUrl: track.preview_url ?? null,
	url: track.external_urls.spotify,
	id: track.id,
	albumImage: album.images[0]?.url ?? '',
	artistName: track.artists?.[0]?.name ?? fallbackArtistName,
	artistNames: track.artists?.map((artist) => artist.name).join(', ') ?? fallbackArtistName,
});

const getAccessToken = async (): Promise<string> => {
	const startedAt = Date.now();
	const now = Date.now();
	if (cachedToken && now < cachedToken.expiresAt - 60_000) {
		logRequest('Spotify', 'POST /api/token (cached)', startedAt, { status: 'ok' });
		return cachedToken.accessToken;
	}

	const response = await fetch('https://accounts.spotify.com/api/token', {
		method: 'POST',
		headers: {
			Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: new URLSearchParams({ grant_type: 'client_credentials' }),
	});

	if (!response.ok) {
		logRequest('Spotify', 'POST /api/token', startedAt, {
			status: 'error',
			httpStatus: response.status,
		});
		throw new Error(`Spotify token request failed: ${response.status}`);
	}

	const data = await response.json();
	cachedToken = {
		accessToken: data.access_token,
		expiresAt: now + data.expires_in * 1000,
	};

	logRequest('Spotify', 'POST /api/token', startedAt, { status: 'ok' });
	return cachedToken.accessToken;
};

class SpotifyRequestError extends Error {
	constructor(
		readonly status: number,
		url: string,
	) {
		super(`Spotify request failed: ${status} ${url}`);
		this.name = 'SpotifyRequestError';
	}
}

const spotifyFetch = async <T>(url: string): Promise<T> => {
	const path = url.replace('https://api.spotify.com', '');
	return timed('Spotify', `GET ${path}`, async () => {
		const token = await getAccessToken();
		const response = await fetch(url, {
			headers: {
				Accept: 'application/json',
				Authorization: `Bearer ${token}`,
			},
		});

		if (response.status === 429) {
			throw new UserFacingError(
				'Too many people are playing right now. Wait a moment and try again.',
				503,
			);
		}

		if (!response.ok) {
			throw new SpotifyRequestError(response.status, url);
		}

		return response.json();
	});
};

const filterAlbums = (albums: Album[]) =>
	albums.filter(
		(album) =>
			album.total_tracks > 1 &&
			album.album_type === 'album' &&
			album.album_group === 'album' &&
			!album.name.toLowerCase().includes('instrumental'),
	);

export const getAllArtistAlbums = async (artistId: string) => {
	const data = await spotifyFetch<{ items: Album[] }>(
		`https://api.spotify.com/v1/artists/${artistId}/albums?limit=50`,
	);
	return data.items;
};

export const getAlbumTracks = async (albumId: string) => {
	const data = await spotifyFetch<{ items: Track[] }>(
		`https://api.spotify.com/v1/albums/${albumId}/tracks`,
	);
	return data.items;
};

const ARTIST_SEARCH_LIMIT = 5;
// Share of characters that may differ between the typed and the found name,
// so typos like "Eminme" still match Eminem.
const ARTIST_NAME_MAX_DIFFERENCE = 0.34;
const ARTIST_NAME_MIN_PARTIAL_LENGTH = 3;

const compactArtistName = (name: string) => normalize(name).replace(/^the /, '').replace(/ /g, '');

// Spotify search always returns its closest match, even for gibberish, so
// reject artists whose name looks nothing like what the player typed.
const isSimilarArtistName = (query: string, name: string) => {
	const a = compactArtistName(query);
	const b = compactArtistName(name);

	if (!a || !b) {
		return a === b;
	}

	if (
		Math.min(a.length, b.length) >= ARTIST_NAME_MIN_PARTIAL_LENGTH &&
		(a.includes(b) || b.includes(a))
	) {
		return true;
	}

	const maxDifference = Math.max(
		1,
		Math.floor(Math.max(a.length, b.length) * ARTIST_NAME_MAX_DIFFERENCE),
	);
	return levenshtein(a, b) <= maxDifference;
};

export const prepareArtistContext = async (
	artistName: string,
	market?: string,
	history: SongHistory = { seen: [], noLyrics: [] },
): Promise<ArtistContext> => {
	return timed('Spotify', `prepareArtistContext("${artistName}")`, async () => {
		const data = await spotifyFetch<{
			artists: { items: { id: string; name: string }[] };
		}>(
			`https://api.spotify.com/v1/search?query=${encodeURIComponent(artistName)}&type=artist${
				market ? `&market=${encodeURIComponent(market)}` : ''
			}&limit=${ARTIST_SEARCH_LIMIT}`,
		).catch((error) => {
			if (market && error instanceof SpotifyRequestError && error.status === 400) {
				throw new UserFacingError(
					`"${market}" isn't a valid country code. Use a two-letter code like PL or US, or leave it empty.`,
					400,
				);
			}
			throw error;
		});

		// Names typed in another script (e.g. "Кино" for Kino) can't be compared
		// letter by letter, so trust Spotify's top result for them.
		const isLatinQuery = /[a-z]/.test(normalize(artistName));
		const artist =
			data.artists.items.find((item) => isSimilarArtistName(artistName, item.name)) ??
			(isLatinQuery ? undefined : data.artists.items[0]);
		if (!artist) {
			throw new UserFacingError(
				`We couldn't find an artist called "${artistName}". Check the spelling and try again.`,
				404,
			);
		}

		const albums = filterAlbums(await getAllArtistAlbums(artist.id));
		if (!albums.length) {
			throw new UserFacingError(
				`${artist.name} doesn't have any albums we can pick songs from. Try another artist.`,
				404,
			);
		}

		return {
			artistId: artist.id,
			artistName: artist.name,
			albums,
			albumTracks: new Map(),
			seenSongs: new Map(history.seen.map((key, index) => [key, index])),
			noLyricsSongs: new Set(history.noLyrics),
			triedSongs: new Set(),
		};
	});
};

const getCachedAlbumTracks = (context: ArtistContext, albumId: string) => {
	let tracks = context.albumTracks.get(albumId);
	if (!tracks) {
		tracks = getAlbumTracks(albumId);
		context.albumTracks.set(albumId, tracks);
	}
	return tracks;
};

// Lower is better: unseen songs first, then songs seen longest ago, then songs that
// had no lyrics before (lyrics may have been added since).
const getTrackRank = (context: ArtistContext, songKey: string) => {
	if (context.noLyricsSongs.has(songKey)) {
		return context.seenSongs.size + 1;
	}
	return context.seenSongs.get(songKey) ?? -1;
};

// Picks a random track the player hasn't seen recently. Looks through a few random
// albums; once every song there was seen, picks the one seen longest ago instead.
export const getRandomTrackFromContext = async (context: ArtistContext): Promise<TrackResult> => {
	return timed('Spotify', 'getRandomTrackFromContext', async () => {
		const albums = shuffle(context.albums).slice(0, MAX_ALBUMS_TO_SEARCH);
		const candidates: { track: Track; album: Album; songKey: string; rank: number }[] = [];

		for (const album of albums) {
			for (const track of await getCachedAlbumTracks(context, album.id)) {
				const songKey = getSongKey(track.name);
				if (isInstrumentalTrack(track.name) || context.triedSongs.has(songKey)) {
					continue;
				}
				candidates.push({ track, album, songKey, rank: getTrackRank(context, songKey) });
			}

			// Stop early once there are unseen songs to pick from.
			if (candidates.some((candidate) => candidate.rank === -1)) {
				break;
			}
		}

		// Another attempt may have picked a song while we were waiting for track lists.
		const available = candidates.filter((candidate) => !context.triedSongs.has(candidate.songKey));
		if (!available.length) {
			throw new Error('No playable tracks found');
		}

		const bestRank = Math.min(...available.map((candidate) => candidate.rank));
		const picked = pickRandom(available.filter((candidate) => candidate.rank === bestRank));
		context.triedSongs.add(picked.songKey);

		return toTrackResult(picked.track, picked.album, context.artistName);
	});
};
