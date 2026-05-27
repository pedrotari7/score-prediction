import { act } from '@testing-library/react';
import { customRender } from '../lib/utils/testUtils';
import NoSpoilersToggle from './NoSpoilersToggle';
import { useTournamentStore } from '../store/tournamentStore';

beforeEach(() => {
	useTournamentStore.setState({ noSpoilers: null, token: '' });
});

describe('NoSpoilersToggle', () => {
	it('renders no spoilers toggle turned off if no context', () => {
		useTournamentStore.setState({ noSpoilers: null });
		const { container } = customRender(<NoSpoilersToggle />);
		expect(container).toMatchSnapshot();
	});

	it('renders no spoilers toggle turned off', () => {
		useTournamentStore.setState({ noSpoilers: false });
		const { container } = customRender(<NoSpoilersToggle />);
		expect(container).toMatchSnapshot();
	});

	it('renders no spoilers toggle turned on', () => {
		useTournamentStore.setState({ noSpoilers: true });
		const { container } = customRender(<NoSpoilersToggle />);
		expect(container).toMatchSnapshot();
	});

	it('toggle switch and update store', () => {
		useTournamentStore.setState({ noSpoilers: false });
		const { container } = customRender(<NoSpoilersToggle />);

		expect(container).toMatchSnapshot();

		const toggle = container.querySelector('input');

		act(() => {
			if (toggle) {
				toggle.click();
			}
		});

		expect(useTournamentStore.getState().noSpoilers).toBe(true);
	});
});
