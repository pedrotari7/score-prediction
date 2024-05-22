import { render } from '@testing-library/react';
import { ReactNode, ContextType } from 'react';
import RouteContext from '../../context/RouteContext';
import NoSpoilersContext from '../../context/NoSpoilersContext';

export const customRender = (
	ui: ReactNode,
	options?: {
		routeContextProps?: ContextType<typeof RouteContext>;
		noSpoilersContextProps?: ContextType<typeof NoSpoilersContext>;
		renderOptions?: Parameters<typeof render>[1];
	}
) => {
	return render(
		<RouteContext.Provider value={options?.routeContextProps ?? null}>
			<NoSpoilersContext.Provider value={options?.noSpoilersContextProps ?? null}>
				{ui}
			</NoSpoilersContext.Provider>
		</RouteContext.Provider>,
		options?.renderOptions
	);
};
