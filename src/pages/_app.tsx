import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import Router from 'next/router';

Router.events.on('routeChangeStart', () => console.log('1'));
Router.events.on('routeChangeComplete', () => console.log('2'));
Router.events.on('routeChangeError', () => console.log('3'));

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
	return (
		<SessionProvider session={session}>
			<Component {...pageProps} />
		</SessionProvider>
	);
}
