import { create } from 'zustand';
import type {
	Boosts,
	Competition,
	FixtureOdds,
	Fixtures,
	GroupMap,
	Leaderboard,
	Prediction,
	Predictions,
	Standings,
	Users,
} from '../../interfaces/main';
import { currentCompetition, isGameFinished } from '../../shared/utils';
import { getMetrics } from '../lib/metrics';
import { fetchTournament, postNoSpoilers, updateBoost as apiUpdateBoost, updatePredictions } from '../pages/api';

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
	Stats = 'stats',
	Compare = 'compare',
	Recap = 'recap',
	DebugCards = 'debugCards',
	Metrics = 'metrics',
}

export interface RouteInfo {
	page: Route;
	data?: string | number | undefined;
}

interface TournamentState {
	predictions: Predictions;
	fixtures: Fixtures;
	standings: Standings;
	leaderboards: Record<string, Leaderboard>;
	users: Users;
	odds: FixtureOdds;
	boosts: Boosts;
	uid: string;
	route: RouteInfo;
	noSpoilers: boolean | null;
	loading: boolean;
	isAuthenticated: boolean;
	triedToValidateToken: boolean;
	competition: Competition;
	groupMap: GroupMap;
	token: string;

	setPredictions: (predictions: Predictions) => void;
	setFixtures: (fixtures: Fixtures) => void;
	setStandings: (standings: Standings) => void;
	setLeaderboards: (leaderboards: Record<string, Leaderboard>) => void;
	setUsers: (users: Users) => void;
	setUID: (uid: string) => void;
	setRoute: (route: RouteInfo) => void;
	setNoSpoilers: (ns: boolean) => void;
	setLoading: (loading: boolean) => void;
	setAuthenticated: (isAuthenticated: boolean) => void;
	setTriedToValidateToken: (v: boolean) => void;
	setCompetition: (competition: Competition) => void;
	setToken: (token: string) => void;

	updateTournament: () => Promise<void>;
	updatePrediction: (prediction: Prediction, gameId: number) => Promise<void>;
	updateBoost: (gameId: number) => Promise<void>;

	_navigate: ((info: RouteInfo) => void) | null;
	_setNavigate: (fn: (info: RouteInfo) => void) => void;
	_leaderboardId: string | null;
	_setLeaderboardId: (id: string | null) => void;
	_routerQuery: Record<string, unknown>;
	_setRouterQuery: (query: Record<string, unknown>) => void;
}

const computeGroupMap = (standings: Standings): GroupMap =>
	Object.values(standings)
		?.map(s => s?.[1])
		?.flat()
		?.reduce((acc: GroupMap, val) => {
			if (!val?.group?.startsWith('Group')) return acc;
			return { ...acc, [val.team.id]: val.group.split(' ').pop() ?? '' };
		}, {}) ?? {};

