import { useEffect, useState } from 'react';

import PageLayout from '../components/PageLayout';
import SettingsPage from '../components/Settings';
import Leaderboard from '../components/Leaderboard';
import StandingsPage from '../components/Standings';

import { updatePredictions, fetchTournament } from './api';
import FixturesContext from '../context/FixturesContext';
import UserContext from '../context/UserContext';
import RouteContext, { Route, RouteInfo } from '../context/RouteContext';
import FixturesPage from '../components/Fixtures';
import CurrentMatch from '../components/CurrentMatch';
import { Competition, Fixtures, Prediction, Predictions, Standings, Users } from '../../interfaces/main';
import Rules from '../components/Rules';
import { useRouter } from 'next/router';
import Loading from '../components/Loading';
import { competitions, isGameFinished } from '../../shared/utils';
import CompetitionContext from '../context/CompetitionContext';
import GroupMapContext from '../context/GroupMapContext';
import Login from '../components/Login';
import { useAuth } from '../lib/auth';

const Home = () => {
	const auth = useAuth();
	const [loading, setLoading] = useState(true);
	const [isAuthenticated, setAuthenticated] = useState(false);
	const [triedToValidateToken, setTriedToValidateToken] = useState(false);

	const [predictions, setPredictions] = useState({} as Predictions);
	const [fixtures, setFixtures] = useState({} as Fixtures);
	const [standings, setStandings] = useState([] as Standings);
	const [users, setUsers] = useState({} as Users);

	const [uid, setUID] = useState('');

	const [route, setRoute] = useState<RouteInfo>({ page: Route.Home });

	const router = useRouter();
	const { id: competitionName } = router.query;

	const competition: Competition = competitions[competitionName as string];

	useEffect(() => {
		const doAsync = async () => {
			if (!auth.user) {
				setLoading(false);
				setAuthenticated(false);
				return;
			}

			const { token, uid } = auth.user;

			setTriedToValidateToken(true);
			setAuthenticated(true);

			const { fixtures, standings, predictions, users } = await fetchTournament(token, competition);

			if (!standings || !fixtures) return;

			const sortedStandings = Object.entries(standings).sort() as unknown as Standings;

			const sortedFixtures = Object.values(fixtures).sort(
				({ fixture: a }, { fixture: b }) => a.timestamp - b.timestamp
			);

			const nextGame = sortedFixtures.find(game => !isGameFinished(game));

			setFixtures(fixtures);
			setPredictions(predictions);
			setStandings(sortedStandings);
			setUID(uid);
			setUsers(users);
			setLoading(false);

			if (uid in users && users[uid].shouldOnboard) {
				setRoute({ page: Route.Rules, data: uid });
			} else if (nextGame) {
				const nextGamePrediction = predictions[nextGame.fixture.id];
				if (!nextGamePrediction || !(uid in nextGamePrediction)) {
					setRoute({ page: Route.Predictions, data: uid });
				}
			} else {
				setRoute({ page: Route.Leaderboard });
			}
		};

		doAsync();

		return () => {};
	}, [router, competition, auth]);

	const updatePrediction = async (prediction: Prediction, gameId: number) => {
		if (!auth.user) return;
		setPredictions({ ...predictions, [gameId]: { ...predictions?.[gameId], [uid]: prediction } });
		await updatePredictions(auth.user.token, uid, gameId, prediction, competition);
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
				return <Leaderboard users={users} />;
			case Route.Standings:
				return <StandingsPage standings={standings} fixtures={fixtures} />;
			case Route.Settings:
				return <SettingsPage />;

			case Route.Rules:
				return <Rules />;
			default:
				return <></>;
		}
	};

	const showLogin = (!isAuthenticated && !loading && triedToValidateToken) || auth.user === undefined;

	return (
		<RouteContext.Provider value={{ route, setRoute }}>
			<UserContext.Provider value={{ uid, token: auth.user?.token ?? '' }}>
				<CompetitionContext.Provider value={competition}>
					<FixturesContext.Provider value={fixtures}>
						<GroupMapContext.Provider value={groupMap}>
							{showLogin && <Login />}

							{!showLogin && (
								<PageLayout title={'Score Prediction'} loading={loading} setLoading={setLoading}>
									{loading || !triedToValidateToken ? (
										<Loading message="Logging in..." />
									) : (
										<MainComponent />
									)}
								</PageLayout>
							)}
						</GroupMapContext.Provider>
					</FixturesContext.Provider>
				</CompetitionContext.Provider>
			</UserContext.Provider>
		</RouteContext.Provider>
	);
};

export default Home;
