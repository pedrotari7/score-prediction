import Rules from './Rules';
import { Route } from '../context/RouteContext';
import { customRender } from '../lib/utils/testUtils';

describe('Rules', () => {
	it('renders empty page without route info', () => {
		const { container } = customRender(<Rules />);
		expect(container).toMatchSnapshot();
	});

	it('render rules page', () => {
		const { container } = customRender(<Rules />, {
			routeContextProps: { setRoute: () => {}, route: { page: Route.Rules } },
		});
		expect(container).toMatchSnapshot();
	});

	it('click my predictions should change route', () => {
		const routeContextProps = { setRoute: jest.fn(), route: { page: Route.Rules, data: 'some data' } };
		const { container } = customRender(<Rules />, { routeContextProps });

		const button = container.querySelector('[test-id=my-predictions-button]') as HTMLDivElement;

		button.click();

		expect(routeContextProps.setRoute).toHaveBeenCalledWith({
			page: Route.Predictions,
			data: routeContextProps.route.data,
		});
	});
});
