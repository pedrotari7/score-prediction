import Head from 'next/head';
import { Dispatch, ReactNode, SetStateAction, useContext } from 'react';
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

	const isEuro2020 = competition?.name === competitions.euro2020.name;

	const style = isEuro2020 ? { backgroundImage: 'url(/background.webp)' } : { background: '#181a1b' };
	return (
		<div className='flex h-screen w-screen flex-col overflow-x-hidden bg-cover bg-center bg-repeat-y' style={style}>
			<Head>
				<title>{title}</title>
				<link rel='icon' href='/favicon.ico' />
				<meta name='viewport' content='width=device-width, initial-scale=1.0' />
			</Head>

			<Navbar loading={loading} setLoading={setLoading} />

			<main className='relative top-16 z-10 flex h-[calc(100vh-4rem)] flex-col'>{children}</main>

			{isEuro2020 && (
				<div className='fixed bottom-0 w-full select-none'>
					<img src='/footer.png' alt='' className='w-full opacity-70' />
				</div>
			)}
		</div>
	);
};

export default PageLayout;
