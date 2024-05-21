import { RenderOptions, render } from '@testing-library/react';
import { ReactNode, ContextType } from 'react';
import RouteContext from '../../context/RouteContext';

export const customRender = (
	ui: ReactNode,
	options?: {
		routeContextProps?: ContextType<typeof RouteContext>;
		renderOptions?: RenderOptions<typeof import('@testing-library/dom/types/queries'), HTMLElement, HTMLElement>;
	}
) => {
	const { routeContextProps, renderOptions } = options ?? {};

	return render(<RouteContext.Provider value={routeContextProps ?? null}>{ui}</RouteContext.Provider>, renderOptions);
};
