import { RenderOptions, render } from '@testing-library/react';
import { ReactNode, ContextType } from 'react';
import RouteContext from '../../context/RouteContext';
import NoSpoilersContext from '../../context/NoSpoilersContext';

export const customRender = (
	ui: ReactNode,
	options?: {
		routeContextProps?: ContextType<typeof RouteContext>;
		noSpoilersContextProps?: ContextType<typeof NoSpoilersContext>;
		renderOptions?: RenderOptions<typeof import('@testing-library/dom/types/queries'), HTMLElement, HTMLElement>;
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
