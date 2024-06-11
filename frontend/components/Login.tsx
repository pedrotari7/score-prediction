import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import Head from 'next/head';
import { app } from '../lib/firebaseClient';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import useCompetition from '../hooks/useCompetition';

const Login = () => {
	const isFacebookApp = () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const ua = (navigator.userAgent || navigator.vendor || (window as any)['opera']) ?? '';
		return ua.indexOf('FBAN') > -1 || ua.indexOf('FBAV') > -1;
	};

	const { competition } = useCompetition();

	const isAllowedBrowser = !isFacebookApp();

	return (
		<div className='h-screen w-screen'>
			<Head>
				<title>Login</title>
				<link rel='icon' href={`/favicon-${competition?.name}.ico`} />
				<meta name='viewport' content='width=device-width, initial-scale=1.0' />
			</Head>
			<img className='absolute size-full object-cover' src='/sample.gif' alt='background' />
			<div className='absolute flex h-full w-screen flex-col items-center justify-evenly bg-[#181a1b]/95'>
				<div className='select-none text-center text-4xl font-bold text-light md:text-8xl'>
					SCORE PREDICTION
				</div>
				<img className='block h-16 w-auto sm:h-48' src={competition.logo} alt='logo' />
				{isAllowedBrowser ? (
					<StyledFirebaseAuth
						uiConfig={{
							signInOptions: [GoogleAuthProvider.PROVIDER_ID],
							signInFlow: 'popup',
							callbacks: {
								// Avoid redirects after sign-in.
								signInSuccessWithAuthResult: () => false,
							},
						}}
						firebaseAuth={getAuth(app)}
					/>
				) : (
					<div className='flex flex-row items-center gap-2 rounded-md bg-red-200 p-4 text-2xl'>
						<ExclamationTriangleIcon className='size-10 font-bold text-red-800' />
						<span className='text-red-800'> Browser not supported </span>
					</div>
				)}
			</div>
		</div>
	);
};

export default Login;
