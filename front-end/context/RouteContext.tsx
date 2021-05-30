import { createContext } from 'react';

export enum Route {
	Home = 'home',
	Fixtures = 'fixtures',
	Standings = 'standings',
	Ranking = 'ranking',
	Settings = 'settings',
}
const RouteContext = createContext<{ route: Route; setRoute: Function } | null>(null);

export default RouteContext;
