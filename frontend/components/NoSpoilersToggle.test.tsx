import { act } from '@testing-library/react';
import { customRender } from '../lib/utils/testUtils';
import NoSpoilersToggle from './NoSpoilersToggle';
import type { ContextType } from 'react';
import type NoSpoilersContext from '../context/NoSpoilersContext';

describe('NoSpoilersToggle', () => {
	it('renders no spoilers toggle turned off if no context', () => {
		const { container } = customRender(<NoSpoilersToggle />, {
			noSpoilersContextProps: { noSpoilers: undefined, setNoSpoilers: () => {} } as unknown as ContextType<
				typeof NoSpoilersContext
			>,
		});
		expect(container).toMatchSnapshot();
	});

	it('renders no spoilers toggle turned off', () => {
		const { container } = customRender(<NoSpoilersToggle />, {
			noSpoilersContextProps: { noSpoilers: false, setNoSpoilers: () => {} },
		});
		expect(container).toMatchSnapshot();
	});

	it('renders no spoilers toggle turned on', () => {
		const { container } = customRender(<NoSpoilersToggle />, {
			noSpoilersContextProps: { noSpoilers: true, setNoSpoilers: () => {} },
		});
		expect(container).toMatchSnapshot();
	});

	it('toggle switch and update context', () => {
		const noSpoilersContextProps = { noSpoilers: false, setNoSpoilers: jest.fn() };
		const { container } = customRender(<NoSpoilersToggle />, { noSpoilersContextProps });

		expect(container).toMatchSnapshot();

		const toggle = container.querySelector('input');

		act(() => {
			if (toggle) {
				toggle.click();
			}
		});

		expect(noSpoilersContextProps.setNoSpoilers).toHaveBeenCalledTimes(1);
		expect(noSpoilersContextProps.setNoSpoilers).toHaveBeenCalledWith(true, expect.anything(), undefined);
	});
});
