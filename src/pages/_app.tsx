import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import Router from 'next/router';
import Script from 'next/script';

Router.events.on('routeChangeStart', () => console.log('1'));
Router.events.on('routeChangeComplete', () => console.log('2'));
Router.events.on('routeChangeError', () => console.log('3'));

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
	return (
		<SessionProvider session={session}>
			<Script
				async
				src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3539636730894037"
				crossOrigin="anonymous"
			/>
			<Component {...pageProps} />
		</SessionProvider>
	);
}
