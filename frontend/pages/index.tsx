import { useEffect, useState } from 'react';

import nookies from 'nookies';

import PageLayout from '../components/PageLayout';
import Settings from '../components/Settings';
import Rankings from '../components/Rankings';
import StandingsPage from '../components/Standings';

import { updatePredictions, fetchTournament, validateToken } from './api';
import FixturesContext from '../context/FixturesContext';
import UserContext from '../context/UserContext';
import RouteContext, { Route, RouteInfo } from '../context/RouteContext';
import FixturesPage from '../components/Fixtures';
import CurrentMatch from '../components/CurrentMatch';
import { Fixtures, Prediction, Predictions, Standings, Users } from '../../interfaces/main';
import Rules from '../components/Rules';
import { useRouter } from 'next/router';

const Home = () => {
	const [loading, setLoading] = useState(true);
	const [token, setToken] = useState('');

	const [predictions, setPredictions] = useState({} as Predictions);
	const [fixtures, setFixtures] = useState({} as Fixtures);
	const [standings, setStandings] = useState([] as Standings);
	const [users, setUsers] = useState({} as Users);

	const [uid, setUID] = useState('');

	const [route, setRoute] = useState<RouteInfo>({ page: Route.Home, data: undefined });

	const router = useRouter();

	useEffect(() => {
		const doAsync = async () => {
			const { token } = nookies.get();

			setToken(token);

			const { uid, success } = await validateToken(token);

			if (success) {
				const { fixtures, standings, predictions, users } = await fetchTournament(token);
				const sorted = Object.entries(standings).sort();

				setFixtures(fixtures);
				setPredictions(predictions);
				setStandings(sorted);
				setUID(uid);
				setUsers(users);
				setLoading(false);

				setRoute({ page: uid in users && users[uid].isNewUser ? Route.Rules : Route.Home, data: undefined });
			} else {
				router.push('/login');
			}
		};

		doAsync();

		return () => {};
	}, []);

	const updatePrediction = (prediction: Prediction, gameId: number) => {
		setPredictions({ ...predictions, [gameId]: { ...predictions?.[gameId], [uid]: prediction } });
		updatePredictions(token, uid, gameId, prediction);
	};

	const MainComponent = () => {
		switch (route.page) {
			case Route.Home:
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
			case Route.Ranking:
				return <Rankings users={users} />;
			case Route.Standings:
				return <StandingsPage standings={standings} fixtures={fixtures} />;
			case Route.Settings:
				return <Settings />;
			case Route.Match:
				return (
					<CurrentMatch
						fixtures={fixtures}
						predictions={predictions}
						users={users}
						gameID={route?.data as number}
					/>
				);
			case Route.Rules:
				return <Rules />;
			default:
				return <></>;
		}
	};

	const Loading = () => (
		<div className="w-full h-full flex items-center justify-center">
			<img className="" src="loader.svg" />
		</div>
	);

	return (
		<RouteContext.Provider value={{ route, setRoute }}>
			<UserContext.Provider value={{ uid, token }}>
				<FixturesContext.Provider value={fixtures}>
					<PageLayout title={'Score Prediction'} loading={loading}>
						{loading ? <Loading /> : <MainComponent />}
					</PageLayout>
				</FixturesContext.Provider>
			</UserContext.Provider>
		</RouteContext.Provider>
	);
};

export default Home;
