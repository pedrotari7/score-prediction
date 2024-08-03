import Head from 'next/head';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { useContext } from 'react';
import { competitions } from '../../shared/utils';
import CompetitionContext from '../context/CompetitionContext';
import Navbar from './Navbar';

const PageLayout = ({
	title,
	loading = false,
	setLoading,
	children,
}: {
	title: string;
	loading?: boolean;
	setLoading: Dispatch<SetStateAction<boolean>>;
	children: ReactNode;
}) => {
	const competition = useContext(CompetitionContext);

	const footerCompetitions = [competitions.euro2020, competitions.euro2024];

	const hasFooter = competition?.name && footerCompetitions.some(c => c.name === competition.name);

	let style =
		competition?.name === competitions.euro2020.name
			? { backgroundImage: 'url(/background.webp)' }
			: { background: '#181a1b' };

	if (competition?.name === competitions.ca2024.name) {
		style = {
			backgroundImage: 'url(/footer-ca2024.png)',
		};
	}
	return (
		<div className='flex h-screen w-screen flex-col overflow-x-hidden bg-cover bg-center bg-repeat-y' style={style}>
			<Head>
				<title>{title}</title>
				<link rel='icon' href='/favicon.ico' />
				<meta name='viewport' content='width=device-width, initial-scale=1.0' />
			</Head>

			<Navbar loading={loading} setLoading={setLoading} />

			<main className='relative top-16 z-10 flex h-[calc(100vh-4rem)] flex-col'>{children}</main>

			{hasFooter && (
				<div className='fixed bottom-0 w-full select-none'>
					<img src={`/footer-${competition.name}.png`} alt='' className='w-full opacity-15' />
				</div>
			)}
		</div>
	);
};

export default PageLayout;
