'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AiOutlineInfoCircle, AiFillQuestionCircle } from 'react-icons/ai';

import { Song } from '@/utils/types';
import { isCorrectGuess } from '@/utils/matchTitle';
import { addNoLyricsSongs, addSeenSong, getNoLyricsSongs, getSeenSongs } from '@/utils/seenSongs';
import Footer from '@/components/ui/Footer';
import Loading from '@/components/ui/Loading';

const DEFAULT_ERROR = 'Something went wrong on our side. Try again in a moment.';
const CONNECTION_ERROR = "Couldn't reach the server. Check your internet connection and try again.";
const TIMEOUT_ERROR = 'Finding a song took too long. Try again.';

const requestSong = async (
	artist: string,
	market: string | undefined,
	signal?: AbortSignal,
): Promise<{ song: Song } | { error: string }> => {
	const params = new URLSearchParams({ artist });
	if (market) {
		params.set('market', market);
	}
	const seenSongs = getSeenSongs(artist);
	if (seenSongs.length) {
		params.set('seen', seenSongs.join(','));
	}
	const noLyricsSongs = getNoLyricsSongs(artist);
	if (noLyricsSongs.length) {
		params.set('noLyrics', noLyricsSongs.join(','));
	}

	let response: Response;
	try {
		response = await fetch(`/api/guess?${params.toString()}`, { signal });
	} catch {
		return { error: CONNECTION_ERROR };
	}

	// Timeouts and crashes from the hosting platform may not return JSON.
	const data = await response.json().catch(() => null);

	if (Array.isArray(data?.noLyricsSongs)) {
		addNoLyricsSongs(artist, data.noLyricsSongs);
	}

	if (response.ok && data?.song) {
		return { song: data.song };
	}

	if (data?.error) {
		return { error: data.error };
	}

	return { error: response.status === 504 ? TIMEOUT_ERROR : DEFAULT_ERROR };
};

