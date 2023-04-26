import { FormEvent, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';

import { getLyrics } from '@/utils/lyrics';
import { getRandomArtistTrack } from '@/utils/spotify';

type SongObj = {
	firstVerse: string;
	secondVerse: string;
	songTitle: string;
	songImage: string;
	songArtist: string;
	songImageArt: string;
};

export default function Guess({ song, queryArtist, error }: { song: SongObj; queryArtist: string; error?: string }) {
	const router = useRouter();

	const [guess, setGuess] = useState('');
	const [isGuessed, setIsGuessed] = useState(false);
	const [isCorrect, setIsCorrect] = useState<Boolean>();

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsGuessed(true);

		console.log(guess, song.songTitle);

		if (guess.toUpperCase() == song.songTitle.toUpperCase()) {
			setIsCorrect(true);
		} else {
			setIsCorrect(false);
		}
	};

	return (
		<main className={`flex min-h-screen flex-col items-center p-24 ${isGuessed ? `${isCorrect ? 'bg-green-900' : 'bg-red-900'}` : ''}`}>
			{error ? (
				<div>{error}</div>
			) : (
				<div className="flex flex-col items-center">
					<Image
						src={song.songImageArt ? song.songImageArt : song.songImage}
						width={300}
						height={300}
						alt="song image"
						className={`mb-16 ${!isGuessed ? `grayscale blur-lg` : ``}`}
					/>
					<div className="text-center italic mb-10">
						<div className="text-2xl">&quot;{song.firstVerse}</div>
						<div className="text-2xl">{song.secondVerse}&quot;</div>
					</div>
					<form className="font-semibold flex flex-col items-center" onSubmit={(e) => handleSubmit(e)}>
						<input
							type="text"
							className="bg-transparent border-b-2 text-3xl text-center p-4 mb-2"
							value={guess}
							onChange={(e) => setGuess(e.target.value)}
						/>
						<div className="flex justify-center text-2xl mb-8"> by {song.songArtist}</div>
						<input
							disabled={isGuessed || guess.length == 0}
							value="Check"
							type="submit"
							className="border-white border-2 px-4 py-2 cursor-pointer text-xl hover:bg-white hover:text-black"
						/>
					</form>
					{isGuessed ? (
						<button
							onClick={() => router.reload()}
							className="border-white border-2 mt-4 px-4 py-2 cursor-pointer text-xl hover:bg-white hover:text-black"
						>
							Try again
						</button>
					) : (
						''
					)}
				</div>
			)}
		</main>
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

	let artist = context.query.artist;

	try {
		const randomSong: string = await getRandomArtistTrack(artist as string);

		let lyricsObj: SongObj = await getLyrics(randomSong, artist as string);

		return {
			props: {
				song: lyricsObj,
				queryArtist: artist,
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
