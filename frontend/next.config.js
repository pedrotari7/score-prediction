module.exports = {
	experimental: {
		externalDir: true,
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
