//@ts-nocheck

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

export const getToken = async () => {
	let myHeaders = new Headers();
	myHeaders.append('Authorization', 'Basic ' + btoa(clientId + ':' + clientSecret));
	myHeaders.append('Content-Type', 'application/x-www-form-urlencoded');

	const urlencoded = new URLSearchParams();
	urlencoded.append('grant_type', 'client_credentials');

	const response = await fetch('https://accounts.spotify.com/api/token', {
		method: 'POST',
		headers: myHeaders,
		body: urlencoded,
	});

	if (!response.ok) console.error('STATUS ERROR: ' + response.status);

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

	if (!response.ok) console.error('STATUS ERROR: ' + response.status);

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

	if (!response.ok) console.error('STATUS ERROR: ' + response.status);

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

	if (!response.ok) console.error('STATUS ERROR: ' + response.status);

	const data = await response.json();
	return data;
};

export const getArtistId = async (artistName: string) => {
	const token = await getToken();
	const response = await fetch(
		`https://api.spotify.com/v1/search?query=${artistName}&type=artist&market=PL&locale=pl-PL%2Cpl%3Bq%3D0.9%2Cen-US%3Bq%3D0.8%2Cen%3Bq%3D0.7&offset=0&limit=20`,
		{
			method: 'GET',
			headers: {
				Accept: 'application/json',
				ContentType: 'application/json',
				Authorization: `Bearer ${token.access_token}`,
			},
		}
	);

	if (!response.ok) console.error('STATUS ERROR: ' + response.status);

	const data = await response.json();

	let artists = data.artists.items;

	return artists[0].id;
};

export const getRandomArtistTrack = async (artistName: string) => {
	let artistId = await getArtistId(artistName);

	let albums = await getAllArtistAlbums(artistId);

	albums = albums.items;
	albums = albums.filter((album) => album.album_type == 'album');
	albums = albums.filter((album) => album.album_group == 'album');

	const randomAlbum = albums[Math.floor(Math.random() * albums.length)];

	let tracks = await getAlbumTracks(randomAlbum.id);

	tracks = tracks.items;

	const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];

	return randomTrack.name;
};
