import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
	// Provide the path to your Next.js app to load next.config.js and .env files in your test environment
	dir: './',
});

const customJestConfig: Config = {
	testEnvironment: 'jest-environment-jsdom',
	setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
	maxWorkers: 4,
	moduleNameMapper: {
		'^@/components/(.*)$': '<rootDir>/components/$1',
		'^components/(.*)$': '<rootDir>/src/components/$1',
		'^helpers/(.*)$': '<rootDir>/src/helpers/$1',
		'^generated/(.*)$': '<rootDir>/src/generated/$1',
		'^mixins/(.*)$': '<rootDir>/src/mixins/$1',
		'^hooks/(.*)$': '<rootDir>/src/hooks/$1',
		'^mocks/(.*)$': '<rootDir>/src/__mocks__/$1',
	},

	modulePaths: ['<rootDir>/src/'],
	collectCoverage: true,
	collectCoverageFrom: [
		'<rootDir>/components/**/*.tsx',
		'<rootDir>/pages/**',
		'<rootDir>/context/**/*.{ts,tsx}',
		'<rootDir>/hooks/**/*.{ts,tsx}',
		'<rootDir>/lib/**/*.{ts,tsx}',
		'<rootDir>/components/**/stories.tsx',
		'<rootDir>/components/**/index.ts',
	],
	coveragePathIgnorePatterns: ['.*__snapshots__/.*'],
	coverageReporters: ['json', 'lcov', 'text', 'clover'],
	coverageDirectory: '<rootDir>/coverage',
	coverageThreshold: {
		global: {
			statements: 7,
			branches: 2.17,
			functions: 4.8,
			lines: 6.4,
		},
	},
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(customJestConfig);
