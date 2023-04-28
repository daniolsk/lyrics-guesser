import NextAuth from 'next-auth';

declare module 'next-auth' {
	interface Session {
		token: string;
		user: {
			email: string;
			image: string;
			name: string;
		};
		expires: string;
	}
}
