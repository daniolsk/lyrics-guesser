import { GetServerSideProps } from 'next';
import { getUsersPlaylists } from '@/utils/spotify';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]';

export default function Guess({ playlists }: any) {
	return (
		<div>
			{playlists.map((playlist: any, i: number) => (
				<div key={i}>{playlist.name}</div>
			))}
		</div>
	);
}

export const getServerSideProps: GetServerSideProps = async (context) => {
	const session = await getServerSession(context.req, context.res, authOptions);

	let playlists;

	if (session) {
		playlists = await getUsersPlaylists(session.token);
	}

	return {
		props: {
			playlists: playlists,
		},
	};
};
