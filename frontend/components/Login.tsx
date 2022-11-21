import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import Head from 'next/head';
import { app } from '../lib/firebaseClient';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const Login = () => {
	const isFacebookApp = () => {
		const ua = (navigator.userAgent || navigator.vendor || (window as any)['opera']) ?? '';
		return ua.indexOf('FBAN') > -1 || ua.indexOf('FBAV') > -1;
	};

	const isAllowedBrowser = !isFacebookApp();

	return (
		<div className="w-screen h-screen">
			<Head>
				<title>Login</title>
				<link rel="icon" href="/favicon.ico" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			</Head>
			<video className="absolute object-cover h-full" src="/sample.m4v" muted autoPlay></video>
			<div className="flex flex-col items-center justify-evenly absolute w-screen h-full bg-[#181a1b] bg-opacity-90">
				<div className="text-light text-4xl md:text-8xl font-bold text-center">SCORE PREDICTION</div>
				{isAllowedBrowser && (
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
				)}
				{!isAllowedBrowser && (
					<div className="bg-red-200 text-2xl rounded-md p-4 flex flex-row items-center gap-2">
						<ExclamationTriangleIcon className="text-red-800 h-10 w-10 font-bold" />
						<span className="text-red-800"> Browser not supported </span>
					</div>
				)}
			</div>
		</div>
	);
};

export default Login;
