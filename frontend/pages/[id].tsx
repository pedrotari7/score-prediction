import { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';

import PageLayout from '../components/PageLayout';
import SettingsPage from '../components/Settings';
import Leaderboards from '../components/Leaderboard';
import StandingsPage from '../components/Standings';

import { updatePredictions, fetchTournament, postNoSpoilers } from './api';
import FixturesContext from '../context/FixturesContext';
import UserContext from '../context/UserContext';
import type { RouteInfo } from '../context/RouteContext';
import RouteContext, { Route } from '../context/RouteContext';
import FixturesPage from '../components/Fixtures';
import CurrentMatch from '../components/CurrentMatch';
import type {
	Competition,
	Fixtures,
	Leaderboard,
	Prediction,
	Predictions,
	Standings,
	Users,
} from '../../interfaces/main';
import Rules from '../components/Rules';
import { useRouter } from 'next/router';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { competitions, isGameFinished } from '../../shared/utils';
import CompetitionContext from '../context/CompetitionContext';
import GroupMapContext from '../context/GroupMapContext';
import Login from '../components/Login';
import { useAuth } from '../lib/auth';
import UpdateTournamentContext from '../context/UpdateTournamentContext';
import UsersList from '../components/Users';
import JoinLeaderboard from '../components/JoinLeaderboard';
import ListLeaderboards from '../components/ListLeaderboards';
import NoSpoilersContext from '../context/NoSpoilersContext';
import RefreshPage from '../components/RefreshPage';
import Stats from '../components/Stats';

type QueryParams = Record<string, string | string[] | undefined>;

interface MainComponentProps {
	route: RouteInfo;
	fixtures: Fixtures;
	predictions: Predictions;
	users: Users;
	leaderboards: Record<string, Leaderboard>;
	standings: Standings;
	uid: string;
	leaderboardId: string | string[] | undefined;
	updatePrediction: (prediction: Prediction, gameId: number) => Promise<void>;
}

const MainComponent = memo(function MainComponent({
	route,
	fixtures,
	predictions,
	users,
	leaderboards,
	standings,
	uid,
	leaderboardId,
	updatePrediction,
}: MainComponentProps) {
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
			return <Leaderboards users={users} leaderboards={leaderboards} />;
		case Route.Standings:
			return <StandingsPage standings={standings} fixtures={fixtures} />;
		case Route.Settings:
			return <SettingsPage />;
		case Route.Rules:
			return <Rules />;
		case Route.Users:
			return <UsersList />;
		case Route.JoinLeaderboard:
			return <JoinLeaderboard leaderboardId={leaderboardId as string} />;
		case Route.RefreshPage:
			return <RefreshPage />;
		case Route.ListLeaderboards:
			return <ListLeaderboards users={users} />;
		case Route.Stats:
			return <Stats fixtures={fixtures} predictions={predictions} />;
		default:
			return <></>;
	}
});

const routeToQuery = (info: RouteInfo): Record<string, string> => {
	const params: Record<string, string> = {};
	if (info.page !== Route.Home) params.page = info.page;
	if (info.page === Route.Match && info.data) params.gameId = String(info.data);
	if (info.page === Route.Predictions && info.data) params.uid = String(info.data);
	if (info.page === Route.Leaderboard && info.data) params.leaderboardId = String(info.data);
	return params;
};

const queryToRoute = (query: QueryParams): RouteInfo => {
	if (query.join) return { page: Route.JoinLeaderboard, data: query.join as string };
	const page = query.page as Route | undefined;
	if (!page || page === Route.Home) return { page: Route.Home };
	if (page === Route.Match) return { page: Route.Match, data: query.gameId ? Number(query.gameId) : undefined };
	if (page === Route.Predictions) return { page: Route.Predictions, data: query.uid as string | undefined };
	if (page === Route.Leaderboard) return { page: Route.Leaderboard, data: query.leaderboardId as string | undefined };
	return { page };
};

