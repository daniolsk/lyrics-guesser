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
};

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

const isInstrumentalTrack = (trackName: string) =>
	trackName.toLowerCase().includes('instrumental');

const pickRandomTrack = (tracks: Track[]) => {
	const playableTracks = tracks.filter((track) => !isInstrumentalTrack(track.name));

	if (!playableTracks.length) {
		throw new Error('No playable tracks found');
	}

	return playableTracks[Math.floor(Math.random() * playableTracks.length)];
};

const toTrackResult = (
	track: Track,
	album: Album,
	fallbackArtistName: string
): TrackResult => ({
	randomTrack: track.name,
	previewUrl: track.preview_url ?? null,
	url: track.external_urls.spotify,
	id: track.id,
	albumImage: album.images[0]?.url ?? '',
	artistName: track.artists?.[0]?.name ?? fallbackArtistName,
	artistNames: track.artists?.map((artist) => artist.name).join(', ') ?? fallbackArtistName,
});

const getAccessToken = async (): Promise<string> => {
	const now = Date.now();
	if (cachedToken && now < cachedToken.expiresAt - 60_000) {
		return cachedToken.accessToken;
	}

	const response = await fetch('https://accounts.spotify.com/api/token', {
		method: 'POST',
		headers: {
			Authorization:
				'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: new URLSearchParams({ grant_type: 'client_credentials' }),
	});

	if (!response.ok) {
		throw new Error(`Spotify token request failed: ${response.status}`);
	}

	const data = await response.json();
	cachedToken = {
		accessToken: data.access_token,
		expiresAt: now + data.expires_in * 1000,
	};

	return cachedToken.accessToken;
};

const spotifyFetch = async <T>(url: string): Promise<T> => {
	const token = await getAccessToken();
	const response = await fetch(url, {
		headers: {
			Accept: 'application/json',
			Authorization: `Bearer ${token}`,
		},
	});

	if (!response.ok) {
		throw new Error(`Spotify request failed: ${response.status} ${url}`);
	}

	return response.json();
};

const filterAlbums = (albums: Album[]) =>
	albums.filter(
		(album) =>
			album.total_tracks > 1 &&
			album.album_type === 'album' &&
			album.album_group === 'album' &&
			!album.name.toLowerCase().includes('instrumental')
	);

export const getArtist = async (artistId: string) => {
	return spotifyFetch(`https://api.spotify.com/v1/artists/${artistId}`);
};

export const getAllArtistAlbums = async (artistId: string) => {
	const data = await spotifyFetch<{ items: Album[] }>(
		`https://api.spotify.com/v1/artists/${artistId}/albums?limit=50`
	);
	return data.items;
};

export const getAlbumTracks = async (albumId: string) => {
	const data = await spotifyFetch<{ items: Track[] }>(
		`https://api.spotify.com/v1/albums/${albumId}/tracks`
	);
	return data.items;
};

export const getArtistId = async (artistName: string, market?: string) => {
	const data = await spotifyFetch<{
		artists: { items: { id: string; name: string }[] };
	}>(
		`https://api.spotify.com/v1/search?query=${encodeURIComponent(artistName)}&type=artist${
			market ? `&market=${market}` : ''
		}&limit=1`
	);

	const artist = data.artists.items[0];
	if (!artist) {
		throw new Error(`Artist not found: ${artistName}`);
	}

	return artist.id;
};

export const prepareArtistContext = async (
	artistName: string,
	market?: string
): Promise<ArtistContext> => {
	const data = await spotifyFetch<{
		artists: { items: { id: string; name: string }[] };
	}>(
		`https://api.spotify.com/v1/search?query=${encodeURIComponent(artistName)}&type=artist${
			market ? `&market=${market}` : ''
		}&limit=1`
	);

	const artist = data.artists.items[0];
	if (!artist) {
		throw new Error(`Artist not found: ${artistName}`);
	}

	const albums = filterAlbums(await getAllArtistAlbums(artist.id));
	if (!albums.length) {
		throw new Error(`No albums found for artist: ${artistName}`);
	}

	return {
		artistId: artist.id,
		artistName: artist.name,
		albums,
	};
};

export const getRandomTrackFromContext = async (
	context: ArtistContext
): Promise<TrackResult> => {
	const randomAlbum = context.albums[Math.floor(Math.random() * context.albums.length)];
	const tracks = await getAlbumTracks(randomAlbum.id);
	const randomTrack = pickRandomTrack(tracks);

	return toTrackResult(randomTrack, randomAlbum, context.artistName);
};

/** @deprecated Use prepareArtistContext + getRandomTrackFromContext */
export const getAppToken = async () => {
	const accessToken = await getAccessToken();
	return { access_token: accessToken, expires_in: 3600 };
};

/** @deprecated Use prepareArtistContext + getRandomTrackFromContext */
export const getRandomArtistTrack = async (
	artistName: string,
	market?: string
) => {
	const context = await prepareArtistContext(artistName, market);
	return getRandomTrackFromContext(context);
};
