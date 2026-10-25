import { NextRequest, NextResponse } from 'next/server';

import { findPreviewUrl } from '@/utils/preview';

const MAX_PARAM_LENGTH = 300;

export async function GET(request: NextRequest) {
	const { searchParams } = request.nextUrl;

	const title = searchParams.get('title')?.trim();
	const artist = searchParams.get('artist')?.trim();
	if (!title || !artist || title.length > MAX_PARAM_LENGTH || artist.length > MAX_PARAM_LENGTH) {
		return NextResponse.json({ error: 'Missing song title or artist.' }, { status: 400 });
	}

	const previewUrl = await findPreviewUrl(title, artist).catch(() => null);
	if (!previewUrl) {
		return NextResponse.json({ error: 'No preview for this song.' }, { status: 404 });
	}

	// Deezer's clip links expire about 15 minutes after the search, so the CDN and the
	// browser together keep them for at most 10.
	return NextResponse.json(
		{ previewUrl },
		{ headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' } },
	);
}
