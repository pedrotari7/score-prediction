import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';
import React from 'react';

import useCompetition from '../hooks/useCompetition';
import { classNames } from '../lib/utils/reactHelper';

const RefreshPage = () => {
	const { gcc } = useCompetition();

	const router = useRouter();

	return (
		<div
			className={classNames(
				gcc('text-light'),
				'm-12 h-full select-none p-3 sm:m-24 sm:p-6',
				'flex flex-col items-center justify-center gap-12 sm:gap-20'
			)}
		>
			<div className={classNames('text-3xl font-bold sm:text-4xl md:text-7xl')}>Ups...</div>
			<img src='https://media.tenor.com/miO3B_ySjYkAAAAC/gerrard-lucu-futbol.gif' />
			<div className={classNames('text-center text-2xl font-bold sm:text-3xl md:text-6xl')}>
				Some information seems to be outdated please refresh the page{' '}
			</div>
			<div
				onClick={async () => {
					router.replace('/', undefined, { shallow: true });
				}}
				className={classNames(
					'flex h-16 w-48 cursor-pointer justify-center rounded-md p-4 px-6 text-3xl font-bold',
					gcc('bg-blue'),
					gcc('hover:bg-dark')
				)}
			>
				{
					<div className='flex items-center gap-2'>
						<ArrowPathIcon className='h-8 w-8' />
						<span>Refresh</span>
					</div>
				}
			</div>
		</div>
	);
};

export default RefreshPage;
