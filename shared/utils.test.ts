import { Competition, Fixture, FixtureData, Prediction, Result, Score } from '../interfaces/main';
import {
	calculateUserResultPoints,
	DEFAULT_USER_RESULT,
	getExtraTimeResult,
	getOutcome,
	getResult,
	isEmpty,
	joinResults,
} from './utils';

describe('utils', () => {
	describe('isEmpty', () => {
		it('should isEmpty true', () => {
			expect(isEmpty({})).toBe(true);
		});

		it('should isEmpty false', () => {
			expect(isEmpty({ someKey: 'some value' })).toBe(false);
		});
	});
	describe('getOutcome', () => {
		it('should returns correct outcomes', () => {
			expect(getOutcome({ home: 0, away: 0 })).toBe('draw');
			expect(getOutcome({ home: 1, away: 0 })).toBe('winH');
			expect(getOutcome({ home: 0, away: 1 })).toBe('winA');
			expect(getOutcome({ home: 0 } as Result)).toBe(null);
			expect(getOutcome({ away: 0 } as Result)).toBe(null);
			expect(getOutcome({} as Result)).toBe(null);
		});
	});

	describe('getExtraTimeResult', () => {
		it('should return correct result', () => {
			expect(
				getExtraTimeResult({
					score: { fulltime: { home: 1, away: 1 }, extratime: { home: 0, away: 1 } } as Score,
					fixture: { status: { short: 'AET' } } as FixtureData,
					goals: { home: 1, away: 1 },
				} as Fixture)
			).toEqual({ home: 1, away: 2 });

			expect(
				getExtraTimeResult({
					score: {
						fulltime: { home: 1, away: 1 },
						extratime: { home: 2, away: 2 },
						penalty: { home: 4, away: 3 },
					} as Score,
					fixture: { status: { short: 'PEN' } } as FixtureData,
					goals: { home: 7, away: 6 },
				} as Fixture)
			).toEqual({ home: 3, away: 3 });

			expect(
				getExtraTimeResult({
					score: { fulltime: { home: 3, away: 2 } } as Score,
					fixture: { status: { short: 'FT' } } as FixtureData,
					goals: { home: 3, away: 2 },
				} as Fixture)
			).toEqual({ home: 3, away: 2 });
		});
	});

	describe('joinResults', () => {
		it('sums all fields from two partial results', () => {
			const a = { exact: 2, result: 1 };
			const b = { exact: 1, fail: 3 };
			const result = joinResults(a, b);
			expect(result.exact).toBe(3);
			expect(result.result).toBe(1);
			expect(result.fail).toBe(3);
			expect(result.points).toBe(0);
		});

		it('returns default when both are empty', () => {
			expect(joinResults({}, {})).toEqual(DEFAULT_USER_RESULT);
		});
	});

	describe('getResult', () => {
		const makeGame = (
			home: number,
			away: number,
			status = 'FT',
			penalty?: { home: number; away: number }
		): Fixture =>
			({
				score: {
					fulltime: { home, away },
					penalty: penalty ?? { home: null, away: null },
				} as Score,
				fixture: { status: { short: status } } as FixtureData,
				goals: { home, away },
			}) as Fixture;

		it('returns exact for exact score match', () => {
			const result = getResult({ home: 2, away: 1 }, makeGame(2, 1));
			expect(result.exact).toBe(1);
			expect(result.fail).toBeFalsy();
		});

		it('returns result for correct outcome but wrong score', () => {
			const result = getResult({ home: 3, away: 0 }, makeGame(2, 1));
			expect(result.result).toBe(1);
			expect(result.exact).toBeFalsy();
		});

		it('returns onescore for one team correct', () => {
			const result = getResult({ home: 1, away: 0 }, makeGame(1, 2));
			expect(result.onescore).toBe(1);
			expect(result.exact).toBeFalsy();
			expect(result.result).toBeFalsy();
		});

		it('returns fail for completely wrong', () => {
			const result = getResult({ home: 3, away: 0 }, makeGame(0, 2));
			expect(result.fail).toBe(1);
		});

		it('returns draw exact', () => {
			const result = getResult({ home: 1, away: 1 }, makeGame(1, 1));
			expect(result.exact).toBe(1);
		});

		it('returns draw result but wrong score', () => {
			const result = getResult({ home: 0, away: 0 }, makeGame(2, 2));
			expect(result.result).toBe(1);
		});

		it('returns penalty bonus for correct penalty winner', () => {
			const game = makeGame(3, 3, 'PEN', { home: 4, away: 3 });
			game.score.extratime = { home: 1, away: 1 };
			const result = getResult({ home: 2, away: 1 }, game);
			expect(result.penalty).toBe(1);
		});

		it('no penalty bonus for wrong penalty winner', () => {
			const game = makeGame(3, 3, 'PEN', { home: 3, away: 4 });
			game.score.extratime = { home: 1, away: 1 };
			const result = getResult({ home: 2, away: 1 }, game);
			expect(result.penalty).toBeUndefined();
		});

		it('handles null predictions as fail', () => {
			const result = getResult({ home: null, away: null } as unknown as Prediction, makeGame(1, 0));
			expect(result.fail).toBe(1);
		});
	});

	describe('calculateUserResultPoints', () => {
		const competition = {
			points: { exact: 3, result: 2, onescore: 1, penalty: 1, groups: 1 },
		} as Competition;

		it('calculates points correctly', () => {
			expect(calculateUserResultPoints({ exact: 2, result: 1, onescore: 3, penalty: 1, groups: 4 }, competition)).toBe(
				2 * 3 + 1 * 2 + 3 * 1 + 1 * 1 + 4 * 1
			);
		});

		it('returns 0 for empty result', () => {
			expect(calculateUserResultPoints({}, competition)).toBe(0);
		});

		it('handles partial results', () => {
			expect(calculateUserResultPoints({ exact: 1 }, competition)).toBe(3);
		});
	});
});