const Home = () => {
	const auth = useAuth();
	const [loading, setLoading] = useState(true);
	const [isAuthenticated, setAuthenticated] = useState(false);
	const [triedToValidateToken, setTriedToValidateToken] = useState(false);

	const [predictions, setPredictions] = useState<Predictions>({});
	const [fixtures, setFixtures] = useState<Fixtures>({});
	const [standings, setStandings] = useState<Standings>([]);
	const [leaderboards, setLeaderboards] = useState<Record<string, Leaderboard>>({});

	const [users, setUsers] = useState({} as Users);

	const [uid, setUID] = useState('');

	const [route, setRoute] = useState<RouteInfo>({ page: Route.Home });
	const [noSpoilers, setNoSpoilers] = useState<boolean | null>(null);

	const router = useRouter();
	const isNavigatingRef = useRef(false);
	const navigateToRef = useRef<(info: RouteInfo) => void>(() => {});

	const { id: competitionName, join: leaderboardId } = router.query;

	const competition: Competition = competitions[competitionName as keyof typeof competitions];

	const navigateTo = useCallback(
		(info: RouteInfo) => {
			setRoute(info);
			isNavigatingRef.current = true;
			router.push(
				{ pathname: router.pathname, query: { id: router.query.id, ...routeToQuery(info) } },
				undefined,
				{
					shallow: true,
				}
			);
		},
		[router]
	);

	useEffect(() => {
		navigateToRef.current = navigateTo;
	});

	useEffect(() => {
		if (isNavigatingRef.current) {
			isNavigatingRef.current = false;
			return;
		}
		setRoute(queryToRoute(router.query));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [router.query.page, router.query.gameId, router.query.uid, router.query.leaderboardId, router.query.join]);

	const updateNoSpoilers = (ns: boolean) => {
		if (auth.user) {
			postNoSpoilers(ns, auth.user.token);
		}
		setNoSpoilers(ns);
	};

	const updateTournament = useCallback(async () => {
		if (!auth.user) {
			setLoading(false);
			setAuthenticated(false);
			return;
		}

		const { token, uid } = auth.user;

		setTriedToValidateToken(true);
		setAuthenticated(true);

		const { fixtures, standings, predictions, users, userExtraInfo } = await fetchTournament(token, competition);

		if (!standings || !fixtures || !userExtraInfo) return;

		const sortedStandings = Object.entries(standings).sort() as unknown as Standings;

		const sortedFixtures = Object.values(fixtures).sort(
			({ fixture: a }, { fixture: b }) => a.timestamp - b.timestamp
		);

		setNoSpoilers(userExtraInfo.noSpoilers);
		setLeaderboards(userExtraInfo.leaderboards);
		setFixtures(fixtures);
		setPredictions(predictions);
		setStandings(sortedStandings);
		setUID(uid);
		setUsers(users);

		setLoading(false);

		if (leaderboardId) {
			setRoute({ page: Route.JoinLeaderboard, data: leaderboardId as string });
			return;
		}

		if (router.query.page) {
			setRoute(queryToRoute(router.query));
			return;
		}

		const nextGame = sortedFixtures.find(game => !isGameFinished(game));

		// if (uid in users && users[uid].shouldOnboard) {
		// 	setRoute({ page: Route.Rules, data: uid });
		// 	return
		// }

		if (nextGame) {
			const nextGamePrediction = predictions[nextGame.fixture.id];
			if (!nextGamePrediction || !(uid in nextGamePrediction)) {
				navigateToRef.current({ page: Route.Predictions, data: uid });
			}
		} else {
			navigateToRef.current({ page: Route.Leaderboard });
		}

		// eslint-disable-next-line react-hooks/exhaustive-deps -- router.query omitted intentionally: including it would re-run the full data fetch on every URL change
	}, [competition, auth, leaderboardId]);

	useEffect(() => {
		updateTournament();
	}, [updateTournament]);

	const updatePrediction = useCallback(
		async (prediction: Prediction, gameId: number) => {
			if (!auth.user) return;
			setPredictions(prev => ({ ...prev, [gameId]: { ...prev?.[gameId], [uid]: prediction } }));

			const result = await updatePredictions(auth.user.token, uid, gameId, prediction, competition);

			if (!result.success) {
				navigateToRef.current({ page: Route.RefreshPage });
			}
		},
		[auth.user, uid, competition]
	);

	const groupMap = useMemo(
		() =>
			Object.values(standings)
				?.map(s => s?.[1])
				?.flat()
				?.reduce((acc, val) => {
					if (!val.group?.startsWith('Group')) return acc;
					return { ...acc, [val.team.id]: val.group.split(' ').pop() };
				}, {}),
		[standings]
	);

	const showLogin = (!isAuthenticated && !loading && triedToValidateToken) || auth.user === undefined;

	return (
		<RouteContext.Provider value={{ route, setRoute: navigateTo }}>
			<NoSpoilersContext.Provider value={{ noSpoilers, setNoSpoilers: updateNoSpoilers }}>
				<UserContext.Provider value={{ uid, token: auth.user?.token ?? '' }}>
					<CompetitionContext.Provider value={competition}>
						<FixturesContext.Provider value={fixtures}>
							<GroupMapContext.Provider value={groupMap}>
								<UpdateTournamentContext.Provider value={updateTournament}>
									{showLogin && <Login />}

									{!showLogin && (
										<PageLayout
											title={'Score Prediction'}
											loading={loading}
											setLoading={setLoading}
										>
											{loading || !triedToValidateToken ? (
												<LoadingSkeleton />
											) : (
												<MainComponent
													route={route}
													fixtures={fixtures}
													predictions={predictions}
													users={users}
													leaderboards={leaderboards}
													standings={standings}
													uid={uid}
													leaderboardId={leaderboardId}
													updatePrediction={updatePrediction}
												/>
											)}
										</PageLayout>
									)}
								</UpdateTournamentContext.Provider>
							</GroupMapContext.Provider>
						</FixturesContext.Provider>
					</CompetitionContext.Provider>
				</UserContext.Provider>
			</NoSpoilersContext.Provider>
		</RouteContext.Provider>
	);
};

export default Home;
