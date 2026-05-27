import Rules from './Rules';
import { Route, useTournamentStore } from '../store/tournamentStore';
import { customRender } from '../lib/utils/testUtils';

beforeEach(() => {
	useTournamentStore.setState({ route: { page: Route.Home } });
});

describe('Rules', () => {
	it('renders rules page', () => {
		useTournamentStore.setState({ route: { page: Route.Rules } });
		const { container } = customRender(<Rules />);
		expect(container).toMatchSnapshot();
	});

	it('click my predictions should change route', () => {
		useTournamentStore.setState({ route: { page: Route.Rules, data: 'some data' } });
		const { container } = customRender(<Rules />);

		const button = container.querySelector('[test-id=my-predictions-button]') as HTMLDivElement;

		button.click();

		expect(useTournamentStore.getState().route).toEqual({
			page: Route.Predictions,
			data: 'some data',
		});
	});
});
