import { GetServerSidePropsContext } from 'next';

import nookies from 'nookies';

import fetchFixtures from './api/fetchFixtures';
import Game from '../components/Game';
import { firebaseAdmin } from '../lib/firebaseAdmin';
import PageLayout from '../components/PageLayout';

const Fixts = ({ fixtures }: { fixtures: Object }) => {
	return (
		<PageLayout title={'Score Predictio'}>
			<div>
				<main className="bg-dark min-h-screen flex flex-col justify-center select-none text-light">
					{Object.values(fixtures).map(game => (
						<Game game={game} key={game.fixture.id} />
					))}
				</main>
			</div>
		</PageLayout>
	);
};

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
	try {
		const cookies = nookies.get(ctx);

		await firebaseAdmin.auth().verifyIdToken(cookies.token);

		const fixtures = await fetchFixtures(cookies.token);

		return {
			props: {
				fixtures,
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

export default Fixts;
