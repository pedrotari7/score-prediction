import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
import { firebaseClient } from '../lib/firebaseClient';
import PageLayout from '../components/PageLayout';

const Login = () => {
	const uiConfig = {
		signInFlow: 'redirect',
		signInSuccessUrl: '/',
		signInOptions: [firebaseClient.auth.GoogleAuthProvider.PROVIDER_ID],
	};

	return (
		<PageLayout title={'Login'}>
			<div className="flex flex-col items-center justify-evenly absolute w-screen h-panel">
				<div className="text-light text-4xl md:text-8xl font-bold text-center">SCORE PREDICTION</div>
				<img src="/euro2020.svg" className="h-44 md:h-56" />
				<StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={firebaseClient.auth()} />
			</div>
		</PageLayout>
	);
};

export default Login;
