//@ts-nocheck
import { getToken } from '@/utils/spotify';
import NextAuth from 'next-auth';
import SpotifyProvider from 'next-auth/providers/spotify';
import { TokenFlags } from 'typescript';

export const authOptions = {
	// Configure one or more authentication providers
	providers: [
		SpotifyProvider({
			clientId: process.env.SPOTIFY_CLIENT_ID as string,
			clientSecret: process.env.SPOTIFY_CLIENT_SECRET as string,
		}),
		// ...add more providers here
	],
	secret: process.env.NEXTAUTH_SECRET,
	session: {
		strategy: 'jwt',
		maxAge: 30 * 24 * 60 * 60,
	},
	jwt: {
		secret: process.env.NEXTAUTH_SECRET,
		encryption: true,
	},
	callbacks: {
		jwt: async ({ token, account }) => {
			if (account) {
				token.accessToken = account.refresh_token;
			}

			return token;
		},
		session: async ({ session, token }) => {
			session.token = token;

			return session;
		},
	},
};

export default NextAuth(authOptions);
