import type { NextApiRequest, NextApiResponse } from 'next';

import { guessSong, GuessSongResult } from '@/utils/guessSong';

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<GuessSongResult>
) {
	if (req.method !== 'GET') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	const artist = req.query.artist;
	if (!artist || typeof artist !== 'string') {
		return res.status(400).json({ error: 'Artist is required' });
	}

	const market =
		typeof req.query.market === 'string' ? req.query.market : undefined;

	const result = await guessSong(artist, market);

	if ('error' in result) {
		return res.status(500).json(result);
	}

	return res.status(200).json(result);
}
