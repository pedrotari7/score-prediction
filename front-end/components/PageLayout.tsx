import Head from 'next/head';
import { useAuth } from '../lib/auth';
import Navbar from './Navbar';

const PageLayout = ({ title, children }: { title: string; children: JSX.Element }) => {
	const { user } = useAuth();

	return (
		<div className="flex flex-col h-screen">
			<Head>
				<title>{title}</title>
				<link rel="icon" href="/favicon.ico" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			</Head>

			{user && <Navbar />}

			<main className="flex flex-col">{children}</main>
		</div>
	);
};

export default PageLayout;
