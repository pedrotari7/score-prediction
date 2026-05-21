import type { AppProps } from 'next/app';
import ErrorBoundary from '../components/ErrorBoundary';
import { AuthProvider } from '../lib/auth';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
	return (
		<ErrorBoundary>
			<AuthProvider>
				<Component {...pageProps} />
			</AuthProvider>
		</ErrorBoundary>
	);
}

export default MyApp;
