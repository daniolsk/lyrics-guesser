/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	images: {
		domains: ['images.genius.com', 'images.rapgenius.com'],
	},
};

module.exports = nextConfig;
