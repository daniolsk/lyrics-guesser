'use client';

import { useEffect, useState } from 'react';

// Fired with the new total whenever a song is served, so the footer updates without refetching.
export const SONGS_PLAYED_EVENT = 'songs-played';

const Footer = () => {
	const [songsPlayed, setSongsPlayed] = useState<number>();

	useEffect(() => {
		fetch('/api/stats')
			.then((response) => response.json())
			.then((data) => {
				if (typeof data?.songsPlayed === 'number') {
					setSongsPlayed((current) => current ?? data.songsPlayed);
				}
			})
			.catch(() => {});

		const handlePlayed = (e: Event) => setSongsPlayed((e as CustomEvent<number>).detail);
		window.addEventListener(SONGS_PLAYED_EVENT, handlePlayed);
		return () => window.removeEventListener(SONGS_PLAYED_EVENT, handlePlayed);
	}, []);

	return (
		<footer className="bg-transparent p-4 text-center text-sm font-semibold text-white md:p-5">
			{songsPlayed !== undefined && (
				<div className="mb-1 text-gray-400">
					{songsPlayed.toLocaleString('en-US')} songs played so far
				</div>
			)}
			Made with ❤️ by Daniel Skowron
		</footer>
	);
};

export default Footer;
