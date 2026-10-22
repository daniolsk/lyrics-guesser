'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AiOutlineInfoCircle } from 'react-icons/ai';

import { Song } from '@/utils/types';
import { blankVerse, isCorrectWord, LyricsPart } from '@/utils/blankLyrics';
import { addSeenSong } from '@/utils/seenSongs';
import { DEFAULT_ERROR, requestSong } from '@/utils/requestSong';
import Footer from '@/components/ui/Footer';
import Loading from '@/components/ui/Loading';

type Round = {
	song: Song;
	// Which of the two shown verses has the gaps.
	blankedVerse: 'first' | 'second';
	parts: LyricsPart[];
	answers: string[];
};

// Gaps go in the second verse so the first one sets the scene, unless it has no words to hide.
// When neither verse has a gap worth guessing, any single word of the second one will do.
const createRound = (song: Song): Round => {
	const secondParts = blankVerse(song.secondVerse);
	const firstParts = secondParts ? null : blankVerse(song.firstVerse);
	const parts = secondParts ??
		firstParts ??
		blankVerse(song.secondVerse, 1) ?? [{ text: song.secondVerse }];
	return {
		song,
		blankedVerse: firstParts ? 'first' : 'second',
		parts,
		answers: parts.flatMap((part) => ('answer' in part ? [part.answer] : [])),
	};
};

