import { GetServerSidePropsContext } from 'next';

import nookies from 'nookies';

import { firebaseAdmin } from '../lib/firebaseAdmin';
import PageLayout from '../components/PageLayout';
import { resetFixtures, resetStandings } from './api';

const Settings = ({ token }: { token: string }) => {
	return (
		<PageLayout title={'Score Prediction'}>
			<div className="bg-dark min-h-screen flex flex-row items-center justify-center ">
				<button
					onClick={() => resetStandings(token)}
					className="bg-blue text-white font-bold py-2 px-4 rounded mr-5">
					Fetch Rankings
				</button>
				<button
					onClick={() => resetFixtures(token)}
					className="bg-blue text-white font-bold py-2 px-4 rounded mr-5">
					Fetch Fixtures
				</button>
			</div>
		</PageLayout>
	);
};

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
	try {
		const { token } = nookies.get(ctx);

		await firebaseAdmin.auth().verifyIdToken(token);

		return {
			props: { token },
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

export default Settings;
