import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import Head from 'next/head';
import { app } from '../lib/firebaseClient';
import { Dispatch, SetStateAction } from 'react';

const Login = ({ setSuccessfulLogin }: { setSuccessfulLogin: Dispatch<SetStateAction<boolean>> }) => {
	const uiConfig: firebaseui.auth.Config = {
		signInOptions: [GoogleAuthProvider.PROVIDER_ID],
		callbacks: {
			// Avoid redirects after sign-in.
			signInSuccessWithAuthResult: () => {
				setSuccessfulLogin(true);
				return false;
			},
		},
	};

	return (
		<div className="w-screen h-screen">
			<Head>
				<title>Login</title>
				<link rel="icon" href="/favicon.ico" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			</Head>
			<video className="absolute object-cover h-full" src="/sample.m4v" muted autoPlay></video>
			<div className="flex flex-col items-center justify-evenly absolute w-screen h-full bg-[#242424] bg-opacity-90">
				<div className="text-light text-4xl md:text-8xl font-bold text-center">SCORE PREDICTION</div>
				<StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={getAuth(app)} />
			</div>
		</div>
	);
};

export default Login;