export default function FillLyrics({ artist, market }: { artist: string; market?: string }) {
	const router = useRouter();

	const [round, setRound] = useState<Round>();
	const [error, setError] = useState<string>();
	const [isLoading, setIsLoading] = useState(true);

	const [time, setTime] = useState(5);
	const [allowNext, setAllowNext] = useState(false);
	const [guesses, setGuesses] = useState<string[]>([]);
	const [isGuessed, setIsGuessed] = useState(false);
	const [results, setResults] = useState<boolean[]>([]);

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
					const newRound = createRound(result.song);
					setRound(newRound);
					setGuesses(newRound.answers.map(() => ''));
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
		setRound(undefined);
		setTime(5);
		setAllowNext(false);
		setGuesses([]);
		setIsGuessed(false);
		setResults([]);

		void loadSong();
	};

	useEffect(() => {
		const abortController = new AbortController();
		void loadSong(abortController.signal);

		return () => {
			abortController.abort();
		};
	}, [loadSong]);

	const songId = round?.song.id;

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

		if (!round || isGuessed) {
			return;
		}

		setResults(round.answers.map((answer, index) => isCorrectWord(guesses[index] ?? '', answer)));
		setIsGuessed(true);
	};

	const giveUp = () => {
		if (!round) {
			return;
		}

		setResults(round.answers.map(() => false));
		setIsGuessed(true);
	};

	const isCorrect = results.length > 0 && results.every(Boolean);
	const correctCount = results.filter(Boolean).length;

	const renderBlankedVerse = (parts: LyricsPart[]) =>
		parts.map((part, index) => {
			if ('text' in part) {
				return <span key={index}>{part.text}</span>;
			}

			if (isGuessed) {
				const guess = guesses[part.blank]?.trim();
				return results[part.blank] ? (
					<span key={index} className="text-green-400">
						{part.answer}
					</span>
				) : (
					<span key={index}>
						{guess ? <s className="mr-1 text-gray-400">{guess}</s> : ''}
						<span className="text-red-400">{part.answer}</span>
					</span>
				);
			}

			return (
				<input
					key={index}
					type="text"
					aria-label={`Missing word ${part.blank + 1}`}
					autoFocus={part.blank === 0}
					autoComplete="off"
					autoCapitalize="none"
					spellCheck={false}
					value={guesses[part.blank] ?? ''}
					onChange={(e) =>
						setGuesses((current) =>
							current.map((guess, blank) => (blank === part.blank ? e.target.value : guess)),
						)
					}
					// Sized to the hidden word, a hint like the gaps in a crossword.
					style={{ width: `${Math.max(part.answer.length, 2) + 1}ch` }}
					className="mx-1 border-b-2 bg-transparent text-center font-semibold italic focus:outline-hidden active:outline-hidden"
				/>
			);
		});

	const header = (
		<div className="mb-6 hidden items-center justify-center md:flex">
			<h1 className="ml-2 flex items-center text-2xl font-semibold">
				<AiOutlineInfoCircle className="mr-2" size={28} />
				Fill in the missing lyrics
			</h1>
		</div>
	);

	return (
		<div
			className={`flex min-h-[100svh] flex-col justify-between bg-[url('/bg.svg')] bg-[length:160rem] bg-top bg-repeat ${
				isGuessed ? `${isCorrect ? 'bg-green-1000' : 'bg-red-1000'}` : ''
			}`}
		>
			<main className="flex flex-1 flex-col items-center justify-center p-5 pb-0">
				{isLoading ? (
					<div className="flex flex-col items-center">
						{header}
						<Loading />
					</div>
				) : error || !round ? (
					<div className="flex flex-col items-center">
						<div className="mb-4 text-center text-xl font-bold md:text-3xl">Error:</div>
						<div className="mb-2 text-center text-base font-semibold md:text-xl">
							{error ?? DEFAULT_ERROR}
						</div>
						<div className="flex gap-4">
							<button
								onClick={fetchNextSong}
								className="mt-4 mb-8 cursor-pointer border-2 border-white px-4 py-2 text-lg font-semibold hover:enabled:bg-white hover:enabled:text-black disabled:border-gray-500 disabled:text-gray-500"
							>
								Try again
							</button>
							<button
								onClick={() => router.push('/?mode=lyrics')}
								className="mt-4 mb-8 cursor-pointer border-2 border-white px-4 py-2 text-lg font-semibold hover:enabled:bg-white hover:enabled:text-black disabled:border-gray-500 disabled:text-gray-500"
							>
								Back
							</button>
						</div>
					</div>
				) : (
					<div className="flex w-full flex-col items-center">
						{header}
						<Link href={round.song.url} target="_blank" className="mt-4 mb-6 bg-gray-1000">
							<div className="relative h-60 w-60 cursor-pointer rounded-md p-4 sm:h-72 sm:w-72">
								<Image
									fill
									onContextMenu={(e) => e.preventDefault()}
									src={round.song.songImage}
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
						<div className="mb-6 flex flex-col items-center">
							<div className="mb-1 text-center text-3xl font-bold md:text-4xl">
								&quot;{round.song.songTitle}&quot;
							</div>
							<div className="flex justify-center text-base font-semibold md:text-lg">
								by {round.song.songArtistNames ? round.song.songArtistNames : round.song.songArtist}
							</div>
						</div>
						<form className="flex flex-col items-center" onSubmit={(e) => handleSubmit(e)}>
							<div className="mb-6 text-center font-semibold italic">
								<div className="text-base sm:text-lg md:text-xl">
									&quot;
									{round.blankedVerse === 'first'
										? renderBlankedVerse(round.parts)
										: round.song.firstVerse}
								</div>
								<div className="text-base sm:text-lg md:text-xl">
									{round.blankedVerse === 'second'
										? renderBlankedVerse(round.parts)
										: round.song.secondVerse}
								</div>
								{round.song.nextVerses.map((verse, index) => (
									<div key={index} className="text-base sm:text-lg md:text-xl">
										{verse}
										{index === 1 ? '"' : ''}
									</div>
								))}
							</div>
							{isGuessed ? (
								<div className="my-2 text-center text-2xl font-bold md:text-3xl">
									{correctCount}/{round.answers.length}{' '}
									{round.answers.length === 1 ? 'word' : 'words'} correct
								</div>
							) : (
								<div className="flex gap-4">
									<input
										disabled={guesses.some((guess) => guess.trim().length === 0)}
										value="Check"
										type="submit"
										className="mt-4 mb-4 cursor-pointer border-2 border-white bg-gray-1000 px-4 py-2 text-lg font-semibold hover:enabled:bg-white hover:enabled:text-black disabled:border-gray-400 disabled:text-gray-400"
									/>
									<input
										value="Give up"
										type="button"
										onClick={(e) => {
											e.preventDefault();
											giveUp();
										}}
										className="mt-4 mb-4 cursor-pointer border-2 border-red-600 bg-gray-1000 px-4 py-2 text-lg font-semibold text-red-600 hover:enabled:bg-red-600 hover:enabled:text-black disabled:border-red-900 disabled:text-red-900"
									/>
								</div>
							)}
						</form>
						{isGuessed ? (
							<div className="mb-4 flex gap-4">
								<button
									disabled={!allowNext || isLoading}
									onClick={fetchNextSong}
									className="mt-4 cursor-pointer border-2 border-white px-4 py-2 text-lg font-semibold hover:enabled:bg-white hover:enabled:text-black disabled:border-gray-400 disabled:text-gray-400"
								>
									Try again {time > 0 ? `(${time})` : ''}
								</button>
								<button
									onClick={() => router.push('/?mode=lyrics')}
									className="mt-4 cursor-pointer border-2 border-white px-4 py-2 text-lg font-semibold hover:enabled:bg-white hover:enabled:text-black disabled:border-gray-400 disabled:text-gray-400"
								>
									Back
								</button>
							</div>
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
