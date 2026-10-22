'use client';

import { useEffect, useSyncExternalStore } from 'react';

// The count lives outside the component so it survives navigations, where each page mounts its
// own footer. It's fetched once per visit and then kept fresh by the guess API responses.
let songsPlayed: number | undefined;
let isFetchStarted = false;
const listeners = new Set<() => void>();

export const updateSongsPlayed = (value: number) => {
	// The counter only grows, so ignore a slower response carrying an older total.
	songsPlayed = Math.max(songsPlayed ?? 0, value);
	listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
	listeners.add(listener);
	return () => listeners.delete(listener);
};

const Footer = () => {
	const count = useSyncExternalStore(
		subscribe,
		() => songsPlayed,
		() => undefined,
	);

	useEffect(() => {
		if (isFetchStarted) {
			return;
		}
		isFetchStarted = true;

		fetch('/api/stats')
			.then((response) => response.json())
			.then((data) => {
				if (typeof data?.songsPlayed === 'number') {
					updateSongsPlayed(data.songsPlayed);
				}
			})
			.catch(() => {
				isFetchStarted = false;
			});
	}, []);

	return (
		<footer className="bg-transparent p-4 text-center text-sm font-semibold text-white md:p-5">
			{/* Keep the line's space while loading so the footer doesn't jump when the count arrives. */}
			<div
				className={`mb-1 text-gray-400 transition-opacity duration-500 ${count === undefined ? 'opacity-0' : 'opacity-100'}`}
			>
				{count === undefined ? ' ' : `${count.toLocaleString('en-US')} songs played so far`}
			</div>
			Made with ❤️ by{' '}
			<a
				href="https://danielskowron.com"
				target="_blank"
				rel="noopener noreferrer"
				className="underline-offset-4 hover:underline"
			>
				Daniel Skowron
			</a>
		</footer>
	);
};

export default Footer;
