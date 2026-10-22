import { NextResponse } from 'next/server';

import { getSongsPlayed } from '@/utils/stats';

export const dynamic = 'force-dynamic';

export async function GET() {
	return NextResponse.json({ songsPlayed: await getSongsPlayed() });
}