export default function Guess({ artist, market }: { artist: string; market?: string }) {
	const router = useRouter();

	const [song, setSong] = useState<Song>();
	const [error, setError] = useState<string>();
	const [isLoading, setIsLoading] = useState(true);

	const [time, setTime] = useState(5);
	const [allowNext, setAllowNext] = useState(false);
	const [guess, setGuess] = useState('');
	const [isGuessed, setIsGuessed] = useState(false);
	const [isCorrect, setIsCorrect] = useState<boolean>();
	const [showImg, setShowImg] = useState(false);
	const [showNextVerses, setShowNextVerses] = useState(false);

	const fetchIdRef = useRef(0);

	const loadSong = useCallback(
		(signal?: AbortSignal) => {
			const fetchId = ++fetchIdRef.current;

			return requestSong(artist, market, signal).then((result) => {
				if (signal?.aborted || fetchId !== fetchIdRef.current) {
					return;
				}

				if ('song' in result) {
					addSeenSong(artist, result.song.songKey);
					setSong(result.song);
				} else {
					setError(result.error);
				}
				setIsLoading(false);
			});
		},
		[artist, market],
	);

	const fetchNextSong = () => {
		setIsLoading(true);
		setError(undefined);
		setSong(undefined);
		setTime(5);
		setAllowNext(false);
		setGuess('');
		setIsGuessed(false);
		setIsCorrect(undefined);
		setShowImg(false);
		setShowNextVerses(false);

		void loadSong();
	};

	useEffect(() => {
		const abortController = new AbortController();
		void loadSong(abortController.signal);

		return () => {
			abortController.abort();
		};
	}, [loadSong]);

	const songId = song?.id;

	useEffect(() => {
		if (!songId) {
			return;
		}

		const interval = setInterval(() => {
			setTime((currentTime) => {
				if (currentTime - 1 <= 0) {
					clearInterval(interval);
					setAllowNext(true);
				}
				return currentTime - 1;
			});
		}, 1000);

		return () => {
			clearInterval(interval);
		};
	}, [songId]);

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!song) {
			return;
		}

		setIsCorrect(isCorrectGuess(guess, song.songTitle));

		setIsGuessed(true);
	};

	return (
		<div
			className={`flex min-h-[100svh] flex-col justify-between bg-[url('/bg.svg')] bg-[length:160rem] bg-top bg-repeat ${
				isGuessed ? `${isCorrect ? 'bg-green-1000' : 'bg-red-1000'}` : ''
			}`}
		>
			<main className="flex flex-1 flex-col items-center justify-center p-5 pb-0">
				{isLoading ? (
					<div className="flex flex-col items-center">
						<div className="mb-6 hidden items-center justify-center md:flex">
							<h1 className="ml-2 flex items-center text-2xl font-semibold">
								<AiOutlineInfoCircle className="mr-2" size={28} />
								Guess the song title
							</h1>
						</div>
						<Loading />
					</div>
				) : error || !song ? (
					<div className="flex flex-col items-center">
						<div className="mb-4 text-center text-xl font-bold md:text-3xl">Error:</div>
						<div className="mb-2 text-center text-base font-semibold md:text-xl">
							{error ?? DEFAULT_ERROR}
						</div>
						<div className="flex gap-4">
							<button
								onClick={fetchNextSong}
								className="mt-4 mb-8 cursor-pointer border-2 border-white px-4 py-2 text-lg font-semibold hover:enabled:bg-white hover:enabled:text-black! disabled:border-gray-500 disabled:text-gray-500"
							>
								Try again
							</button>
							<button
								onClick={() => router.push('/')}
								className="mt-4 mb-8 cursor-pointer border-2 border-white px-4 py-2 text-lg font-semibold hover:enabled:bg-white hover:enabled:text-black! disabled:border-gray-500 disabled:text-gray-500"
							>
								Back
							</button>
						</div>
					</div>
				) : (
					<div className="flex w-full flex-col items-center">
						<div className="mb-6 hidden items-center justify-center md:flex">
							<h1 className="ml-2 flex items-center text-2xl font-semibold">
								<AiOutlineInfoCircle className="mr-2" size={28} />
								Guess the song title
							</h1>
						</div>
						{isGuessed ? (
							<Link href={song.url} target="_blank" className="mt-4 mb-10 bg-gray-1000">
								<div className="relative h-60 w-60 cursor-pointer rounded-md p-4 sm:h-72 sm:w-72">
									<Image
										fill
										onContextMenu={(e) => e.preventDefault()}
										src={song.songImage}
										priority
										quality={75}
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
								className="relative mt-4 mb-10 h-60 w-60 bg-gray-1000 p-4 sm:h-72 sm:w-72"
								onClick={() => setShowImg(true)}
							>
								{showImg ? (
									''
								) : (
									<div className="absolute top-0 left-0 z-10 flex h-full w-full cursor-pointer items-center justify-center bg-transparent fill-gray-300 font-semibold text-gray-300 hover:fill-gray-100 hover:text-gray-100 md:text-base">
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
									quality={75}
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
											{index === 1 ? '"' : ''}
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
									<div className="mb-1 text-center text-3xl font-bold md:text-4xl">
										&quot;{song.songTitle}&quot;
									</div>
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
										disabled={isGuessed || guess.length === 0}
										value="Check"
										type="submit"
										className="mt-4 mb-4 cursor-pointer border-2 border-white bg-gray-1000 px-4 py-2 text-lg font-semibold hover:enabled:bg-white hover:enabled:text-black! disabled:border-gray-400 disabled:text-gray-400"
									/>
									<input
										value="Give up"
										type="button"
										onClick={(e) => {
											e.preventDefault();

											setIsCorrect(false);
											setIsGuessed(true);
										}}
										className="mt-4 mb-4 cursor-pointer border-2 border-red-600 bg-gray-1000 px-4 py-2 text-lg font-semibold text-red-600 hover:enabled:bg-red-600 hover:enabled:text-black! disabled:border-red-900 disabled:text-red-900"
									/>
								</div>
							</form>
						)}
						{isGuessed ? (
							<>
								<div className="mb-4 flex gap-4">
									<button
										disabled={!allowNext || isLoading}
										onClick={fetchNextSong}
										className="mt-4 cursor-pointer border-2 border-white px-4 py-2 text-lg font-semibold hover:enabled:bg-white hover:enabled:text-black! disabled:border-gray-400 disabled:text-gray-400"
									>
										Try again {time > 0 ? `(${time})` : ''}
									</button>
									<button
										onClick={() => router.push('/')}
										className="mt-4 cursor-pointer border-2 border-white px-4 py-2 text-lg font-semibold hover:enabled:bg-white hover:enabled:text-black! disabled:border-gray-400 disabled:text-gray-400"
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
