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
							<Link href={song.url} target="_blank" className="mb-10">
								<div
									className="relative h-60 w-60 cursor-pointer rounded-md p-4 sm:h-72 sm:w-72"
									onClick={() => setShowImg(true)}
								>
									<Image
										fill
										onContextMenu={(e) => e.preventDefault()}
										src={song.songImageArt ? song.songImageArt : song.songImage}
										priority
										quality={100}
										sizes="(max-width: 640px) 288px, 240px"
										alt="song image"
										className={`object-cover shadow-[4.0px_8.0px_8.0px_rgba(0,0,0,0.38)] ${
											isGuessed || showImg ? `` : `blur-lg grayscale`
										}`}
									/>
								</div>
							</Link>
						) : (
							<div
								className={`relative mb-12 h-60 w-60 ${showImg ? '' : 'cursor-pointer'} rounded-md p-4 sm:h-72 sm:w-72`}
								onClick={() => setShowImg(true)}
							>
								{showImg ? (
									''
								) : (
									<div className="absolute left-0 top-0 z-10 flex h-full w-full items-center justify-center bg-transparent fill-gray-300 font-semibold text-gray-300 hover:fill-gray-100 hover:text-gray-100 md:text-base">
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
									src={song.songImageArt ? song.songImageArt : song.songImage}
									priority
									quality={100}
									sizes="(max-width: 640px) 288px, 240px"
									alt="song image"
									className={`object-cover shadow-[4.0px_8.0px_8.0px_rgba(0,0,0,0.38)] ${
										isGuessed || showImg ? `` : `blur-lg grayscale`
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
								''
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
										className="mb-2 border-b-2 bg-transparent p-2 text-center text-xl font-semibold focus:outline-none  active:outline-none md:text-2xl"
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
									<Image src="/pause.svg" quality={100} width={40} height={40} alt="pause song" />
								) : (
									<Image src="/play.svg" quality={100} width={40} height={40} alt="play song" />
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
				{isLoading ? <Loading /> : ''}
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
