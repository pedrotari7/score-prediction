import { createContext } from 'react';

export enum Route {
	Home = 'home',
	Predictions = 'predictions',
	Standings = 'standings',
	Leaderboard = 'leaderboard',
	ListLeaderboards = 'listLeaderboards',
	Settings = 'settings',
	Match = 'match',
	Rules = 'rules',
	Users = 'users',
	JoinLeaderboard = 'joinLeaderboard',
	RefreshPage = 'refreshPage',
}

export interface RouteInfo {
	page: Route;
	data?: string | number | undefined;
}

const RouteContext = createContext<{ route: RouteInfo; setRoute: (r: RouteInfo) => void } | null>(null);

export default RouteContext;
