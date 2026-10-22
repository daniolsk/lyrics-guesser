'use client';

import { FormEvent, use, useState } from 'react';

import { useRouter } from 'next/navigation';
import Footer from '@/components/ui/Footer';

type Mode = 'song' | 'lyrics';

const MODES: { value: Mode; label: string }[] = [
	{ value: 'song', label: 'Guess the title' },
	{ value: 'lyrics', label: 'Fill in the lyrics' },
];

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function Home({ searchParams }: { searchParams: SearchParams }) {
	// The games link back with their mode, so the player lands on the mode they just played.
	const initialMode: Mode = use(searchParams).mode === 'lyrics' ? 'lyrics' : 'song';

	const [mode, setMode] = useState<Mode>(initialMode);
	const [artist, setArtist] = useState('');
	const [market, setMarket] = useState('');
	const router = useRouter();

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const params = new URLSearchParams({ artist });
		if (market.length > 0) {
			params.set('market', market);
		}
		router.push(`/${mode === 'lyrics' ? 'lyrics' : 'guess'}?${params.toString()}`);
	};

	return (
		<div className="h-[100svh] overflow-hidden bg-[url('/bg.svg')] bg-[length:160rem] bg-top bg-repeat">
			<div className="m-auto flex h-full max-w-7xl flex-col justify-between">
				<main className="flex flex-1 flex-col items-center justify-center p-5">
					<div className="mb-2 flex text-center text-4xl font-extrabold tracking-wide text-white md:mb-4 md:text-6xl">
						<span className="py-2">Guess the&nbsp;</span>
						<span className="animate-background-scroll bg-linear-to-r from-red-400 to-green-400 bg-size-[500%] bg-clip-text py-2 text-transparent">
							{mode === 'lyrics' ? 'Lyrics' : 'Song'}
						</span>
					</div>
					<div className="mb-4 flex gap-2">
						{MODES.map(({ value, label }) => (
							<button
								key={value}
								type="button"
								aria-pressed={mode === value}
								onClick={() => setMode(value)}
								className={`cursor-pointer border-2 px-3 py-1 text-sm font-semibold md:text-base ${
									mode === value
										? 'border-white bg-white text-black'
										: 'border-gray-500 text-gray-400 hover:border-white hover:text-white'
								}`}
							>
								{label}
							</button>
						))}
					</div>
					<form className="mb-4 flex flex-col" onSubmit={(e) => handleSubmit(e)}>
						<div className="mb-4 flex items-center justify-center">
							<input
								type="text"
								className="border-b-2 bg-transparent p-2 text-center text-lg font-semibold focus:outline-hidden active:outline-hidden md:p-3 md:text-xl"
								placeholder="Artist name e.g. Eminem"
								value={artist}
								onChange={(e) => setArtist(e.target.value)}
								spellCheck={false}
							/>
						</div>

						<button
							type="submit"
							disabled={artist.length === 0}
							className="mt-4 mb-8 w-full max-w-md cursor-pointer border-2 border-white bg-gray-1000 px-4 py-2 text-lg font-semibold hover:enabled:bg-white hover:enabled:text-black disabled:border-gray-500 disabled:text-gray-500 md:px-5 md:py-3 md:text-xl"
						>
							Start
						</button>
						<div className="mb-4 flex items-center justify-center">
							<div className="mr-3 text-center text-sm text-gray-400">
								In case of errors, you can specify
								<br />
								the artist&apos;s country code:
							</div>
							<input
								type="text"
								className="w-16 border-b-2 bg-transparent p-2 text-center text-sm focus:outline-hidden active:outline-hidden"
								placeholder="e.g. PL"
								value={market}
								maxLength={2}
								onChange={(e) => setMarket(e.target.value.toUpperCase())}
								spellCheck={false}
							/>
						</div>
					</form>
				</main>
				<Footer />
			</div>
		</div>
	);
}
