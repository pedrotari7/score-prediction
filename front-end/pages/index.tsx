import { GetServerSidePropsContext } from 'next';
import { useRouter } from 'next/router';

import nookies from 'nookies';

import fetchStandings from './api/fetchStandings';
import fetchFixtures from './api/fetchFixtures';
import Standings from '../components/Standings';
import Game from '../components/Game';
import { useAuth } from '../lib/auth';
import { firebaseAdmin } from '../lib/firebaseAdmin';
import { firebaseClient } from '../lib/firebaseClient';
import PageLayout from '../components/PageLayout';

const Home = ({ standings, fixtures, message }: { standings: [string, any][]; fixtures: Object; message: string }) => {
	const { user } = useAuth();
	const router = useRouter();

	return (
		<PageLayout title={'Score Predictio'}>
			<div>
				<main className="bg-dark min-h-screen flex flex-col justify-center select-none text-light">
					<h1 className="text text-6xl w-full text-center text-light">Score Prediction</h1>
					<div>
						<p>{message}</p>
						<button
							onClick={async () => {
								await firebaseClient
									.auth()
									.signOut()
									.then(() => {
										router.push('/');
									});
							}}>
							Sign out
						</button>
					</div>

					{Object.values(fixtures).map(game => (
						<Game game={game} key={game.fixture.id} />
					))}

					<Standings standings={standings} />
				</main>
			</div>
		</PageLayout>
	);
};

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
	try {
		const cookies = nookies.get(ctx);
		const token = await firebaseAdmin.auth().verifyIdToken(cookies.token);
		const { uid, email } = token;

		const standings = await fetchStandings(cookies.token);
		const fixtures = await fetchFixtures(cookies.token);

		const sorted = Object.entries(standings).sort();

		return {
			props: {
				standings: sorted,
				fixtures,
				message: `Your email is ${email} and your UID is ${uid}.`,
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
