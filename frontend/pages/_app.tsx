import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import { AuthProvider } from '../lib/auth';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
	useEffect(() => {
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.register('/sw.js').catch(() => {});
		}
	}, []);

	return (
		<ErrorBoundary>
			<AuthProvider>
				<Component {...pageProps} />
			</AuthProvider>
		</ErrorBoundary>
	);
}

export default MyApp;
