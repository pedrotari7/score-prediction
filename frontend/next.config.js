module.exports = {
	experimental: {
		externalDir: true,
	},
	async redirects() {
		return [
			{
				source: '/',
				destination: '/euro2024',
				permanent: true,
			},
		];
	},
};
