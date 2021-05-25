import { GetServerSidePropsContext } from 'next';

import nookies from 'nookies';

import { firebaseAdmin } from '../lib/firebaseAdmin';
import PageLayout from '../components/PageLayout';

const Home = ({ message }: { message: string }) => {
	return (
		<PageLayout title={'Score Prediction'}>
			<div>
				<div className="bg-dark flex flex-col min-h-screen items-center justify-center select-none text-light">
					<p>{message}</p>
				</div>
			</div>
		</PageLayout>
	);
};

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
	try {
		const cookies = nookies.get(ctx);
		const token = await firebaseAdmin.auth().verifyIdToken(cookies.token);
		const { uid, email } = token;

		return {
			props: {
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
