import { fireEvent } from '@testing-library/react';
import type { Fixture, FixtureData, Prediction, UserResult } from '../../interfaces/main';
import { customRender } from '../lib/utils/testUtils';
import PredictionsStats from './PredictionsStats';

jest.mock('react-tooltip');

const game = {
	teams: {
		home: { id: 1, name: 'Home Team' },
		away: { id: 2, name: 'Away Team' },
	},
	goals: { home: 2, away: 1 },
	score: {
		fulltime: { home: 2, away: 1 },
		extratime: { home: null, away: null },
		penalty: { home: null, away: null },
	},
	fixture: { status: { short: 'FT' } } as FixtureData,
} as Fixture;

const gamePredictions: Prediction[] = [
	{ home: 2, away: 1 },
	{ home: 1, away: 0 },
];

const resultsTally: Partial<UserResult> = {
	exact: 1,
	result: 1,
	onescore: 0,
	fail: 0,
	penalty: 0,
};

describe('PredictionsStats', () => {
	it('toggles a filter when a stat is clicked', () => {
		const onFilterChange = jest.fn();
		const { getByText } = customRender(
			<PredictionsStats
				game={game}
				gamePredictions={gamePredictions}
				resultsTally={resultsTally}
				activeFilter={null}
				onFilterChange={onFilterChange}
			/>
		);

		fireEvent.click(getByText('Home Team'));
		expect(onFilterChange).toHaveBeenCalledWith('winH');
	});

	it('clears the filter when the active stat is clicked again', () => {
		const onFilterChange = jest.fn();
		const { getByText } = customRender(
			<PredictionsStats
				game={game}
				gamePredictions={gamePredictions}
				resultsTally={resultsTally}
				activeFilter='winH'
				onFilterChange={onFilterChange}
			/>
		);

		fireEvent.click(getByText('Home Team'));
		expect(onFilterChange).toHaveBeenCalledWith(null);
	});
});
