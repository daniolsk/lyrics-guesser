import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import Router from 'next/router';
import Script from 'next/script';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function App({
	Component,
	pageProps: { session, ...pageProps },
}: AppProps) {
	return (
		<>
			<Head>
				<link rel='icon' href='/favicon.svg' />
			</Head>
			<SessionProvider session={session}>
				<Component {...pageProps} />
			</SessionProvider>
		</>
	);
}
