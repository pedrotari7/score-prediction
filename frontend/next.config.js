const path = require('path');
const { execSync } = require('child_process');

const gitCommitHash = execSync('git rev-parse --short HEAD').toString().trim();
const buildTimestamp = new Date().toISOString();

module.exports = {
	env: {
		NEXT_PUBLIC_GIT_COMMIT_HASH: gitCommitHash,
		NEXT_PUBLIC_BUILD_TIMESTAMP: buildTimestamp,
	},
	outputFileTracingRoot: path.join(__dirname, '../'),
	experimental: {
		externalDir: true,
		instrumentationHook: true,
	},
	images: {
		remotePatterns: [
			{ protocol: 'https', hostname: 'lh3.googleusercontent.com' },
			{ protocol: 'https', hostname: 'media.api-sports.io' },
			{ protocol: 'https', hostname: '*.api-sports.io' },
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
