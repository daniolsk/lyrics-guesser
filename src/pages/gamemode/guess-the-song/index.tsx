import { FormEvent, useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import stringSim from 'string-similarity';
import { AiOutlineInfoCircle, AiFillQuestionCircle } from 'react-icons/ai';

import { getLyrics } from '@/utils/lyrics';
import { getRandomSongFromUserLastArists, getRandomSongFromUserLastTracks } from '@/utils/spotify';
import { Lyrics, Song } from '@/utils/types';
import Footer from '@/components/ui/Footer';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import LoadingFullScreen from '@/components/ui/LoadingFullScreen';

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
		<div
			className={`length:160rem flex min-h-[100svh] flex-col justify-between bg-[url('/bg.svg')] bg-top bg-repeat ${
				isGuessed ? `${isCorrect ? 'bg-green-1000' : 'bg-red-1000'}` : ''
			}`}
		>
			<LoadingFullScreen show={isLoading} />
			<main className="flex flex-1 flex-col items-center justify-center p-5 pb-0">
				{error ? (
					<div className="flex flex-col items-center">
						<div className="mb-4 text-center text-xl font-bold md:text-3xl">Error:</div>
						<div className="mb-2 text-center text-base font-semibold md:text-xl">{error}</div>
						<div className="flex gap-4">
							<button
								onClick={() => {
									setIsLoading(true);
									router.reload();
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
						<div className="mb-6 hidden items-center justify-center md:flex ">
							<h1 className="ml-2 flex items-center text-2xl font-semibold">
								<AiOutlineInfoCircle className="mr-2" size={28} />
								Guess the song title
							</h1>
						</div>
						{isGuessed ? (
							<Link href={song.url} target="_blank" className="mb-10 mt-4 bg-gray-1000">
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
							<div
								className="relative mb-10 mt-4 h-60 w-60 bg-gray-1000 p-4 sm:h-72 sm:w-72"
								onClick={() => setShowImg(true)}
							>
								{showImg ? (
									''
								) : (
									<div className=" absolute left-0 top-0 z-10 flex h-full w-full cursor-pointer items-center justify-center bg-transparent fill-gray-300 font-semibold text-gray-300 hover:fill-gray-100 hover:text-gray-100 md:text-base">
										<div className="flex items-center text-inherit drop-shadow-[2px_5px_5px_rgb(0,0,0)]">
											<AiFillQuestionCircle className="mr-2 fill-inherit" size={18} />
											Show image
										</div>
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
									<span className="flex items-center text-inherit">
										<AiFillQuestionCircle className="mr-2 fill-inherit" size={18} />
										Show next two verses
									</span>
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
										className="mb-4 mt-4 cursor-pointer border-2 border-white bg-gray-1000 px-4 py-2 text-lg font-semibold hover:enabled:bg-white hover:enabled:text-black disabled:border-gray-400 disabled:text-gray-400"
									/>
									<input
										value="Give up"
										type="button"
										onClick={(e) => {
											e.preventDefault();

											setIsCorrect(false);
											setIsGuessed(true);
										}}
										className="mb-4 mt-4 cursor-pointer border-2 border-red-600 bg-gray-1000 px-4 py-2 text-lg font-semibold text-red-600 hover:enabled:bg-red-600 hover:enabled:text-black disabled:border-red-900 disabled:text-red-900"
									/>
								</div>
							</form>
						)}
						{isGuessed ? (
							<>
								<div className="mb-4 flex gap-4">
									<button
										disabled={!allowNext || isLoading}
										onClick={() => {
											setIsLoading(true);
											router.reload();
										}}
										className="mt-4 cursor-pointer border-2 border-white px-4 py-2 text-lg font-semibold hover:enabled:bg-white hover:enabled:text-black disabled:border-gray-400 disabled:text-gray-400"
									>
										Try again {time > 0 ? `(${time})` : ''}
									</button>
									<button
										onClick={() => router.push('/')}
										className="mt-4 cursor-pointer border-2 border-white px-4 py-2 text-lg font-semibold hover:enabled:bg-white hover:enabled:text-black disabled:border-gray-400 disabled:text-gray-400"
									>
										Back
									</button>
								</div>
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
	const session = await getServerSession(context.req, context.res, authOptions);

	if (!session) {
		return {
			redirect: {
				destination: '/',
			},
			props: {},
		};
	}

	try {
		let i = 3;
		let randomSong: { randomTrack: string; previewUrl: string; url: string; id: string; artist: string };

		let lyricsObj: Lyrics | null;

		do {
			let random = Math.round(Math.random());
			if (random == 0) {
				randomSong = await getRandomSongFromUserLastTracks(session.token);
			} else {
				randomSong = await getRandomSongFromUserLastArists(session.token);
			}

			lyricsObj = await getLyrics(randomSong.randomTrack, randomSong.artist);

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
