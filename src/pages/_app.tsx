import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import Router from 'next/router';
import Script from 'next/script';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import * as gtag from '../utils/gtag';

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
	const router = useRouter();
	useEffect(() => {
		const handleRouteChange = (url: string) => {
			gtag.pageview(url);
		};
		router.events.on('routeChangeComplete', handleRouteChange);
		return () => {
			router.events.off('routeChangeComplete', handleRouteChange);
		};
	}, [router.events]);
	return (
		<>
			<Head>
				<link rel="icon" href="/favicon.svg" />
				<script
					async
					src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3539636730894037"
					crossOrigin="anonymous"
				></script>
				<script
					dangerouslySetInnerHTML={{
						__html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());

              gtag('config', 'G-4GF7769HMD', {
                page_path: window.location.pathname,
              });
            `,
					}}
				/>
			</Head>
			{/* Global Site Tag (gtag.js) - Google Analytics */}
			<Script strategy="afterInteractive" src={`https://www.googletagmanager.com/gtag/js?id=G-4GF7769HMD`} />
			<SessionProvider session={session}>
				<Component {...pageProps} />
			</SessionProvider>
		</>
	);
}
