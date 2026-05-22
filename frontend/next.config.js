module.exports = {
	experimental: {
		externalDir: true,
	},
	images: {
		remotePatterns: [
			{ protocol: 'https', hostname: 'lh3.googleusercontent.com' },
			{ protocol: 'https', hostname: 'media.api-sports.io' },
		],
	},
	async redirects() {
		return [
			{
				source: '/',
				destination: '/wc2026',
				permanent: true,
			},
		];
	},
};
