const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

type Album = {
	album_type: string;
	album_group: string;
	id: string;
};

type Track = {
	name: string;
	preview_url: string;
	id: string;
	external_urls: { spotify: string };
};

type Artist = {
	name: string;
	id: string;
};

export const getUserToken = async (refresh_token: string) => {
	try {
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
	} catch (error) {
		throw new Error('ERROR AT API CALL: getUserToken', { cause: error });
	}
};

export const getUsersPlaylists = async (refresh_token: string) => {
	try {
		const access_token = await getUserToken(refresh_token);

		const response = await fetch('https://api.spotify.com/v1/me/playlists', {
			headers: {
				Authorization: `Bearer ${access_token}`,
			},
		});

		if (!response.ok) console.error('ERROR: Request failed with status: ' + response.status);

		const data = await response.json();

		return data.items;
	} catch (error) {
		throw new Error('ERROR AT API CALL: getUsersPlaylist', { cause: error });
	}
};

export const getPlaylistTracks = async (refresh_token: string, playlistId: string) => {
	try {
		const access_token = await getUserToken(refresh_token);

		const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}?additional_types=track`, {
			headers: {
				Authorization: `Bearer ${access_token}`,
			},
		});

		if (!response.ok) console.error('ERROR: Request failed with status: ' + response.status);

		const data = await response.json();

		return data.tracks;
	} catch (error) {
		throw new Error('ERROR AT API CALL: getPlaylistTracks', { cause: error });
	}
};

export const getUsersTopItems = async (refresh_token: string, type: 'artists' | 'tracks', limit: number) => {
	try {
		const access_token = await getUserToken(refresh_token);

		const response = await fetch(`https://api.spotify.com/v1/me/top/${type}?limit=${limit}&offset=0`, {
			headers: {
				Authorization: `Bearer ${access_token}`,
			},
		});

		if (!response.ok) console.error('ERROR: Request failed with status: ' + response.status);

		const data = await response.json();

		return data.items;
	} catch (error) {
		throw new Error('ERROR AT API CALL: getUsersTopItems', { cause: error });
	}
};

export const getAppToken = async () => {
	try {
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
	} catch (error) {
		throw new Error('ERROR AT API CALL: getAppToken', { cause: error });
	}
};

export const getArtist = async (artistId: string) => {
	try {
		const token = await getAppToken();

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
	} catch (error) {
		throw new Error('ERROR AT API CALL: getArtist', { cause: error });
	}
};

export const getAllArtistAlbums = async (artistId: string) => {
	try {
		const token = await getAppToken();

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
		return data.items;
	} catch (error) {
		throw new Error('ERROR AT API CALL: getAllArtistAlbums', { cause: error });
	}
};

export const getAlbumTracks = async (albumId: string) => {
	try {
		const token = await getAppToken();
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
		return data.items;
	} catch (error) {
		throw new Error('ERROR AT API CALL: getAlbumTracks', { cause: error });
	}
};

export const getArtistId = async (artistName: string, market?: string) => {
	try {
		const token = await getAppToken();
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
	} catch (error) {
		throw new Error('ERROR AT API CALL: getArtistId', { cause: error });
	}
};

export const getRandomSongFromUserLastTracks = async (refresh_token: string) => {
	try {
		let tracks;

		try {
			tracks = await getUsersTopItems(refresh_token, 'tracks', 50);
		} catch (error) {
			throw new Error(`Spotify: error finding tracks`);
		}

		const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];

		return {
			randomTrack: randomTrack.name,
			previewUrl: randomTrack.preview_url,
			url: randomTrack.external_urls.spotify,
			id: randomTrack.id,
			artist: randomTrack.artists[0].name,
		};
	} catch (error) {
		throw new Error('ERROR AT API CALL: getRandomSongFromUserLastTracks', { cause: error });
	}
};

export const getRandomSongFromUserLastArists = async (refresh_token: string) => {
	try {
		let artistId: string;
		let artistName: string;

		let items: Artist[] = await getUsersTopItems(refresh_token, 'artists', 30);

		let artists: Artist[] = [];

		for (const artist of items) {
			artists.push({ name: artist.name, id: artist.id });
		}

		let index = Math.floor(Math.random() * artists.length);

		artistId = artists[index].id;
		artistName = artists[index].name;

		let albums: Album[] = await getAllArtistAlbums(artistId);

		albums = albums.filter((album) => album.album_type == 'album');
		albums = albums.filter((album) => album.album_group == 'album');

		const randomAlbum = albums[Math.floor(Math.random() * albums.length)];

		let tracks: Track[] = await getAlbumTracks(randomAlbum.id);

		const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];

		return {
			randomTrack: randomTrack.name,
			previewUrl: randomTrack.preview_url,
			url: randomTrack.external_urls.spotify,
			id: randomTrack.id,
			artist: artistName,
		};
	} catch (error) {
		throw new Error('ERROR AT API CALL: getRandomSongFromUserLastArists', { cause: error });
	}
};

export const getRandomArtistTrack = async (artistName: string, market?: string) => {
	try {
		let artistId: string = await getArtistId(artistName, market);

		let albums: Album[] = await getAllArtistAlbums(artistId);

		albums = albums.filter((album) => album.album_type == 'album');
		albums = albums.filter((album) => album.album_group == 'album');

		const randomAlbum = albums[Math.floor(Math.random() * albums.length)];

		let tracks: Track[] = await getAlbumTracks(randomAlbum.id);

		const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];

		return {
			randomTrack: randomTrack.name,
			previewUrl: randomTrack.preview_url,
			url: randomTrack.external_urls.spotify,
			id: randomTrack.id,
		};
	} catch (error) {
		throw new Error('ERROR AT API CALL: getRandomArtistTrack', { cause: error });
	}
};
