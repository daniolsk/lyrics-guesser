import { NextRequest, NextResponse } from 'next/server';

import { guessSong } from '@/utils/guessSong';
import { incrementSongsPlayed } from '@/utils/stats';

const MAX_SONG_KEYS = 50;
const MAX_SONG_KEY_LENGTH = 200;

const parseSongKeys = (value: string | null) =>
	value
		? value
				.split(',')
				.map((key) => key.trim())
				.filter((key) => key && key.length <= MAX_SONG_KEY_LENGTH)
				.slice(-MAX_SONG_KEYS)
		: [];

export async function GET(request: NextRequest) {
	const { searchParams } = request.nextUrl;

	const artist = searchParams.get('artist')?.trim();
	if (!artist) {
		return NextResponse.json({ error: 'Enter an artist name to start.' }, { status: 400 });
	}

	const market = searchParams.get('market') || undefined;
	if (market && !/^[A-Za-z]{2}$/.test(market)) {
		return NextResponse.json(
			{
				error: `"${market}" isn't a valid country code. Use a two-letter code like PL or US, or leave it empty.`,
			},
			{ status: 400 },
		);
	}

	const result = await guessSong(artist, market, {
		seen: parseSongKeys(searchParams.get('seen')),
		noLyrics: parseSongKeys(searchParams.get('noLyrics')),
	});

	if ('error' in result) {
		return NextResponse.json(
			{ error: result.error, noLyricsSongs: result.noLyricsSongs },
			{ status: result.status },
		);
	}

	// The counter is a nice-to-have, so a database hiccup shouldn't cost the player their song.
	const songsPlayed = await incrementSongsPlayed().catch((error) => {
		console.error('Failed to increment the songs played counter', error);
		return undefined;
	});

	return NextResponse.json({ ...result, songsPlayed });
}
