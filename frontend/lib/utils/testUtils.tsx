import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { RouteInfo } from '../../store/tournamentStore';
import { Route, useTournamentStore } from '../../store/tournamentStore';

export const customRender = (
	ui: ReactNode,
	options?: {
		routeContextProps?: { route: RouteInfo; setRoute: (r: RouteInfo) => void } | null;
		noSpoilersContextProps?: { noSpoilers: boolean | null; setNoSpoilers: (ns: boolean) => void } | null;
		renderOptions?: Parameters<typeof render>[1];
	}
) => {
	if (options?.routeContextProps) {
		useTournamentStore.setState({
			route: options.routeContextProps.route,
		});
	}
	if (options?.noSpoilersContextProps) {
		useTournamentStore.setState({
			noSpoilers: options.noSpoilersContextProps.noSpoilers,
		});
	}
	return render(ui, options?.renderOptions);
};

export { Route };
