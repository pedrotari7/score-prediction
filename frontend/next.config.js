const path = require('path');

module.exports = {
	outputFileTracingRoot: path.join(__dirname, '../'),
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
