import Image from 'next/image';

import Genius from 'genius-lyrics';

import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

type Props = {
	lyrics: string;
	title: string;
	image: string;
};

export default function Home({ lyrics }: { lyrics: Props }) {
	return (
		<main className={`flex min-h-screen flex-col items-center p-24 ${inter.className}`}>
			<div className="text-white text-xl">{lyrics.title}</div>
			<div className="text-white">{lyrics.lyrics}</div>
		</main>
	);
}

export const getServerSideProps = async () => {
	const Client = new Genius.Client();

	const retrieveLyrics = async (artist: string) => {
		const songs = await Client.songs.search(artist);

		console.log(songs);

		const indexSongs = Math.floor(Math.random() * Math.floor(songs.length));
		const lyrics = await songs[indexSongs].lyrics();
		const title = songs[indexSongs].fullTitle;
		const { image } = songs[indexSongs];

		const arrLyrics = lyrics.split('\n').filter((l: string) => l.length && l[0] !== '[');
		const indexLyrics = Math.floor(Math.random() * Math.floor(arrLyrics.length));

		return { lyrics: arrLyrics[indexLyrics], title, image };
	};

	const lyrics = await retrieveLyrics('kukon');

	return {
		props: {
			lyrics,
		},
	};
};
