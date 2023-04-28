import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import { getUsersPlaylists } from '@/utils/spotify';

export default function Guess() {
	return (
		<div>
			<div>test</div>
		</div>
	);
}

export const getServerSideProps: GetServerSideProps = async (context) => {
	//@ts-ignore
	const session = await getServerSession(context.req, context.res, authOptions);

	//@ts-ignore
	if (session && session.token) {
		//@ts-ignore
		let playlists = await getUsersPlaylists(session.token.accessToken);
		console.log(playlists);
	}

	return {
		props: {},
	};
};
