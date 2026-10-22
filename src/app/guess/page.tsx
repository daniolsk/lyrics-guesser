import { redirect } from 'next/navigation';

import Guess from '@/components/Guess';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function GuessPage({ searchParams }: { searchParams: SearchParams }) {
	const { artist, market } = await searchParams;

	if (typeof artist !== 'string' || !artist.trim()) {
		redirect('/');
	}

	const marketParam = typeof market === 'string' ? market : undefined;

	// Remount on a new artist or market so the game starts from a fresh state.
	return <Guess key={`${artist}|${marketParam ?? ''}`} artist={artist} market={marketParam} />;
}
