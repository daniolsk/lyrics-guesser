import type { NextApiRequest, NextApiResponse } from 'next';

import { getLyrics } from '@/utils/lyrics';
import { getRandomArtistTrack } from '@/utils/spotify';
import { type LyricsObj, type SongObj } from '@/utils/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse<SongObj | { error: string }>) {
	if (req.method != 'GET') {
		res.status(405).json({ error: 'Method not allowed' });
	}

	if (!req.query.artist) {
		res.status(400).json({ error: 'Bad request' });
		return;
	}

	let artist = req.query.artist as string;

	try {
		const randomSong: { randomTrack: string; previewUrl: string; url: string } = await getRandomArtistTrack(artist);

		let lyricsObj: LyricsObj = await getLyrics(randomSong.randomTrack, artist);

		let songObj: SongObj = { ...lyricsObj, previewUrl: randomSong.previewUrl, url: randomSong.url };

		res.status(200).json(songObj);
	} catch (error) {
		console.log(error);

		res.status(500).json({ error: 'Server error' });
		return;
	}
}
