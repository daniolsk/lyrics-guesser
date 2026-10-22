import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	reactStrictMode: true,
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'images.genius.com',
			},
			{
				protocol: 'https',
				hostname: 'images.rapgenius.com',
			},
			{
				protocol: 'https',
				hostname: 'assets.genius.com',
			},
			{
				protocol: 'https',
				hostname: 'i.scdn.co',
			},
		],
	},
};

export default nextConfig;
