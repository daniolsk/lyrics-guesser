import { FormEvent, useRef, useState } from 'react';
import Image from 'next/image';

import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });

import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Footer from '@/components/ui/Footer';
import Loading from '@/components/ui/Loading';

export default function Home() {
	const { data: session } = useSession();

	const ref = useRef<HTMLDivElement>(null);

	const [artist, setArtist] = useState('');
	const [market, setMarket] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsLoading(true);
		router.push(`/guess?artist=${artist}${market.length > 0 ? `&market=${market}` : ``}`);
	};

	const handleClickScroll = () => {
		ref.current?.scrollIntoView({ behavior: 'smooth' });
	};

	return (
		<div className="bg-[url('/bg.svg')] bg-[length:160rem] bg-top bg-repeat">
			<div className="m-auto flex min-h-[100svh] max-w-7xl flex-col justify-between">
				<header className="flex p-4 text-sm text-white md:p-5">
					{session ? (
						<div className="flex flex-1 justify-between">
							<div className="flex items-center">
								<div className="relative mr-4 h-9 w-9">
									<Image alt="user avatar" src={session.user.image} fill className="rounded-full object-cover" />
								</div>
								<div className="mr-4 text-base md:text-lg">
									Hi, <span className="font-semibold">{session.user.name}</span>
								</div>
							</div>
							<button
								className="cursor-pointer border-2 border-white bg-gray-1000 px-2 py-1 text-sm font-semibold hover:enabled:bg-white hover:enabled:text-black disabled:border-gray-500 disabled:text-gray-500 md:text-lg"
								onClick={() => signOut()}
							>
								Sign out
							</button>
						</div>
					) : (
						<div className="flex flex-1 justify-end">
							<button
								className="cursor-pointer border-2 border-white px-2 py-1 text-sm font-semibold hover:enabled:bg-white hover:enabled:text-black disabled:border-gray-500 disabled:text-gray-500 md:text-lg"
								onClick={() => signIn()}
							>
								Sign in
							</button>
						</div>
					)}
				</header>
				<main className={`flex flex-col items-center p-5 ${inter.className}`}>
					<div className="flex min-h-[85svh] flex-1 flex-col items-center justify-center">
						<div className="mb-2 text-center text-4xl font-extrabold tracking-wide text-white md:mb-4 md:text-6xl">
							Guess the{' '}
							<span className="background-animate bg-gradient-to-r from-red-400 to-green-400 bg-clip-text text-transparent">
								song
							</span>
						</div>
						<div className="mb-8 text-center text-base font-normal md:text-xl">
							Check how well you know your favorite artist
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
								className="mb-8 mt-4 cursor-pointer border-2 border-white bg-gray-1000 px-4 py-2 text-lg font-semibold hover:enabled:bg-white hover:enabled:text-black disabled:border-gray-500 disabled:text-gray-500 md:px-5 md:py-3 md:text-xl"
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
						<svg
							onClick={handleClickScroll}
							fill="#fff"
							className="mt-6 h-8 w-8 animate-bounce cursor-pointer"
							height="800px"
							width="800px"
							version="1.1"
							id="Layer_1"
							xmlns="http://www.w3.org/2000/svg"
							xmlnsXlink="http://www.w3.org/1999/xlink"
							viewBox="0 0 330 330"
							xmlSpace="preserve"
						>
							<path
								id="XMLID_225_"
								d="M325.607,79.393c-5.857-5.857-15.355-5.858-21.213,0.001l-139.39,139.393L25.607,79.393
	c-5.857-5.857-15.355-5.858-21.213,0.001c-5.858,5.858-5.858,15.355,0,21.213l150.004,150c2.813,2.813,6.628,4.393,10.606,4.393
	s7.794-1.581,10.606-4.394l149.996-150C331.465,94.749,331.465,85.251,325.607,79.393z"
							/>
						</svg>
					</div>
					<div className="mt-4 flex flex-col items-center justify-center p-6 md:p-12" ref={ref}>
						{!session ? (
							<div className="flex items-center justify-center rounded-lg text-center text-xl font-bold md:text-2xl">
								<button className="p-2 text-gray-200 hover:text-white" onClick={() => signIn()}>
									Sign in via <span className="text-[#1DB954]">Spotify</span> to unlock more gamemodes
								</button>
							</div>
						) : (
							<div>
								<div className="flex flex-col text-center text-2xl font-semibold">
									<div className="mb-2">Other gamemodes:</div>
									<span className="text-base font-normal text-gray-400">Coming soon...</span>
								</div>
							</div>
						)}
					</div>
				</main>
				<Footer />
			</div>
		</div>
	);
}
