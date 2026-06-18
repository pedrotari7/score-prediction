import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import PageLayout from '../components/PageLayout';
import FixturesPage from '../components/Fixtures';
import CurrentMatch from '../components/CurrentMatch';
import Rules from '../components/Rules';
import { useRouter } from 'next/router';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { competitions } from '../../shared/utils';
import Login from '../components/Login';
import { useAuth } from '../lib/auth';
import UsersList from '../components/Users';
import JoinLeaderboard from '../components/JoinLeaderboard';
import ListLeaderboards from '../components/ListLeaderboards';
import ErrorBoundary from '../components/ErrorBoundary';
import RefreshPage from '../components/RefreshPage';
import type { RouteInfo } from '../store/tournamentStore';
import { Route, useTournamentStore } from '../store/tournamentStore';
import type { Competition } from '../../interfaces/main';
import useLiveFixtures from '../hooks/useLiveFixtures';

const SettingsPage = dynamic(() => import('../components/Settings'));
const Leaderboards = dynamic(() => import('../components/Leaderboard'));
const StandingsPage = dynamic(() => import('../components/Standings'));
const Stats = dynamic(() => import('../components/Stats'));
const HeadToHead = dynamic(() => import('../components/HeadToHead'));
const TournamentRecap = dynamic(() => import('../components/TournamentRecap'));
const DebugCardGallery = dynamic(() => import('../components/DebugCardGallery'));
const MetricsDashboard = dynamic(() => import('../components/MetricsDashboard'));
const CalendarPage = dynamic(() => import('../components/Calendar'));
const PredictionTimeline = dynamic(() => import('../components/PredictionTimeline'));

type QueryParams = Record<string, string | string[] | undefined>;

const routeToQuery = (info: RouteInfo): Record<string, string> => {
	const params: Record<string, string> = {};
	if (info.page !== Route.Home) params.page = info.page;
	if (info.page === Route.Match && info.data) params.gameId = String(info.data);
	if (info.page === Route.Predictions && info.data) params.uid = String(info.data);
	if (info.page === Route.Leaderboard && info.data) params.leaderboardId = String(info.data);
	if (info.page === Route.Compare && info.data) params.compareUid = String(info.data);
	return params;
};

const queryToRoute = (query: QueryParams): RouteInfo => {
	if (query.join) return { page: Route.JoinLeaderboard, data: query.join as string };
	const page = query.page as Route | undefined;
	if (!page || page === Route.Home) return { page: Route.Home };
	if (page === Route.Match) return { page: Route.Match, data: query.gameId ? Number(query.gameId) : undefined };
	if (page === Route.Predictions) return { page: Route.Predictions, data: query.uid as string | undefined };
	if (page === Route.Leaderboard) return { page: Route.Leaderboard, data: query.leaderboardId as string | undefined };
	if (page === Route.Compare) return { page: Route.Compare, data: query.compareUid as string | undefined };
	return { page };
};

