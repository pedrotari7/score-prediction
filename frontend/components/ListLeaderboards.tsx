import React, { useContext, useMemo, useState } from 'react';
import type { Leaderboard, Users } from '../../interfaces/main';
import RouteContext, { Route } from '../context/RouteContext';
import UpdateTournamentContext from '../context/UpdateTournamentContext';
import UserContext from '../context/UserContext';
import useCompetition from '../hooks/useCompetition';
import useLeaderboards from '../hooks/useLeaderboards';
import { classNames } from '../lib/utils/reactHelper';
import { deleteLeaderboard } from '../pages/api';
import DeleteButton from './DeleteButton';
import Loading from './Loading';
import RefreshButton from './RefreshButton';

type SortKey = 'name' | 'members';

const sortLeaderboards = (list: Leaderboard[], key: SortKey, asc: boolean) => {
	const sorted = [...list].sort((a, b) => {
		switch (key) {
			case 'name':
				return a.name.localeCompare(b.name);
			case 'members':
				return a.members.length - b.members.length;
			default:
				return 0;
		}
	});
	return asc ? sorted : sorted.reverse();
};

const ListLeaderboards = ({ users }: { users: Users }) => {
	const { setRoute } = useContext(RouteContext)!;
	const { gcc } = useCompetition();
	const userInfo = useContext(UserContext);
	const updateCompetition = useContext(UpdateTournamentContext)!;

	const { update, loading, leaderboards } = useLeaderboards();

	const [sortKey, setSortKey] = useState<SortKey>('name');
	const [sortAsc, setSortAsc] = useState(true);

	const handleSort = (key: SortKey) => {
		if (sortKey === key) {
			setSortAsc(prev => !prev);
		} else {
			setSortKey(key);
			setSortAsc(true);
		}
	};

	const sorted = useMemo(() => sortLeaderboards(leaderboards, sortKey, sortAsc), [leaderboards, sortKey, sortAsc]);

	if (loading) return <Loading message='Fetching leaderboards' />;

	const SortButton = ({ label, value }: { label: string; value: SortKey }) => (
		<button
			onClick={() => handleSort(value)}
			className={classNames(
				'rounded-md px-3 py-1 text-sm font-bold',
				sortKey === value ? 'bg-gray-500' : 'bg-gray-700 hover:bg-gray-600'
			)}
		>
			{label} {sortKey === value ? (sortAsc ? '▲' : '▼') : ''}
		</button>
	);

	return (
		<div className={classNames(gcc('text-light'), 'm-3 select-none rounded-md p-3 shadow-pop sm:m-6 sm:p-6')}>
			<div className={classNames('mb-4 flex flex-row items-center justify-between')}>
				<div className='text-2xl font-bold'>Leaderboards</div>
				<RefreshButton onClick={update} />
			</div>

			<div className='mb-4 flex flex-row gap-2'>
				<SortButton label='Name' value='name' />
				<SortButton label='Members' value='members' />
			</div>

			<div className='flex w-full flex-col justify-evenly'>
				{sorted.map((l, index) => {
					if (!l) return <></>;
					return (
						<div
							key={index}
							className='relative w-full'
							onClick={() => setRoute({ page: Route.Leaderboard, data: l.id })}
						>
							<div
								className={
									classNames(
										'w-full',
										gcc('bg-dark'),
										'my-2 flex flex-row items-center gap-2 rounded p-4 sm:m-2',
										'cursor-pointer select-none'
									) +
									' ' +
									// eslint-disable-next-line tailwindcss/migration-from-tailwind-2
									classNames('hover:bg-opacity-50')
								}
							>
								<DeleteButton
									className='absolute right-1 top-4 z-10'
									onClick={async () => {
										if (userInfo) {
											await deleteLeaderboard(l.id, userInfo.token);
											await updateCompetition();
										}
									}}
								/>
								<div className='flex flex-col gap-4'>
									<div className='flex flex-row flex-wrap items-center gap-4 text-lg'>
										<span className='font-bold'>{l?.name}</span>
										<span className='opacity-50'>({l.members.length})</span>
									</div>
									<div className='flex items-center gap-4'>
										<span className={classNames('bg-gray-800', 'rounded-md p-2')}>
											{users[l.creator]?.displayName}
										</span>
										<span>{l.id}</span>
									</div>

									<div className='flex flex-row flex-wrap gap-4'>
										{l.members.map((m, index) =>
											users[m] ? (
												<div
													key={index}
													className={classNames(
														gcc('bg-blue'),
														gcc('hover:bg-dark'),
														'flex flex-row items-center rounded-md p-2'
													)}
													onClick={e => {
														e.stopPropagation();
														setRoute({ page: Route.Predictions, data: m });
													}}
												>
													{users[m]?.photoURL && (
														<img
															className='mr-2 size-8 rounded-full object-cover'
															src={users[m]?.photoURL}
														/>
													)}
													{users[m]?.displayName}
												</div>
											) : (
												<> </>
											)
										)}
									</div>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default ListLeaderboards;
