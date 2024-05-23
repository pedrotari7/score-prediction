import { Fixture, FixtureData, Result, Score } from '../interfaces/main';
import { getExtraTimeResult, getOutcome, isEmpty } from './utils';

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
});
