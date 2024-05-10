module.exports = {
	experimental: {
		externalDir: true,
	},
	async redirects() {
		console.log('redirects');
		return [
			{
				source: '/',
				destination: '/euro2024',
				permanent: true,
			},
		];
	},
};
