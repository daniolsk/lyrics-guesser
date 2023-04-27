/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	images: {
		domains: ['images.genius.com', 'images.rapgenius.com', 'assets.genius.com'],
	},
};

module.exports = nextConfig;
