import { createContext } from 'react';

export enum Route {
	Home = 'home',
	Fixtures = 'fixtures',
	MyPredictions = 'predictions',
	Standings = 'standings',
	Ranking = 'ranking',
	Settings = 'settings',
	Match = 'match',
}
const RouteContext =
	createContext<{ route: { page: Route; data?: string | number | undefined }; setRoute: Function } | null>(null);

export default RouteContext;