const MainComponent = () => {
	const route = useTournamentStore(s => s.route);
	const fixtures = useTournamentStore(s => s.fixtures);
	const predictions = useTournamentStore(s => s.predictions);
	const users = useTournamentStore(s => s.users);
	const leaderboards = useTournamentStore(s => s.leaderboards);
	const setLeaderboards = useTournamentStore(s => s.setLeaderboards);
	const standings = useTournamentStore(s => s.standings);
	const uid = useTournamentStore(s => s.uid);
	const updatePrediction = useTournamentStore(s => s.updatePrediction);

	const router = useRouter();
	const { join: leaderboardId, token: joinToken } = router.query;

	const content = (() => {
		switch (route.page) {
			case Route.Home:
			case Route.Match:
				return (
					<CurrentMatch
						fixtures={fixtures}
						predictions={predictions}
						users={users}
						gameID={route?.data as number}
						leaderboards={leaderboards}
						updatePrediction={updatePrediction}
					/>
				);
			case Route.Predictions:
				return (
					<FixturesPage
						fixtures={fixtures}
						predictions={predictions}
						updatePrediction={updatePrediction}
						standings={standings}
						user={users[(route.data as string) ?? uid]}
					/>
				);
			case Route.Leaderboard:
				return (
					<Leaderboards
						key={route.data as string}
						users={users}
						leaderboards={leaderboards}
						setLeaderboards={setLeaderboards}
					/>
				);
			case Route.Standings:
				return <StandingsPage standings={standings} fixtures={fixtures} />;
			case Route.Settings:
				return <SettingsPage />;
			case Route.Rules:
				return <Rules />;
			case Route.Users:
				return <UsersList />;
			case Route.JoinLeaderboard:
				return <JoinLeaderboard leaderboardId={leaderboardId as string} joinToken={joinToken as string} />;
			case Route.RefreshPage:
				return <RefreshPage />;
			case Route.ListLeaderboards:
				return <ListLeaderboards users={users} />;
			case Route.Stats:
				return <Stats fixtures={fixtures} predictions={predictions} />;
			case Route.Compare:
				return (
					<HeadToHead
						fixtures={fixtures}
						predictions={predictions}
						users={users}
						compareUid={route.data as string}
					/>
				);
			case Route.Recap:
				return <TournamentRecap />;
			case Route.DebugCards:
				return <DebugCardGallery />;
			case Route.Metrics:
				return <MetricsDashboard />;
			case Route.Calendar:
				return <CalendarPage fixtures={fixtures} />;
			case Route.Timeline:
				return <PredictionTimeline fixtures={fixtures} predictions={predictions} />;
			default:
				return <></>;
		}
	})();

	return <ErrorBoundary key={route.page}>{content}</ErrorBoundary>;
};

const Home = () => {
	const auth = useAuth();
	const router = useRouter();
	const isNavigatingRef = useRef(false);
	const navigateRef = useRef<(info: RouteInfo) => void>(() => {});

	useLiveFixtures();

	const loading = useTournamentStore(s => s.loading);
	const isAuthenticated = useTournamentStore(s => s.isAuthenticated);
	const triedToValidateToken = useTournamentStore(s => s.triedToValidateToken);
	const setLoading = useTournamentStore(s => s.setLoading);

	const { id: competitionName, join: leaderboardId } = router.query;
	const competition: Competition = competitions[competitionName as keyof typeof competitions];

	const authToken = auth.user?.token ?? '';
	const authUid = auth.user?.uid ?? '';

	navigateRef.current = (info: RouteInfo) => {
		useTournamentStore.setState({ route: info });
		isNavigatingRef.current = true;
		router.push({ pathname: router.pathname, query: { id: router.query.id, ...routeToQuery(info) } }, undefined, {
			shallow: true,
		});
	};

	useEffect(() => {
		useTournamentStore.setState({
			_navigate: (info: RouteInfo) => navigateRef.current(info),
		});
	}, []);

	useEffect(() => {
		if (competition) {
			useTournamentStore.setState({ competition });
		}
	}, [competition]);

	useEffect(() => {
		useTournamentStore.setState({ token: authToken, uid: authUid });
	}, [authToken, authUid]);

	useEffect(() => {
		useTournamentStore.setState({
			_leaderboardId: (leaderboardId as string) ?? null,
			_routerQuery: { page: router.query.page, join: router.query.join },
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [leaderboardId, router.query.page, router.query.join]);

	useEffect(() => {
		if (isNavigatingRef.current) {
			isNavigatingRef.current = false;
			return;
		}
		useTournamentStore.setState({ route: queryToRoute(router.query) });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		router.query.page,
		router.query.gameId,
		router.query.uid,
		router.query.leaderboardId,
		router.query.compareUid,
		router.query.join,
	]);

	useEffect(() => {
		useTournamentStore.getState().updateTournament();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [competition, authToken, leaderboardId]);

	const showLogin = (!isAuthenticated && !loading && triedToValidateToken) || auth.user === undefined;

	return (
		<>
			{showLogin && <Login />}

			{!showLogin && (
				<PageLayout title={'Score Prediction'} loading={loading} setLoading={setLoading}>
					{loading || !triedToValidateToken ? <LoadingSkeleton /> : <MainComponent />}
				</PageLayout>
			)}
		</>
	);
};

export default Home;
