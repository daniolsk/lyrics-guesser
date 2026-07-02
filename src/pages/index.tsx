import { FormEvent, useState } from 'react';

import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });

import { useRouter } from 'next/router';
import Footer from '@/components/ui/Footer';
import Loading from '@/components/ui/Loading';

import LoadingFullScreen from '@/components/ui/LoadingFullScreen';

export default function Home() {
	const [artist, setArtist] = useState('');
	const [market, setMarket] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsLoading(true);
		router.push(`/guess?artist=${artist}${market.length > 0 ? `&market=${market}` : ``}`);
	};

	return (
		<div className="h-[100svh] overflow-hidden bg-[url('/bg.svg')] bg-[length:160rem] bg-top bg-repeat">
			<LoadingFullScreen show={isLoading} />
			<div className="m-auto flex h-full max-w-7xl flex-col justify-between">
				<main className={`flex flex-1 flex-col items-center justify-center p-5 ${inter.className}`}>
					<div className="mb-2 flex text-center text-4xl font-extrabold tracking-wide text-white md:mb-4 md:text-6xl">
						<span className="py-2">Guess the&nbsp;</span>
						<span className="background-animate bg-gradient-to-r from-red-400 to-green-400 bg-clip-text py-2 text-transparent">
							Song
						</span>
					</div>
					<form className="mb-4 flex flex-col" onSubmit={(e) => handleSubmit(e)}>
						<div className="mb-4 flex items-center justify-center">
							<input
								type="text"
								className="border-b-2 bg-transparent p-2 text-center text-lg font-semibold focus:outline-none active:outline-none md:p-3 md:text-xl"
								placeholder="Artist name e.g. Eminem"
								value={artist}
								onChange={(e) => setArtist(e.target.value)}
								spellCheck={false}
							/>
						</div>

						<button
							type="submit"
							disabled={artist.length == 0 || isLoading}
							className="mb-8 mt-4 w-full max-w-md cursor-pointer border-2 border-white bg-gray-1000 px-4 py-2 text-lg font-semibold hover:enabled:bg-white hover:enabled:text-black disabled:border-gray-500 disabled:text-gray-500 md:px-5 md:py-3 md:text-xl"
						>
							{!isLoading ? (
								'Start'
							) : (
								<div className="p-1">
									<Loading />
								</div>
							)}
						</button>
						<div className="mb-4 flex items-center justify-center">
							<div className="mr-3 text-center text-sm text-gray-400">
								In case of errors, you can specify
								<br />
								the artist&apos;s country code:
							</div>
							<input
								type="text"
								className="w-16 border-b-2 bg-transparent p-2 text-center text-sm focus:outline-none active:outline-none"
								placeholder="e.g. PL"
								value={market}
								onChange={(e) => {
									if (e.target.value.length <= 2) {
										setMarket(e.target.value.toUpperCase());
									} else {
										return;
									}
								}}
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
