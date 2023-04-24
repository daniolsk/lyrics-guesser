import Image from 'next/image';

import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Home() {
	const [artist, setArtist] = useState('');
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	return (
		<main className={`flex min-h-screen flex-col items-center p-24 ${inter.className}`}>
			<div className="text-4xl font-semibold mb-8">Guess song by lyrics</div>
			<input
				className="text-black p-2 mb-4 rounded-md"
				type="text"
				name="arist-name"
				id="arist-name"
				placeholder="Artist name"
				value={artist}
				onChange={(e) => setArtist(e.target.value)}
			/>
			<button
				className="px-4 mb-4 py-2 bg-white text-black rounded-md hover:bg-slate-200 hover:cursor-pointer disabled:bg-slate-500 disabled:text-gray-900"
				disabled={artist.length == 0}
				onClick={() => {
					setLoading(true);
					router.push(`/guess?artist=${artist}`);
				}}
			>
				Start
			</button>
			{loading ? 'Loading...' : ''}
		</main>
	);
}
