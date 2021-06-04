import Head from 'next/head';
import { useAuth } from '../lib/auth';
import Navbar from './Navbar';

const PageLayout = ({ title, children }: { title: string; children: JSX.Element }) => {
	const { user } = useAuth();

	return (
		<div
			className="flex flex-col bg-cover bg-center bg-repeat-y w-screen h-screen overflow-scroll"
			style={{ backgroundImage: 'url(/background.webp)' }}>
			<Head>
				<title>{title}</title>
				<link rel="icon" href="/favicon.ico" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			</Head>

			{user && <Navbar />}

			<main className="flex flex-col relative top-16 z-10 w-screen pb-16">{children}</main>

			<div className="fixed bottom-0">
				<img src="/footer.png" alt="" className="w-full opacity-70" />
			</div>
		</div>
	);
};

export default PageLayout;
