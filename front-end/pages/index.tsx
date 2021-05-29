import { useState } from 'react';
import { GetServerSidePropsContext } from 'next';

import nookies from 'nookies';

import Game from '../components/Game';
import { firebaseAdmin } from '../lib/firebaseAdmin';
import PageLayout from '../components/PageLayout';
import { fetchFixtures, updateFixtures } from './api';
import FixturesContext from '../context/FixturesContext';
import UserContext from '../context/UserIDContext';

export interface Prediction {
	home: string;
	away: string;
}
export interface Predictions {
	[key: string]: Prediction;
}

export interface Team {
	id: number;
	name: string;
	logo: string;
	winner: null;
}
export interface Teams {
	away: Team;
	home: Team;
}

export interface Venue {
	city: string;
	id: number;
	name: string;
}

export interface FixtureData {
	id: number;
	date: string;
	periods: Object;
	referee: Object;
	status: Object;
	timestamp: number;
	timezone: string;
	venue: Venue;
}
export interface Fixture {
	predictions: Predictions;
	fixture: FixtureData;
	teams: Teams;
}
export interface Fixtures {
	[key: string]: Fixture;
}

const Home = ({ fixtures: InitialFixtures, uid, token }: { fixtures: Fixtures; uid: string; token: string }) => {
	const [fixtures, setFixtures] = useState(InitialFixtures);

	const updatePrediction = (prediction: Prediction, gameId: number) => {
		fixtures[gameId].predictions[uid] = prediction;
		setFixtures({ ...fixtures });
		updateFixtures(token, fixtures);
	};

	return (
		<UserContext.Provider value={{ uid, token }}>
			<FixturesContext.Provider value={{ fixtures, setFixtures }}>
				<PageLayout title={'Score Prediction'}>
					<div className="bg-dark min-h-screen ">
						<main className="flex flex-col justify-center select-none text-light m-6">
							{Object.values(fixtures).map(game => (
								<Game
									gameID={game.fixture.id}
									updatePrediction={(update: Prediction) => updatePrediction(update, game.fixture.id)}
									key={game.fixture.id}
								/>
							))}
						</main>
					</div>
				</PageLayout>
			</FixturesContext.Provider>
		</UserContext.Provider>
	);
};

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
	try {
		const cookies = nookies.get(ctx);

		const { uid } = await firebaseAdmin.auth().verifyIdToken(cookies.token);

		const fixtures = await fetchFixtures(cookies.token);

		return {
			props: {
				fixtures,
				uid,
				token: cookies.token,
			},
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