export const useTournamentStore = create<TournamentState>((set, get) => ({
	predictions: {},
	fixtures: {},
	standings: [],
	leaderboards: {},
	users: {} as Users,
	odds: {},
	boosts: {},
	uid: '',
	route: { page: Route.Home },
	noSpoilers: null,
	loading: true,
	isAuthenticated: false,
	triedToValidateToken: false,
	competition: currentCompetition,
	groupMap: {},
	token: '',

	setPredictions: predictions => set({ predictions }),
	setFixtures: fixtures => set({ fixtures }),
	setStandings: standings => set({ standings, groupMap: computeGroupMap(standings) }),
	setLeaderboards: leaderboards => set({ leaderboards }),
	setUsers: users => set({ users }),
	setUID: uid => set({ uid }),
	setRoute: route => {
		set({ route });
		get()._navigate?.(route);
		getMetrics().trackPageView(route.page, route.data);
	},
	setNoSpoilers: ns => {
		const { token } = get();
		if (token) postNoSpoilers(ns, token);
		set({ noSpoilers: ns });
	},
	setLoading: loading => set({ loading }),
	setAuthenticated: isAuthenticated => set({ isAuthenticated }),
	setTriedToValidateToken: v => set({ triedToValidateToken: v }),
	setCompetition: competition => set({ competition }),
	setToken: token => set({ token }),

	updateTournament: async () => {
		const { token, competition, _leaderboardId, _routerQuery } = get();

		if (!token) {
			set({ isAuthenticated: false });
			return;
		}

		set({ loading: true, triedToValidateToken: true, isAuthenticated: true });

		const { fixtures, standings, predictions, users, userExtraInfo, odds, boosts } = await fetchTournament(
			token,
			competition
		);

		if (!standings || !fixtures || !userExtraInfo) {
			set({ loading: false });
			return;
		}

		const sortedStandings = Object.entries(standings).sort() as unknown as Standings;
		const sortedFixtures = Object.values(fixtures).sort(
			({ fixture: a }, { fixture: b }) => a.timestamp - b.timestamp
		);

		const uid = get().uid || '';

		set({
			noSpoilers: userExtraInfo.noSpoilers,
			leaderboards: userExtraInfo.leaderboards,
			fixtures,
			predictions,
			standings: sortedStandings,
			groupMap: computeGroupMap(sortedStandings),
			users,
			odds: odds ?? {},
			boosts: boosts ?? {},
			loading: false,
		});

		if (_leaderboardId) {
			set({ route: { page: Route.JoinLeaderboard, data: _leaderboardId } });
			return;
		}

		if (_routerQuery?.page) {
			return;
		}

		const nextGame = sortedFixtures.find(game => !isGameFinished(game));
		const finalGame = sortedFixtures.find(game => game.league.round === 'Final');
		const isTournamentFinished = !!finalGame && isGameFinished(finalGame);

		if (uid in users && users[uid].shouldOnboard) {
			get()._navigate?.({ page: Route.Rules, data: uid });
			return;
		}

		if (isTournamentFinished) {
			get()._navigate?.({ page: Route.Recap });
		} else if (nextGame) {
			const nextGamePrediction = predictions[nextGame.fixture.id];
			if (!nextGamePrediction || !(uid in nextGamePrediction)) {
				get()._navigate?.({ page: Route.Predictions, data: uid });
			}
		} else {
			get()._navigate?.({ page: Route.Leaderboard });
		}
	},

	updatePrediction: async (prediction: Prediction, gameId: number) => {
		const { token, uid, competition, predictions: prevPredictions } = get();
		if (!token) return;

		set(state => ({
			predictions: {
				...state.predictions,
				[gameId]: { ...state.predictions?.[gameId], [uid]: prediction },
			},
		}));

		const result = await updatePredictions(token, gameId, prediction, competition);

		if (!result.success) {
			set({ predictions: prevPredictions });
			getMetrics().trackEvent('prediction_failed', { gameId });
		} else {
			getMetrics().trackEvent('prediction_submitted', { gameId });
		}
	},

	updateBoost: async (gameId: number) => {
		const { token, uid, competition, boosts: prevBoosts } = get();
		if (!token) return;

		const userBoosts = prevBoosts[uid] ?? [];
		const idx = userBoosts.indexOf(gameId);
		const isRemoving = idx >= 0;
		const newUserBoosts = isRemoving ? userBoosts.filter(id => id !== gameId) : [...userBoosts, gameId];

		set(state => ({
			boosts: { ...state.boosts, [uid]: newUserBoosts },
		}));

		if (!isRemoving && typeof window !== 'undefined') {
			window.dispatchEvent(new Event('boost-activated'));
		}

		const result = await apiUpdateBoost(token, gameId, competition);

		if (!result.success) {
			set({ boosts: prevBoosts });
		} else {
			getMetrics().trackEvent('boost_toggled', { gameId, action: isRemoving ? 'removed' : 'added' });
		}
	},

	_navigate: null,
	_setNavigate: fn => set({ _navigate: fn }),
	_leaderboardId: null,
	_setLeaderboardId: id => set({ _leaderboardId: id }),
	_routerQuery: {},
	_setRouterQuery: query => set({ _routerQuery: query }),
}));
