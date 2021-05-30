import { GetServerSidePropsContext } from 'next';

import nookies from 'nookies';

import { firebaseAdmin } from '../lib/firebaseAdmin';
import PageLayout from '../components/PageLayout';
import { fetchUsers } from './api';
import Rankings from '../components/Rankings';

export interface User {
	admin: boolean;
	displayName: string;
	email: string;
	photoURL: string;
	score: UserResult;
	uid: string;
}

export interface UserResult {
	exact: number;
	onescore: number;
	points: number;
	result: number;
	groups: number;
}

const ranking = ({ users }: { users: User[] }) => {
	return (
		<PageLayout title={'Score Prediction'}>
			<div className="bg-dark min-h-screen flex flex-row items-center justify-center ">
				<Rankings users={users} />
			</div>
		</PageLayout>
	);
};

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
	try {
		const { token } = nookies.get(ctx);

		await firebaseAdmin.auth().verifyIdToken(token);

		const { users } = await fetchUsers(token);

		return {
			props: { users },
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

export default ranking;
