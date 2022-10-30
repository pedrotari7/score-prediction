module.exports = {
	experimental: {
		externalDir: true,
	},
	async redirects() {
		return [
			{
				source: '/',
				destination: '/wc2022',
				permanent: true,
			},
		];
	},
};
