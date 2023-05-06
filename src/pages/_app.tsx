import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';

import NextNProgress from 'nextjs-progressbar';

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
	return (
		<SessionProvider session={session}>
			<NextNProgress color="#dc2626" height={3} showOnShallow={true} options={{ showSpinner: false }} />
			<Component {...pageProps} />
		</SessionProvider>
	);
}
