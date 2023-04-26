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
		<div className="flex flex-col justify-between min-h-[100svh]">
			<main className={`flex-1 flex flex-col justify-center items-center p-5 ${inter.className}`}>
				<div className="text-3xl font-semibold mb-2 text-center">Guess song by lyrics</div>
				<div className="text-base font-semibold mb-8 text-center">Check how well you know your favorite artist</div>
				<form className="flex flex-col" onSubmit={(e) => handleSubmit(e)}>
					<div className="flex mb-4">
						<input
							type="text"
							className="bg-transparent border-b-2 text-lg text-center p-2"
							placeholder="Artist name e.g. Eminem"
							value={artist}
							onChange={(e) => setArtist(e.target.value)}
						/>
					</div>
					<input
						type="submit"
						disabled={artist.length == 0 || isLoading}
						className="border-white font-semibold border-2 mt-4 px-4 mb-8 py-2 cursor-pointer text-lg hover:enabled:bg-white hover:enabled:text-black disabled:border-gray-500 disabled:text-gray-500"
						value={'Start'}
					/>
				</form>
				{isLoading ? <Loading /> : ''}
			</main>
			<footer className="text-white p-4 text-center text-sm">Made with ❤️ by Daniel Skowron</footer>
		</div>
	);
}
