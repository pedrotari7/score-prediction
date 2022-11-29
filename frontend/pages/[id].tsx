import { useCallback, useEffect, useState } from 'react';

import PageLayout from '../components/PageLayout';
import SettingsPage from '../components/Settings';
import Leaderboards from '../components/Leaderboard';
import StandingsPage from '../components/Standings';

import { updatePredictions, fetchTournament, postNoSpoilers } from './api';
import FixturesContext from '../context/FixturesContext';
import UserContext from '../context/UserContext';
import RouteContext, { Route, RouteInfo } from '../context/RouteContext';
import FixturesPage from '../components/Fixtures';
import CurrentMatch from '../components/CurrentMatch';
import { Competition, Fixtures, Leaderboard, Prediction, Predictions, Standings, Users } from '../../interfaces/main';
import Rules from '../components/Rules';
import { useRouter } from 'next/router';
import Loading from '../components/Loading';
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

	const { id: competitionName, join: leaderboardId } = router.query;

	const competition: Competition = competitions[competitionName as string];

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

		const nextGame = sortedFixtures.find(game => !isGameFinished(game));

		// if (uid in users && users[uid].shouldOnboard) {
		// 	setRoute({ page: Route.Rules, data: uid });
		// 	return
		// }

		if (nextGame) {
			const nextGamePrediction = predictions[nextGame.fixture.id];
			if (!nextGamePrediction || !(uid in nextGamePrediction)) {
				setRoute({ page: Route.Predictions, data: uid });
			}
		} else {
			setRoute({ page: Route.Leaderboard });
		}
	}, [competition, auth, leaderboardId]);

	useEffect(() => {
		updateTournament();
	}, [router, updateTournament]);

	const updatePrediction = async (prediction: Prediction, gameId: number) => {
		if (!auth.user) return;
		setPredictions({ ...predictions, [gameId]: { ...predictions?.[gameId], [uid]: prediction } });

		const result = await updatePredictions(auth.user.token, uid, gameId, prediction, competition);

		if (!result.success) {
			setRoute({ page: Route.RefreshPage });
		}

		console.log('result', result);
	};

	const groupMap = Object.values(standings)
		?.map(s => s?.[1])
		?.flat()
		?.reduce((acc, val) => {
			if (!val.group.startsWith('Group')) return acc;
			return { ...acc, [val.team.id]: val.group.split(' ').pop() };
		}, {});

	const MainComponent = () => {
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
					/>
				);
			case Route.Predictions:
				return (
					<FixturesPage
						fixtures={fixtures}
						predictions={predictions}
						updatePrediction={updatePrediction}
						standings={standings}
						user={users[route.data!]}
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
			default:
				return <></>;
		}
	};

	const showLogin = (!isAuthenticated && !loading && triedToValidateToken) || auth.user === undefined;

	return (
		<RouteContext.Provider value={{ route, setRoute }}>
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
												<Loading message='Logging in...' />
											) : (
												<MainComponent />
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
