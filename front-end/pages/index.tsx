import { useState } from 'react';
import { GetServerSidePropsContext } from 'next';

import nookies from 'nookies';

import { firebaseAdmin } from '../lib/firebaseAdmin';
import PageLayout from '../components/PageLayout';
import Settings from '../components/Settings';
import Rankings from '../components/Rankings';
import Standings from '../components/Standings';

import { fetchFixtures, fetchStandings, fetchUsers, updateFixtures } from './api';
import FixturesContext from '../context/FixturesContext';
import UserContext from '../context/UserContext';
import RouteContext, { Route } from '../context/RouteContext';
import FixturesPage, { Fixtures, Prediction } from '../components/Fixtures';
import { User } from '../components/Rankings';

const Home = ({
	fixtures: InitialFixtures,
	standings,
	users,
	uid,
	token,
}: {
	fixtures: Fixtures;
	standings: [string, any][];
	users: User[];
	uid: string;
	token: string;
}) => {
	const [fixtures, setFixtures] = useState(InitialFixtures);
	const [route, setRoute] = useState(Route.Home);

	const updatePrediction = (prediction: Prediction, gameId: number) => {
		fixtures[gameId].predictions[uid] = prediction;
		setFixtures({ ...fixtures });
		updateFixtures(token, fixtures);
	};

	const MainComponent = () => {
		switch (route) {
			case Route.Home:
				return <FixturesPage fixtures={fixtures} updatePrediction={updatePrediction} />;
			case Route.Ranking:
				return <Rankings users={users} />;
			case Route.Standings:
				return <Standings standings={standings} />;
			case Route.Settings:
				return <Settings />;
			default:
				return <></>;
		}
	};

	return (
		<RouteContext.Provider value={{ route, setRoute }}>
			<UserContext.Provider value={{ uid, token }}>
				<FixturesContext.Provider value={{ fixtures, setFixtures }}>
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

		const { users } = await fetchUsers(token);

		const sorted = Object.entries(standings).sort();

		return {
			props: { fixtures, standings: sorted, users, uid, token },
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
