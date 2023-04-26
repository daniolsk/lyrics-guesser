import { FormEvent, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import stringSim from 'string-similarity';

import useAudio from '@/components/useAudio';
import { getLyrics } from '@/utils/lyrics';
import { getRandomArtistTrack } from '@/utils/spotify';
import Loading from '@/components/Loading';
import { type LyricsObj, type SongObj } from '@/utils/types';

export default function Guess({ song, error }: { song: SongObj; error?: string }) {
	const router = useRouter();

	const [guess, setGuess] = useState('');
	const [isGuessed, setIsGuessed] = useState(false);
	const [isCorrect, setIsCorrect] = useState<Boolean>();
	const [isLoading, setIsLoading] = useState(false);
	const [showImg, setShowImg] = useState(false);
	const [showNextVerses, setShowNextVerses] = useState(false);

	const { playing, toggle } = useAudio(song ? song.previewUrl : '');

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsGuessed(true);

		const sim = stringSim.compareTwoStrings(guess.toUpperCase(), song.songTitle.toUpperCase());

		console.log(sim);

		if (sim >= 0.75) {
			setIsCorrect(true);
		} else {
			setIsCorrect(false);
		}
	};

	return (
		<div className={`flex min-h-[100svh] flex-col justify-between ${isGuessed ? `${isCorrect ? 'bg-green-900' : 'bg-red-900'}` : ''}`}>
			<main className="flex flex-1 flex-col items-center justify-center p-5 pb-0">
				{error ? (
					<div className="flex flex-col items-center">
						<div className="mb-4 text-xl">{error}</div>
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
					<div className="flex flex-col items-center">
						{isGuessed ? (
							<Link href={song.url} target="_blank" className="mb-6">
								<div className="relative h-60 w-60 cursor-pointer p-4 sm:h-72 sm:w-72" onClick={() => setShowImg(true)}>
									<Image
										fill
										onContextMenu={(e) => e.preventDefault()}
										src={song.songImageArt ? song.songImageArt : song.songImage}
										priority
										alt="song image"
										className={`rounded-md object-contain shadow-[4.0px_8.0px_8.0px_rgba(0,0,0,0.38)] ${
											isGuessed || showImg ? `` : `blur-lg grayscale`
										}`}
									/>
								</div>
							</Link>
						) : (
							<div className="relative mb-8 h-60 w-60 cursor-pointer p-4 sm:h-72 sm:w-72" onClick={() => setShowImg(true)}>
								{showImg || isGuessed ? (
									''
								) : (
									<div className="absolute left-0 top-0 z-10 flex h-full w-full items-center justify-center opacity-70 md:text-base">
										Hint: Click to reveal image
									</div>
								)}
								<Image
									fill
									onContextMenu={(e) => e.preventDefault()}
									src={song.songImageArt ? song.songImageArt : song.songImage}
									priority
									alt="song image"
									className={`rounded-md object-contain shadow-[4.0px_8.0px_8.0px_rgba(0,0,0,0.38)] ${
										isGuessed || showImg ? `` : `blur-lg grayscale`
									}`}
								/>
							</div>
						)}

						<div className="mb-6 text-center font-semibold italic">
							<div className="text-base sm:text-lg md:text-xl">{song.firstVerse}</div>
							<div className="text-base sm:text-lg md:text-xl">{song.secondVerse}</div>
							{showNextVerses ? (
								''
							) : (
								<button
									className="mt-2 text-sm text-gray-400 hover:text-gray-300 md:text-base"
									onClick={() => setShowNextVerses(true)}
								>
									Hint: Reveal next two verses
								</button>
							)}

							{showNextVerses ? (
								<>
									{song.nextVerses.map((verse, index) => (
										<div key={index} className="text-base sm:text-lg md:text-xl">
											{verse}
										</div>
									))}
								</>
							) : (
								''
							)}
						</div>
						<form className="flex flex-col items-center" onSubmit={(e) => handleSubmit(e)}>
							<div className="mb-2">
								{isGuessed ? (
									<div className="flex flex-col items-center">
										<div className="mb-1 text-center text-2xl font-bold md:text-3xl">&quot;{song.songTitle}&quot;</div>
									</div>
								) : (
									<input
										type="text"
										className="mb-2 border-b-2 bg-transparent p-2 text-center text-xl font-semibold md:text-2xl"
										value={guess}
										onChange={(e) => setGuess(e.target.value)}
									/>
								)}
								<div className="flex justify-center text-base font-semibold md:text-lg"> by {song.songArtist}</div>
							</div>
							{isGuessed ? (
								''
							) : (
								<input
									disabled={isGuessed || guess.length == 0}
									value="Check"
									type="submit"
									className="mb-4 mt-4 cursor-pointer border-2 border-white px-4 py-2 text-lg font-semibold hover:enabled:bg-white hover:enabled:text-black disabled:border-gray-500 disabled:text-gray-500"
								/>
							)}
						</form>
						{isGuessed && song.previewUrl ? (
							<button className="text-lg" onClick={toggle}>
								{playing ? (
									<Image src="/pause.svg" width={40} height={40} alt="pause song" />
								) : (
									<Image src="/play.svg" width={40} height={40} alt="play song" />
								)}
							</button>
						) : (
							''
						)}
						{isGuessed ? (
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
						) : (
							''
						)}
					</div>
				)}
				{isLoading ? <Loading textColor="white" /> : ''}
			</main>
			<footer className="p-4 text-center text-sm text-white">Made with ❤️ by Daniel Skowron</footer>
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

	try {
		const randomSong: { randomTrack: string; previewUrl: string; url: string } = await getRandomArtistTrack(artist);

		let lyricsObj: LyricsObj = await getLyrics(randomSong.randomTrack, artist);

		let songObj: SongObj = { ...lyricsObj, previewUrl: randomSong.previewUrl, url: randomSong.url };

		return {
			props: {
				song: songObj,
			},
		};
	} catch (error) {
		console.log(error);

		return {
			props: {
				error: 'Something went wrong',
			},
		};
	}
};
