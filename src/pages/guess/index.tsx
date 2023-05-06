import { FormEvent, useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import stringSim from 'string-similarity';

import { getLyrics } from '@/utils/lyrics';
import { getRandomArtistTrack } from '@/utils/spotify';
import { Lyrics, Song } from '@/utils/types';
import Footer from '@/components/ui/Footer';

export default function Guess({ song, error }: { song: Song; error?: string }) {
	const router = useRouter();

	const [time, setTime] = useState(5);
	const [allowNext, setAllowNext] = useState(false);
	const [guess, setGuess] = useState('');
	const [isGuessed, setIsGuessed] = useState(false);
	const [isCorrect, setIsCorrect] = useState<Boolean>();
	const [isLoading, setIsLoading] = useState(false);
	const [showImg, setShowImg] = useState(false);
	const [showNextVerses, setShowNextVerses] = useState(false);

	useEffect(() => {
		let i = setInterval(() => {
			setTime((time) => {
				if (time - 1 <= 0) {
					clearInterval(i);
					setAllowNext(true);
				}
				return time - 1;
			});
		}, 1000);

		return () => {
			clearInterval(i);
		};
	}, []);

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const sim = stringSim.compareTwoStrings(guess.toUpperCase(), song.songTitle.toUpperCase());

		if (sim >= 0.75) {
			setIsCorrect(true);
		} else {
			setIsCorrect(false);
		}

		setIsGuessed(true);
	};

	return (
		<div className={`flex min-h-[100svh] flex-col justify-between ${isGuessed ? `${isCorrect ? 'bg-green-900' : 'bg-red-900'}` : ''}`}>
			<main className="flex flex-1 flex-col items-center justify-center p-5 pb-0">
				{error ? (
					<div className="flex flex-col items-center">
						<div className="mb-4 text-center text-xl font-bold md:text-3xl">Error:</div>
						<div className="mb-2 text-center text-base font-semibold md:text-xl">{error}</div>
						<div className="flex gap-4">
							<button
								onClick={() => {
									setIsLoading(true);
									router.push(router.asPath);
								}}
								className="mb-8 mt-4 cursor-pointer border-2 border-white px-4 py-2 text-lg font-semibold hover:enabled:bg-white hover:enabled:text-black disabled:border-gray-500 disabled:text-gray-500"
							>
								Try again
							</button>
							<button
								onClick={() => router.push('/')}
								className="mb-8 mt-4 cursor-pointer border-2 border-white px-4 py-2 text-lg font-semibold hover:enabled:bg-white hover:enabled:text-black disabled:border-gray-500 disabled:text-gray-500"
							>
								Back
							</button>
						</div>
					</div>
				) : (
					<div className="flex w-full flex-col items-center">
						{isGuessed ? (
							<Link href={song.url} target="_blank" className="mb-10 mt-4 ">
								<div
									className="relative h-60 w-60 cursor-pointer rounded-md p-4 sm:h-72 sm:w-72"
									onClick={() => setShowImg(true)}
								>
									<Image
										fill
										onContextMenu={(e) => e.preventDefault()}
										src={song.songImage}
										priority
										quality={100}
										sizes="(max-width: 768px) 100vw,
										(max-width: 1200px) 50vw,
										33vw"
										alt="song image"
										className={`object-cover shadow-[4.0px_8.0px_8.0px_rgba(0,0,0,0.38)]`}
									/>
								</div>
							</Link>
						) : (
							<div className="relative mb-10 mt-4 h-60 w-60 p-4 sm:h-72 sm:w-72" onClick={() => setShowImg(true)}>
								{showImg ? (
									''
								) : (
									<div className=" absolute left-0 top-0 z-10 flex h-full w-full cursor-pointer items-center justify-center bg-transparent fill-gray-300 font-semibold text-gray-300 hover:fill-gray-100 hover:text-gray-100 md:text-base">
										<svg
											width="20px"
											height="20px"
											viewBox="0 0 24 24"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
											className="mr-1 fill-inherit drop-shadow-[2px_5px_5px_rgb(0,0,0)]"
										>
											<path
												className="fill-inherit"
												d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zM7.92 9.234v.102a.5.5 0 0 0 .5.5h.997a.499.499 0 0 0 .499-.499c0-1.29.998-1.979 2.34-1.979 1.308 0 2.168.689 2.168 1.67 0 .928-.482 1.359-1.686 1.91l-.344.154C11.379 11.54 11 12.21 11 13.381v.119a.5.5 0 0 0 .5.5h.997a.499.499 0 0 0 .499-.499c0-.516.138-.723.55-.912l.345-.155c1.445-.654 2.529-1.514 2.529-3.39v-.103c0-1.978-1.72-3.441-4.164-3.441-2.478 0-4.336 1.428-4.336 3.734zm2.58 7.757c0 .867.659 1.509 1.491 1.509.85 0 1.509-.642 1.509-1.509 0-.867-.659-1.491-1.509-1.491-.832 0-1.491.624-1.491 1.491z"
											/>
										</svg>
										<div className="text-inherit drop-shadow-[2px_5px_5px_rgb(0,0,0)]">Show image</div>
									</div>
								)}
								<Image
									fill
									onContextMenu={(e) => e.preventDefault()}
									src={song.songImage}
									priority
									quality={100}
									sizes="(max-width: 768px) 100vw,
									(max-width: 1200px) 50vw,
									33vw"
									alt="song image"
									className={`object-cover shadow-[4.0px_8.0px_8.0px_rgba(0,0,0,0.38)] ${
										isGuessed || showImg ? `` : `blur-[14px] grayscale`
									}`}
								/>
							</div>
						)}

						<div className="mb-6 text-center font-semibold italic">
							<div className="text-base sm:text-lg md:text-xl">&quot;{song.firstVerse}</div>
							<div className="text-base sm:text-lg md:text-xl">
								{song.secondVerse}
								{showNextVerses ? '' : '"'}
							</div>
							{showNextVerses ? (
								<>
									{song.nextVerses.map((verse, index) => (
										<div key={index} className="text-base sm:text-lg md:text-xl">
											{verse}
											{index == 1 ? '"' : ''}
										</div>
									))}
								</>
							) : (
								<button
									className="mt-2 flex w-full cursor-pointer items-center justify-center fill-gray-300 text-sm text-gray-300 hover:fill-gray-200 hover:text-gray-200 md:text-base"
									onClick={() => setShowNextVerses(true)}
								>
									<svg
										width="20px"
										height="20px"
										viewBox="0 0 24 24"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
										className="mr-1 fill-inherit"
									>
										<path
											className="fill-inherit"
											d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zM7.92 9.234v.102a.5.5 0 0 0 .5.5h.997a.499.499 0 0 0 .499-.499c0-1.29.998-1.979 2.34-1.979 1.308 0 2.168.689 2.168 1.67 0 .928-.482 1.359-1.686 1.91l-.344.154C11.379 11.54 11 12.21 11 13.381v.119a.5.5 0 0 0 .5.5h.997a.499.499 0 0 0 .499-.499c0-.516.138-.723.55-.912l.345-.155c1.445-.654 2.529-1.514 2.529-3.39v-.103c0-1.978-1.72-3.441-4.164-3.441-2.478 0-4.336 1.428-4.336 3.734zm2.58 7.757c0 .867.659 1.509 1.491 1.509.85 0 1.509-.642 1.509-1.509 0-.867-.659-1.491-1.509-1.491-.832 0-1.491.624-1.491 1.491z"
										/>
									</svg>
									<span className="text-inherit">Show next two verses</span>
								</button>
							)}
						</div>

						{isGuessed ? (
							<div>
								<div className="my-2 flex flex-col items-center">
									<div className="mb-1 text-center text-3xl font-bold md:text-4xl">&quot;{song.songTitle}&quot;</div>
									<div className="mb-2 flex justify-center text-base font-semibold md:text-lg">
										{' '}
										by {song.songArtistNames ? song.songArtistNames : song.songArtist}
									</div>
								</div>
							</div>
						) : (
							<form className="flex flex-col items-center" onSubmit={(e) => handleSubmit(e)}>
								<input
									type="text"
									className="mb-2 border-b-2 bg-transparent p-2 text-center text-2xl font-semibold focus:outline-none active:outline-none md:text-3xl"
									value={guess}
									spellCheck={false}
									onChange={(e) => setGuess(e.target.value)}
								/>
								<div className="mb-2 flex justify-center text-base font-semibold md:text-lg">
									{' '}
									by {song.songArtistNames ? song.songArtistNames : song.songArtist}
								</div>
								<div className="flex gap-4">
									<input
										disabled={isGuessed || guess.length == 0}
										value="Check"
										type="submit"
										className="mb-4 mt-4 cursor-pointer border-2 border-white px-4 py-2 text-lg font-semibold hover:enabled:bg-white hover:enabled:text-black disabled:border-gray-500 disabled:text-gray-500"
									/>
									<input
										value="Give up"
										type="button"
										onClick={(e) => {
											e.preventDefault();

											setIsCorrect(false);
											setIsGuessed(true);
										}}
										className="mb-4 mt-4 cursor-pointer border-2 border-red-600 px-4 py-2 text-lg font-semibold text-red-600 hover:enabled:bg-red-600 hover:enabled:text-black disabled:border-red-900 disabled:text-red-900"
									/>
								</div>
							</form>
						)}
						{isGuessed ? (
							<>
								{/* {song.previewUrl ? (
									<button className="text-lg" onClick={toggle}>
										{playing ? (
											<Image src="/pause.svg" quality={100} width={40} height={40} alt="pause song" />
										) : (
											<Image src="/play.svg" quality={100} width={40} height={40} alt="play song" />
										)}
									</button>
								) : (
									''
								)} */}
								<div className="mb-4 flex gap-4">
									<button
										disabled={!allowNext}
										onClick={() => {
											setIsLoading(true);
											router.push(router.asPath);
										}}
										className="mt-4 cursor-pointer border-2 border-white px-4 py-2 text-lg font-semibold hover:enabled:bg-white hover:enabled:text-black disabled:border-gray-500 disabled:text-gray-500"
									>
										Try again {time > 0 ? `(${time})` : ''}
									</button>
									<button
										onClick={() => router.push('/')}
										className="mt-4 cursor-pointer border-2 border-white px-4 py-2 text-lg font-semibold hover:enabled:bg-white hover:enabled:text-black disabled:border-gray-500 disabled:text-gray-500"
									>
										Back
									</button>
								</div>
								{/* <div className="mb-2 w-full max-w-sm py-4">
									<iframe
										className="rounded-[14px] shadow-[4.0px_8.0px_8.0px_rgba(0,0,0,0.38)]"
										src={`https://open.spotify.com/embed/track/${song.id}`}
										width="100%"
										height="80"
										allowFullScreen={false}
										allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
										loading="lazy"
									></iframe>
								</div> */}
							</>
						) : (
							''
						)}
					</div>
				)}
			</main>
			<Footer />
		</div>
	);
}

export const getServerSideProps: GetServerSideProps = async (context) => {
	if (!context.query.artist) {
		return {
			redirect: {
				destination: '/',
			},
			props: {},
		};
	}

	let artist = context.query.artist as string;

	let market = context.query.market ? (context.query.market as string) : undefined;

	try {
		let i = 3;
		let randomSong: { randomTrack: string; previewUrl: string; url: string; id: string };

		let lyricsObj: Lyrics | null;

		do {
			randomSong = await getRandomArtistTrack(artist, market);

			lyricsObj = await getLyrics(randomSong.randomTrack, artist);

			i--;

			if (i <= 0) {
				throw new Error('Lyrics not found!');
			}
		} while (!lyricsObj);

		let songObj: Song = { ...lyricsObj, previewUrl: randomSong.previewUrl, url: randomSong.url, id: randomSong.id };

		return {
			props: {
				song: songObj,
			},
		};
	} catch (error) {
		console.error(error);

		return {
			props: {
				error: 'Something went wrong - try again later',
			},
		};
	}
};
