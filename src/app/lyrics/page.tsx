import { redirect } from 'next/navigation';

import FillLyrics from '@/components/FillLyrics';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LyricsPage({ searchParams }: { searchParams: SearchParams }) {
	const { artist, market } = await searchParams;

	if (typeof artist !== 'string' || !artist.trim()) {
		redirect('/?mode=lyrics');
	}

	const marketParam = typeof market === 'string' ? market : undefined;

	// Remount on a new artist or market so the game starts from a fresh state.
	return <FillLyrics key={`${artist}|${marketParam ?? ''}`} artist={artist} market={marketParam} />;
}
