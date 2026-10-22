import { UserFacingError } from '@/utils/errors';
import { logRequest } from '@/utils/requestLog';
import { getLyricsForTrack, isValidLyrics } from '@/utils/lyrics';
import {
	ArtistContext,
	getRandomTrackFromContext,
	prepareArtistContext,
	TrackResult,
} from '@/utils/spotify';
import { Lyrics, Song } from '@/utils/types';

const MAX_ATTEMPTS = 3;
const DEFAULT_ERROR = 'Something went wrong on our side. Try again in a moment.';

export type GuessSongResult = { song: Song } | { error: string; status: number };

const fetchTrack = (context: ArtistContext) => {
	const track = getRandomTrackFromContext(context);
	// Mark as handled so a prefetched track that is never awaited can't crash the process.
	track.catch(() => {});
	return track;
};

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

		let nextTrackPromise = fetchTrack(artistContext);

		for (let attempt = 1; attempt <= MAX_ATTEMPTS && !lyricsObj; attempt++) {
			attempts = attempt;
			const attemptStartedAt = Date.now();
			const trackPromise = nextTrackPromise;
			if (attempt < MAX_ATTEMPTS) {
				nextTrackPromise = fetchTrack(artistContext);
			}

			let track: TrackResult;
			try {
				track = await trackPromise;
			} catch (error) {
				logRequest('Guess', `attempt ${attempt} track`, attemptStartedAt, {
					status: 'error',
					error: error instanceof Error ? error.message : String(error),
				});
				continue;
			}

			logRequest('Guess', `attempt ${attempt} track`, attemptStartedAt, {
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
					logRequest('Guess', `attempt ${attempt} lyrics`, attemptStartedAt, {
						status: 'ok',
						song: lyrics.songTitle,
					});
				}
			} catch (error) {
				logRequest('Guess', `attempt ${attempt} lyrics`, attemptStartedAt, {
					status: 'error',
					track: track.randomTrack,
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}

		if (!lyricsObj || !randomSong) {
			throw new UserFacingError(
				`We couldn't find lyrics for ${artistContext.artistName} songs this time. Try again or pick another artist.`,
				404,
			);
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

		if (error instanceof UserFacingError) {
			return { error: error.message, status: error.status };
		}

		return { error: DEFAULT_ERROR, status: 500 };
	}
}
