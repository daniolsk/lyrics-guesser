import Image from 'next/image';
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

export default function Guess({ song, queryArtist }: { song: SongObj; queryArtist: string }) {
	return (
		<main className="flex min-h-screen flex-col items-center p-24">
			<Image
				src={song.songImageArt ? song.songImageArt : song.songImage}
				width={300}
				height={300}
				alt="song image"
				className="mb-8"
			/>
			<div className="font-semibold mb-4 text-2xl">
				{song.songTitle} by {song.songArtist}
			</div>
			<div className="text-center italic">
				<div className="text-xl">{song.firstVerse}</div>
				<div className="text-xl">{song.secondVerse}</div>
			</div>
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

	let artist = context.query?.artist ? context.query.artist : 'Kukon';

	const randomSong: string = await getRandomArtistTrack(artist as string);

	let lyricsObj: SongObj = await getLyrics(randomSong, artist as string);

	return {
		props: {
			song: lyricsObj,
			queryArtist: artist,
		},
	};
};
