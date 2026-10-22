import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	reactStrictMode: true,
	images: {
		// Spotify already serves album covers in fixed sizes from its CDN, and optimizing them
		// would use up Vercel's image optimization quota.
		unoptimized: true,
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'i.scdn.co',
			},
		],
	},
};

export default nextConfig;
