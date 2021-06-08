import { createContext } from 'react';

export interface RouteInfo {
	page: Route;
	data?: string | number | undefined;
}

export enum Route {
	Home = 'home',
	Fixtures = 'fixtures',
	Predictions = 'predictions',
	Standings = 'standings',
	Ranking = 'ranking',
	Settings = 'settings',
	Match = 'match',
	Rules = 'rules',
}
const RouteContext = createContext<{ route: RouteInfo; setRoute: (r: RouteInfo) => void } | null>(null);

export default RouteContext;
