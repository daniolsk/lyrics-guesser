import { NextResponse } from 'next/server';

import { getSongsPlayed } from '@/utils/stats';

export const dynamic = 'force-dynamic';

// Vercel's CDN keeps the count for 10 minutes, so visits don't wake the database. Players
// still see fresh numbers, as each guess response carries the latest count.
const CACHE_CONTROL = 'public, s-maxage=600, stale-while-revalidate=60';

export async function GET() {
	return NextResponse.json(
		{ songsPlayed: await getSongsPlayed() },
		{ headers: { 'Cache-Control': CACHE_CONTROL } },
	);
}
