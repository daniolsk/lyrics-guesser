import Image from 'next/image';
import { GetServerSideProps } from 'next';

import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });

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

export default function Home({ song, queryArtist }: { song: SongObj; queryArtist: string }) {
	return (
		<main className={`flex min-h-screen flex-col items-center p-24 ${inter.className}`}>
			<div className="mb-4">Random song for {queryArtist}</div>
			<Image
				src={song.songImageArt ? song.songImageArt : song.songImage}
				width={300}
				height={300}
				alt="song image"
				className="mb-4"
			/>
			<div className="font-semibold mb-4">
				{song.songTitle} by {song.songArtist}
			</div>
			<div>&quot;{song.firstVerse}</div>
			<div>{song.secondVerse}&quot;</div>
		</main>
	);
}

export const getServerSideProps: GetServerSideProps = async (context) => {
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
