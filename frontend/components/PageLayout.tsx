import Head from 'next/head';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { competitions } from '../../shared/utils';
import { useTournamentStore } from '../store/tournamentStore';
import BoostAnimation from './BoostAnimation';
import BoostReminderModal from './BoostReminderModal';
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
		<div
			className='relative flex h-screen w-screen flex-col overflow-x-hidden bg-cover bg-center bg-repeat-y'
			style={style}
		>
			<Head>
				<title>{title}</title>
				<link rel='icon' href='/favicon.ico' />
				<meta name='viewport' content='width=device-width, initial-scale=1.0' />
			</Head>

			{competition?.color && (
				<div className='pointer-events-none fixed inset-0 z-0 overflow-hidden'>
					<div
						className='absolute -left-1/4 -top-1/4 size-[60vmax] rounded-full opacity-30 blur-[120px]'
						style={{ background: competition.color }}
					/>
					<div
						className='absolute -bottom-1/4 -right-1/4 size-[60vmax] rounded-full opacity-20 blur-[120px]'
						style={{ background: competition.color }}
					/>
				</div>
			)}

			<Navbar loading={loading} setLoading={setLoading} />

			<main className='relative top-16 z-10 flex h-[calc(100vh-4rem-4.5rem)] flex-col lg:h-[calc(100vh-4rem)]'>
				{children}
				<div className='h-20 shrink-0 lg:hidden' aria-hidden='true' />
			</main>

			<BoostAnimation />
			<BoostReminderModal />
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
