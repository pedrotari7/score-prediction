import { useState } from 'react';
import { GetServerSidePropsContext } from 'next';

import nookies from 'nookies';

import { firebaseAdmin } from '../lib/firebaseAdmin';
import PageLayout from '../components/PageLayout';
import Settings from '../components/Settings';
import Rankings from '../components/Rankings';
import StandingsPage from '../components/Standings';

import { fetchFixtures, fetchPredictions, fetchStandings, fetchUsers, updatePredictions } from './api';
import FixturesContext from '../context/FixturesContext';
import UserContext from '../context/UserContext';
import RouteContext, { Route, RouteInfo } from '../context/RouteContext';
import FixturesPage from '../components/Fixtures';
import CurrentMatch from '../components/CurrentMatch';
import { Fixtures, Prediction, Predictions, Standings, Users } from '../../interfaces/main';
import Rules from '../components/Rules';

const Home = ({
	fixtures,
	standings,
	predictions: InitialPredictions,
	users,
	uid,
	route: InitialRoute,
	token,
}: {
	fixtures: Fixtures;
	standings: Standings;
	predictions: Predictions;
	users: Users;
	uid: string;
	route: Route;
	token: string;
}) => {
	const [predictions, setPredictions] = useState(InitialPredictions);

	const [route, setRoute] = useState<RouteInfo>({ page: InitialRoute, data: undefined });

	const updatePrediction = (prediction: Prediction, gameId: number) => {
		setPredictions({ ...predictions, [gameId]: { ...predictions[gameId], [uid]: prediction } });
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

	return (
		<RouteContext.Provider value={{ route, setRoute }}>
			<UserContext.Provider value={{ uid, token }}>
				<FixturesContext.Provider value={fixtures}>
					<PageLayout title={'Score Prediction'}>
						<MainComponent />
					</PageLayout>
				</FixturesContext.Provider>
			</UserContext.Provider>
		</RouteContext.Provider>
	);
};

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
	try {
		const { token } = nookies.get(ctx);

		const { uid } = await firebaseAdmin.auth().verifyIdToken(token);

		const fixtures = await fetchFixtures(token);

		const standings = await fetchStandings(token);

		const predictions = await fetchPredictions(token);

		const users = await fetchUsers(token);

		const route = uid in users && users[uid].isNewUser ? Route.Rules : Route.Home;

		const sorted = Object.entries(standings).sort();

		return {
			props: { fixtures, standings: sorted, predictions, users, uid, token, route },
		};
	} catch (err) {
		return {
			redirect: {
				permanent: false,
				destination: '/login',
			},
			props: {} as never,
		};
	}
};

export default Home;
