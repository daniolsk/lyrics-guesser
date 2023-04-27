import { FormEvent, useState } from 'react';

import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });

import { useRouter } from 'next/navigation';
import Loading from '@/components/Loading';

export default function Home() {
	const [artist, setArtist] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsLoading(true);
		router.push(`/guess?artist=${artist}`);
	};

	return (
		<div className="flex min-h-[100svh] flex-col justify-between">
			<main className={`flex flex-1 flex-col items-center justify-center p-5 ${inter.className}`}>
				<div className="mb-2 text-center text-3xl font-semibold">Guess song by lyrics</div>
				<div className="mb-8 text-center text-base font-semibold">Check how well you know your favorite artist</div>
				<form className="flex flex-col" onSubmit={(e) => handleSubmit(e)}>
					<div className="mb-4 flex">
						<input
							type="text"
							className="border-b-2 bg-transparent p-2 text-center text-lg focus:outline-none active:outline-none"
							placeholder="Artist name e.g. Eminem"
							value={artist}
							onChange={(e) => setArtist(e.target.value)}
						/>
					</div>
					<input
						type="submit"
						disabled={artist.length == 0 || isLoading}
						className="mb-8 mt-4 cursor-pointer border-2 border-white px-4 py-2 text-lg font-semibold hover:enabled:bg-white hover:enabled:text-black disabled:border-gray-500 disabled:text-gray-500"
						value={'Start'}
					/>
				</form>
				{isLoading ? <Loading /> : ''}
			</main>
			<footer className="p-4 text-center text-sm text-white">Made with ❤️ by Daniel Skowron</footer>
		</div>
	);
}
