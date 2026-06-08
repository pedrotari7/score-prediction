import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import { AuthProvider, useAuth } from '../lib/auth';
import { destroyMetrics, getMetrics } from '../lib/metrics';
import '../styles/globals.css';

function MetricsInit() {
	const { user } = useAuth();

	useEffect(() => {
		if (!user?.token) return;

		const metrics = getMetrics();
		metrics.init(user.token);
		metrics.updateToken(user.token);
	}, [user?.token]);

	useEffect(() => {
		return () => {
			destroyMetrics();
		};
	}, []);

	return null;
}

function MyApp({ Component, pageProps }: AppProps) {
	useEffect(() => {
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.register('/sw.js').catch(() => {});
		}
	}, []);

	return (
		<ErrorBoundary>
			<AuthProvider>
				<MetricsInit />
				<Component {...pageProps} />
			</AuthProvider>
		</ErrorBoundary>
	);
}

export default MyApp;
