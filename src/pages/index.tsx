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
		<main className={`flex min-h-screen flex-col justify-center items-center p-4 ${inter.className}`}>
			<div className="text-3xl font-semibold mb-2">Guess song by lyrics</div>
			<div className="text-lg font-semibold mb-8">Check how well you know your favorite artist</div>
			<input
				type="text"
				className="bg-transparent border-b-2 text-xl text-center p-3 mb-8"
				placeholder="Artist name e.g. Eminem"
				value={artist}
				onChange={(e) => setArtist(e.target.value)}
			/>
			<button
				disabled={artist.length == 0}
				onClick={() => {
					setLoading(true);
					router.push(`/guess?artist=${artist}`);
				}}
				className="border-white font-semibold border-2 mt-4 px-4 mb-8 py-2 cursor-pointer text-xl hover:enabled:bg-white hover:enabled:text-black disabled:border-gray-500 disabled:text-gray-500"
			>
				Start
			</button>
			{loading ? <div className="text-xl font-semibold">Loading...</div> : ''}
		</main>
	);
}
