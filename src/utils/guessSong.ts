import { logRequest } from '@/utils/requestLog';
import { getLyricsForTrack, isValidLyrics } from '@/utils/lyrics';
import {
	getRandomTrackFromContext,
	prepareArtistContext,
	TrackResult,
} from '@/utils/spotify';
import { Lyrics, Song } from '@/utils/types';

export type GuessSongResult = { song: Song } | { error: string };

export async function guessSong(artist: string, market?: string): Promise<GuessSongResult> {
	const requestStartedAt = Date.now();
	logRequest('Guess', `GET /guess?artist=${artist}`, requestStartedAt, {
		status: 'start',
	});

	try {
		const artistContext = await prepareArtistContext(artist, market);
		let randomSong: TrackResult | null = null;
		let lyricsObj: Lyrics | null = null;
		let attempts = 0;

		let nextTrackPromise = getRandomTrackFromContext(artistContext);

		for (let attempt = 0; attempt < 3 && !lyricsObj; attempt++) {
			attempts = attempt + 1;
			const attemptStartedAt = Date.now();
			const track = await nextTrackPromise;
			nextTrackPromise = getRandomTrackFromContext(artistContext);
			logRequest('Guess', `attempt ${attempt + 1} track`, attemptStartedAt, {
				status: 'ok',
				track: track.randomTrack,
			});

			try {
				const lyrics = await getLyricsForTrack(track.randomTrack, artist, {
					songTitle: track.randomTrack,
					songImage: track.albumImage,
					songArtist: track.artistName,
					songArtistNames: track.artistNames,
				});

				if (isValidLyrics(lyrics)) {
					randomSong = track;
					lyricsObj = lyrics;
					logRequest('Guess', `attempt ${attempt + 1} lyrics`, attemptStartedAt, {
						status: 'ok',
						song: lyrics.songTitle,
					});
				}
			} catch (error) {
				logRequest('Guess', `attempt ${attempt + 1} lyrics`, attemptStartedAt, {
					status: 'error',
					track: track.randomTrack,
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}

		if (!lyricsObj || !randomSong) {
			logRequest('Guess', `GET /guess?artist=${artist}`, requestStartedAt, {
				status: 'error',
				error: 'Lyrics not found',
			});
			throw new Error('Lyrics not found!');
		}

		const songObj: Song = {
			...lyricsObj,
			previewUrl: randomSong.previewUrl ?? null,
			url: randomSong.url,
			id: randomSong.id,
		};

		logRequest('Guess', `GET /guess?artist=${artist}`, requestStartedAt, {
			status: 'ok',
			song: songObj.songTitle,
			attempts,
		});

		return { song: songObj };
	} catch (error) {
		logRequest('Guess', `GET /guess?artist=${artist}`, requestStartedAt, {
			status: 'error',
			error: error instanceof Error ? error.message : String(error),
		});

		return {
			error: 'Something went wrong - try again later',
		};
	}
}
