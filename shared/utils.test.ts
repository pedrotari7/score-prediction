import { Competition, Fixture, FixtureData, FixtureOdds, Prediction, Result, Score } from '../interfaces/main';
import {
	calculateUserResultPoints,
	DEFAULT_USER_RESULT,
	getExtraTimeResult,
	getOutcome,
	getResult,
	isDrawFavorite,
	isEmpty,
	isPredictionUpset,
	isUpsetResult,
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
				fixture: { id: 100, status: { short: status } } as FixtureData,
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

		it('returns upset bonus for exact score on upset game', () => {
			const result = getResult({ home: 2, away: 1 }, makeGame(2, 1), true);
			expect(result.exact).toBe(1);
			expect(result.upset).toBe(1);
		});

		it('returns upset bonus for correct result on upset game', () => {
			const result = getResult({ home: 3, away: 0 }, makeGame(2, 1), true);
			expect(result.result).toBe(1);
			expect(result.upset).toBe(1);
		});

		it('no upset bonus for onescore on upset game', () => {
			const result = getResult({ home: 1, away: 0 }, makeGame(1, 2), true);
			expect(result.onescore).toBe(1);
			expect(result.upset).toBeFalsy();
		});

		it('no upset bonus for fail on upset game', () => {
			const result = getResult({ home: 3, away: 0 }, makeGame(0, 2), true);
			expect(result.fail).toBe(1);
			expect(result.upset).toBeUndefined();
		});

		it('no upset bonus when isUpset is false', () => {
			const result = getResult({ home: 2, away: 1 }, makeGame(2, 1), false);
			expect(result.exact).toBe(1);
			expect(result.upset).toBeFalsy();
		});
	});

	describe('isUpsetResult', () => {
		const makeGameWithId = (home: number, away: number, fixtureId: number): Fixture =>
			({
				score: { fulltime: { home, away } } as Score,
				fixture: { id: fixtureId, status: { short: 'FT' } } as FixtureData,
				goals: { home, away },
			}) as Fixture;

		it('detects upset when home team (underdog) wins', () => {
			const odds: FixtureOdds = { 1: { home: 4.5, away: 1.8, draw: 3.2 } };
			expect(isUpsetResult(makeGameWithId(2, 1, 1), odds)).toBe(true);
		});

		it('detects upset when away team (underdog) wins', () => {
			const odds: FixtureOdds = { 1: { home: 1.5, away: 5.0, draw: 3.5 } };
			expect(isUpsetResult(makeGameWithId(0, 1, 1), odds)).toBe(true);
		});

		it('no upset when favorite wins at home', () => {
			const odds: FixtureOdds = { 1: { home: 1.5, away: 5.0, draw: 3.5 } };
			expect(isUpsetResult(makeGameWithId(2, 0, 1), odds)).toBe(false);
		});

		it('no upset when favorite wins away', () => {
			const odds: FixtureOdds = { 1: { home: 4.0, away: 1.8, draw: 3.2 } };
			expect(isUpsetResult(makeGameWithId(0, 1, 1), odds)).toBe(false);
		});

		it('no upset on draw', () => {
			const odds: FixtureOdds = { 1: { home: 4.5, away: 1.8, draw: 3.2 } };
			expect(isUpsetResult(makeGameWithId(1, 1, 1), odds)).toBe(false);
		});

		it('no upset when odds are missing for fixture', () => {
			const odds: FixtureOdds = {};
			expect(isUpsetResult(makeGameWithId(2, 1, 1), odds)).toBe(false);
		});

		it('no upset when odds are equal', () => {
			const odds: FixtureOdds = { 1: { home: 2.5, away: 2.5, draw: 3.0 } };
			expect(isUpsetResult(makeGameWithId(2, 1, 1), odds)).toBe(false);
		});

		it('no upset when draw is favored even if underdog wins', () => {
			const odds: FixtureOdds = { 1: { home: 4.0, away: 3.5, draw: 2.8 } };
			expect(isUpsetResult(makeGameWithId(2, 1, 1), odds)).toBe(false);
		});
	});

	describe('isDrawFavorite', () => {
		it('true when draw has lowest odd', () => {
			expect(isDrawFavorite({ home: 3.0, away: 4.0, draw: 2.5 })).toBe(true);
		});

		it('false when home is favored', () => {
			expect(isDrawFavorite({ home: 1.5, away: 4.0, draw: 3.0 })).toBe(false);
		});

		it('false when away is favored', () => {
			expect(isDrawFavorite({ home: 3.0, away: 1.8, draw: 3.5 })).toBe(false);
		});

		it('true when draw ties with lowest', () => {
			expect(isDrawFavorite({ home: 2.5, away: 3.0, draw: 2.5 })).toBe(true);
		});
	});

	describe('isPredictionUpset', () => {
		it('true when predicting home underdog to win', () => {
			expect(isPredictionUpset({ home: 2, away: 1 }, { home: 4.5, away: 1.8, draw: 3.2 })).toBe(true);
		});

		it('true when predicting away underdog to win', () => {
			expect(isPredictionUpset({ home: 0, away: 1 }, { home: 1.5, away: 5.0, draw: 3.5 })).toBe(true);
		});

		it('false when predicting favorite to win', () => {
			expect(isPredictionUpset({ home: 2, away: 0 }, { home: 1.5, away: 5.0, draw: 3.5 })).toBe(false);
		});

		it('false when predicting draw', () => {
			expect(isPredictionUpset({ home: 1, away: 1 }, { home: 4.5, away: 1.8, draw: 3.2 })).toBe(false);
		});

		it('false when draw is favored', () => {
			expect(isPredictionUpset({ home: 2, away: 1 }, { home: 4.0, away: 3.5, draw: 2.8 })).toBe(false);
		});
	});

	describe('calculateUserResultPoints', () => {
		const competition = {
			points: { exact: 3, result: 2, onescore: 1, penalty: 1, groups: 1 },
		} as Competition;

		const competitionWithUpset = {
			points: { exact: 3, result: 2, onescore: 1, penalty: 1, groups: 1, upset: 1 },
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

		it('includes upset bonus when competition supports it', () => {
			expect(
				calculateUserResultPoints({ exact: 1, upset: 2 }, competitionWithUpset)
			).toBe(3 + 2);
		});

		it('ignores upset when competition has no upset config', () => {
			expect(
				calculateUserResultPoints({ exact: 1, upset: 2 }, competition)
			).toBe(3);
		});
	});
});
