import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
import { firebaseClient } from '../lib/firebaseClient';
import PageLayout from '../components/PageLayout';

const uiConfig = {
	signInFlow: 'redirect',
	signInSuccessUrl: '/',
	signInOptions: [firebaseClient.auth.GoogleAuthProvider.PROVIDER_ID],
};

const Login = (_props: any) => {
	return (
		<PageLayout title={'Login'}>
			<div className="flex items-center justify-center h-screen bg-dark">
				<StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={firebaseClient.auth()} />
			</div>
		</PageLayout>
	);
};

export default Login;
