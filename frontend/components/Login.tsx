import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import Head from 'next/head';
import Image from 'next/image';
import { app } from '../lib/firebaseClient';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import useCompetition from '../hooks/useCompetition';

const GoogleIcon = () => (
	<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48' className='size-6'>
		<path
			fill='#EA4335'
			d='M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z'
		/>
		<path
			fill='#4285F4'
			d='M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z'
		/>
		<path
			fill='#FBBC05'
			d='M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z'
		/>
		<path
			fill='#34A853'
			d='M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z'
		/>
	</svg>
);

const Login = () => {
	const isFacebookApp = () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const ua = (navigator.userAgent || navigator.vendor || (window as any)['opera']) ?? '';
		return ua.indexOf('FBAN') > -1 || ua.indexOf('FBAV') > -1;
	};

	const { competition } = useCompetition();

	const isAllowedBrowser = !isFacebookApp();

	const signIn = () => signInWithPopup(getAuth(app), new GoogleAuthProvider());

	return (
		<div className='h-screen w-screen'>
			<Head>
				<title>Login</title>
				<link rel='icon' href={`/favicon-${competition?.name}.ico`} />
				<meta name='viewport' content='width=device-width, initial-scale=1.0' />
			</Head>
			<video
				className='absolute size-full object-cover'
				autoPlay
				loop
				muted
				playsInline
				poster='/sample-poster.jpg'
				preload='metadata'
			>
				<source src='/sample.mp4' type='video/mp4' />
				<source src='/sample.m4v' type='video/x-m4v' />
			</video>
			<div className='absolute flex h-full w-screen flex-col items-center justify-evenly bg-[#181a1b]/95'>
				<div className='select-none text-center text-4xl font-bold text-light md:text-8xl'>
					SCORE PREDICTION
				</div>
				<Image
					src={competition.logo}
					width={192}
					height={192}
					alt='logo'
					className='block h-16 w-auto sm:h-48'
				/>
				{isAllowedBrowser ? (
					<button
						onClick={signIn}
						className='flex cursor-pointer items-center gap-3 rounded-md bg-white px-6 py-3 text-sm font-medium text-gray-800 shadow-md transition hover:bg-gray-100 active:bg-gray-200'
					>
						<GoogleIcon />
						Sign in with Google
					</button>
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
