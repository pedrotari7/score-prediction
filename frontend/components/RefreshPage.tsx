import { ArrowPathIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';

import useCompetition from '../hooks/useCompetition';
import { useTournamentStore } from '../store/tournamentStore';
import { classNames } from '../lib/utils/reactHelper';

const RefreshPage = () => {
	const { gcc } = useCompetition();
	const updateTournament = useTournamentStore(s => s.updateTournament);
	const [retrying, setRetrying] = useState(false);

	const handleRetry = async () => {
		setRetrying(true);
		await updateTournament();
		setRetrying(false);
	};

	return (
		<div
			className={classNames(
				gcc('text-light'),
				'm-12 h-full select-none p-3 sm:m-24 sm:p-6',
				'flex flex-col items-center justify-center gap-8 sm:gap-12'
			)}
		>
			<div className={classNames('text-3xl font-bold sm:text-4xl md:text-7xl')}>Oops...</div>
			<img src='https://media.tenor.com/miO3B_ySjYkAAAAC/gerrard-lucu-futbol.gif' />
			<div className={classNames('text-center text-xl font-bold sm:text-2xl md:text-4xl')}>
				Something went wrong loading data
			</div>
			<button
				onClick={handleRetry}
				disabled={retrying}
				className={classNames(
					'flex h-16 w-48 cursor-pointer items-center justify-center gap-2 rounded-md px-6 text-2xl font-bold',
					gcc('bg-blue'),
					!retrying ? gcc('hover:bg-dark') : 'opacity-50'
				)}
			>
				<ArrowPathIcon className={classNames('size-8', retrying ? 'animate-spin' : '')} />
				<span>{retrying ? 'Retrying' : 'Retry'}</span>
			</button>
			<div className='text-center text-sm opacity-50'>If this persists, try signing out and back in</div>
		</div>
	);
};

export default RefreshPage;
