import type { Config } from 'jest';

const customJestConfig: Config = {
	testEnvironment: 'node',
	roots: ['<rootDir>/shared/'],
	transform: {
		'^.+\\.tsx?$': 'ts-jest',
	},
	collectCoverage: true,
	collectCoverageFrom: ['<rootDir>/shared/**/*.ts'],
	coveragePathIgnorePatterns: ['.*__snapshots__/.*'],
	coverageReporters: ['json', 'lcov', 'text', 'clover'],
	coverageDirectory: '<rootDir>/coverage',
	coverageThreshold: {
		global: {
			statements: 0,
			branches: 0,
			functions: 0,
			lines: 0,
		},
	},
};

export default customJestConfig;
