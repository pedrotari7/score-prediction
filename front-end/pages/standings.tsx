import { GetServerSidePropsContext } from 'next';

import nookies from 'nookies';

import Standings from '../components/Standings';
import { firebaseAdmin } from '../lib/firebaseAdmin';
import PageLayout from '../components/PageLayout';
import { fetchStandings } from './api';

const Stands = ({ standings }: { standings: [string, any][] }) => {
	return (
		<PageLayout title={'Score Prediction'}>
			<div>
				<main className="bg-dark min-h-screen flex flex-col justify-center select-none text-light">
					<Standings standings={standings} />
				</main>
			</div>
		</PageLayout>
	);
};

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
	try {
		const cookies = nookies.get(ctx);

		await firebaseAdmin.auth().verifyIdToken(cookies.token);

		const standings = await fetchStandings(cookies.token);

		const sorted = Object.entries(standings).sort();

		return {
			props: {
				standings: sorted,
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

export default Stands;
