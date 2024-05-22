import { customRender } from '../lib/utils/testUtils';
import Loading from './Loading';

describe('Loading', () => {
	it('renders loading spinner with no message', () => {
		const { container } = customRender(<Loading />);
		expect(container).toMatchSnapshot();
	});

	it('renders loading spinner with message', () => {
		const { container } = customRender(<Loading message='test message' />);
		expect(container).toMatchSnapshot();
	});
});
