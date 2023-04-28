//@ts-nocheck

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

export const getUserToken = async (refresh_token) => {
	const response = await fetch('https://accounts.spotify.com/api/token', {
		method: 'POST',
		headers: {
			Authorization: `Basic ` + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: new URLSearchParams({
			grant_type: 'refresh_token',
			refresh_token,
		}),
	});

	const data = await response.json();

	return data.access_token;
};

export const getUsersPlaylists = async (refresh_token) => {
	const access_token = await getUserToken(refresh_token);

	const response = await fetch('https://api.spotify.com/v1/me/playlists', {
		headers: {
			Authorization: `Bearer ${access_token}`,
		},
	});

	if (!response.ok) console.error('ERROR: Request failed with status: ' + response.status);

	const data = await response.json();

	return data.items;
};

export const getToken = async () => {
	let myHeaders = new Headers();
	myHeaders.append('Authorization', 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'));
	myHeaders.append('Content-Type', 'application/x-www-form-urlencoded');

	const urlencoded = new URLSearchParams();
	urlencoded.append('grant_type', 'client_credentials');

	const response = await fetch('https://accounts.spotify.com/api/token', {
		method: 'POST',
		headers: myHeaders,
		body: urlencoded,
	});

	if (!response.ok) console.error('ERROR: Request failed' + response.status);

	const data = await response.json();

	return data;
};

export const getArtist = async (artistId: string) => {
	const token = await getToken();

	const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
		method: 'GET',
		headers: {
			Accept: 'application/json',
			ContentType: 'application/json',
			Authorization: `Bearer ${token.access_token}`,
		},
	});

	if (!response.ok) console.error('ERROR: Request failed' + response.status);

	const data = await response.json();
	return data;
};

export const getAllArtistAlbums = async (artistId: string) => {
	const token = await getToken();

	const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/albums?limit=50`, {
		method: 'GET',
		headers: {
			Accept: 'application/json',
			ContentType: 'application/json',
			Authorization: `Bearer ${token.access_token}`,
		},
	});

	if (!response.ok) console.error('ERROR: Request failed with status: ' + response.status);

	const data = await response.json();
	return data;
};

export const getAlbumTracks = async (albumId: string) => {
	const token = await getToken();
	const response = await fetch(`https://api.spotify.com/v1/albums/${albumId}/tracks`, {
		method: 'GET',
		headers: {
			Accept: 'application/json',
			ContentType: 'application/json',
			Authorization: `Bearer ${token.access_token}`,
		},
	});

	if (!response.ok) console.error('ERROR: Request failed' + response.status);

	const data = await response.json();
	return data;
};

export const getArtistId = async (artistName: string, market?: string) => {
	const token = await getToken();
	const response = await fetch(
		`https://api.spotify.com/v1/search?query=${artistName}&type=artist${
			market ? `&market=${market}` : ''
		}&locale=pl-PL%2Cpl%3Bq%3D0.9%2Cen-US%3Bq%3D0.8%2Cen%3Bq%3D0.7&offset=0&limit=20`,
		{
			method: 'GET',
			headers: {
				Accept: 'application/json',
				ContentType: 'application/json',
				Authorization: `Bearer ${token.access_token}`,
			},
		}
	);

	if (!response.ok) console.error('ERROR: Request failed' + response.status);

	const data = await response.json();

	let artists = data.artists.items;

	return artists[0].id;
};

export const getRandomArtistTrack = async (artistName: string, market?: string) => {
	let artistId;
	try {
		artistId = await getArtistId(artistName, market);
	} catch (error) {
		throw new Error(`Spotify: artist: "${artistName}" not found`);
	}

	let albums;

	try {
		albums = await getAllArtistAlbums(artistId);
	} catch (error) {
		throw new Error(`Spotify: artist with id "${artistId}" - albums not found`);
	}

	albums = albums.items;
	albums = albums.filter((album) => album.album_type == 'album');
	albums = albums.filter((album) => album.album_group == 'album');

	const randomAlbum = albums[Math.floor(Math.random() * albums.length)];

	let tracks;

	try {
		tracks = await getAlbumTracks(randomAlbum.id);
	} catch (error) {
		throw new Error(`Spotify: tracks of album ${randomAlbum.name} not found`);
	}

	tracks = tracks.items;

	const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];

	return { randomTrack: randomTrack.name, previewUrl: randomTrack.preview_url, url: randomTrack.external_urls.spotify };
};
