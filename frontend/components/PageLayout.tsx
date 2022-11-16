import Head from 'next/head';
import { ReactNode, useContext } from 'react';
import { competitions } from '../../shared/utils';
import CompetitionContext from '../context/CompetitionContext';
import Navbar from './Navbar';

const PageLayout = ({
	title,
	loading = false,
	children,
}: {
	title: string;
	loading?: boolean;
	children: ReactNode;
}) => {
	const competition = useContext(CompetitionContext);

	const isEuro2020 = competition?.name === competitions.euro2020.name;

	const style = isEuro2020 ? { backgroundImage: 'url(/background.webp)' } : { background: '#181a1b' };
	return (
		<div className="flex flex-col bg-cover bg-center bg-repeat-y h-screen w-screen overflow-x-hidden" style={style}>
			<Head>
				<title>{title}</title>
				<link rel="icon" href="/favicon.ico" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			</Head>

			<Navbar loading={loading} />

			<main className="flex flex-col relative top-16 h-[calc(100vh-4rem)] z-10">{children}</main>

			{isEuro2020 && (
				<div className="fixed bottom-0 w-full select-none">
					<img src="/footer.png" alt="" className="w-full opacity-70" />
				</div>
			)}
		</div>
	);
};

export default PageLayout;
