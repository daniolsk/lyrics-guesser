import NextAuth, { type NextAuthOptions } from 'next-auth';
import SpotifyProvider from 'next-auth/providers/spotify';

export const authOptions: NextAuthOptions = {
	providers: [
		SpotifyProvider({
			clientId: process.env.SPOTIFY_CLIENT_ID as string,
			clientSecret: process.env.SPOTIFY_CLIENT_SECRET as string,
			authorization: {
				params: { scope: 'user-top-read,user-library-read,user-read-recently-played' },
			},
		}),
	],
	pages: {
		signIn: '/auth/signin',
	},
	secret: process.env.NEXTAUTH_SECRET,
	session: {
		strategy: 'jwt',
		maxAge: 30 * 24 * 60 * 60,
	},
	jwt: {
		secret: process.env.NEXTAUTH_SECRET,
	},
	callbacks: {
		async jwt({ token, account }) {
			if (account) {
				token.accessToken = account.refresh_token;
			}

			return token;
		},
		async session({ session, token }) {
			session.token = token.accessToken as string;

			return session;
		},
	},
};

export default NextAuth(authOptions);
