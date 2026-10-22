import type { NextApiRequest, NextApiResponse } from 'next';

import { guessSong } from '@/utils/guessSong';
import { Song } from '@/utils/types';

type GuessResponse = { song: Song } | { error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<GuessResponse>) {
	if (req.method !== 'GET') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	const artist = req.query.artist;
	if (!artist || typeof artist !== 'string' || !artist.trim()) {
		return res.status(400).json({ error: 'Enter an artist name to start.' });
	}

	const market = typeof req.query.market === 'string' ? req.query.market : undefined;
	if (market && !/^[A-Za-z]{2}$/.test(market)) {
		return res.status(400).json({
			error: `"${market}" isn't a valid country code. Use a two-letter code like PL or US, or leave it empty.`,
		});
	}

	const result = await guessSong(artist.trim(), market);

	if ('error' in result) {
		return res.status(result.status).json({ error: result.error });
	}

	return res.status(200).json(result);
}
