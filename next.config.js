/** @type {import('next').NextConfig} */
const nextConfig = {
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

module.exports = nextConfig;
