import Head from 'next/head';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { competitions } from '../../shared/utils';
import { useTournamentStore } from '../store/tournamentStore';
import BoostAnimation from './BoostAnimation';
import Navbar from './Navbar';
import PwaInstallPrompt from './PwaInstallPrompt';

const PageLayout = ({
	title,
	loading = false,
	setLoading,
	children,
}: {
	title: string;
	loading?: boolean;
	setLoading: (loading: boolean) => void;
	children: ReactNode;
}) => {
	const competition = useTournamentStore(s => s.competition);

	const footerCompetitions = [competitions.euro2020, competitions.euro2024];

	const hasFooter = competition?.name && footerCompetitions.some(c => c.name === competition.name);

	let style: React.CSSProperties =
		competition?.name === competitions.euro2020.name
			? { backgroundImage: 'url(/background.webp)' }
			: {
					background: competition?.color
						? `linear-gradient(to bottom right, ${competition.color}, ${competition.color}66, #0f172a)`
						: '#181a1b',
				};

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

			<BoostAnimation />
			<PwaInstallPrompt />

			{hasFooter && (
				<div className='fixed bottom-0 w-full select-none'>
					<Image
						src={`/footer-${competition.name}.png`}
						alt=''
						width={2048}
						height={1052}
						className='w-full opacity-15'
						style={{ height: 'auto' }}
					/>
				</div>
			)}
		</div>
	);
};

export default PageLayout;
