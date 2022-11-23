import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Leaderboard, Users } from '../../interfaces/main';
import CompetitionContext from '../context/CompetitionContext';
import RouteContext, { Route } from '../context/RouteContext';
import UpdateTournamentContext from '../context/UpdateTournamentContext';
import UserContext from '../context/UserContext';
import { classNames, getCompetitionClass } from '../lib/utils/reactHelper';
import { deleteLeaderboard, fetchLeaderboards } from '../pages/api';
import DeleteButton from './DeleteButton';
import RefreshButton from './RefreshButton';

const ListLeaderboards = ({ users }: { users: Users }) => {
	const { setRoute } = useContext(RouteContext)!;
	const competition = useContext(CompetitionContext);
	const userInfo = useContext(UserContext);
	const updateCompetition = useContext(UpdateTournamentContext)!;
	const [leaderboards, setLeaderboards] = useState<Leaderboard[]>([]);

	const update = useCallback(async () => {
		if (userInfo) {
			setLeaderboards(await fetchLeaderboards(userInfo.token));
		}
	}, [userInfo]);

	useEffect(() => {
		update();
	}, [update]);

	const gcc = (p: string) => getCompetitionClass(p, competition);

	return (
		<div className={classNames(gcc('text-light'), 'm-3 select-none rounded-md p-3 shadow-pop sm:m-6 sm:p-6')}>
			<div className={classNames('mb-4 flex flex-row items-center justify-between')}>
				<div className='text-2xl font-bold'>Leaderboards</div>
				<RefreshButton onClick={update} />
			</div>

			<div className='item-center flex w-full  flex-col justify-evenly'>
				{leaderboards &&
					leaderboards.map(l => {
						if (!l) return <></>;
						return (
							<div
								key={l.id}
								className='relative w-full '
								onClick={() => setRoute({ page: Route.Leaderboard, data: l.id })}
							>
								<div
									className={classNames(
										'w-full',
										gcc('bg-dark'),
										'my-2 flex flex-row items-center  gap-2 rounded p-4 sm:m-2',
										'cursor-pointer select-none hover:bg-opacity-50'
									)}
								>
									<DeleteButton
										className='absolute top-4 right-1 z-10'
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
												{users[l.creator].displayName}
											</span>
											<span>{l.id}</span>
										</div>

										<div className='flex flex-row flex-wrap gap-4'>
											{l.members.map(m => (
												<div
													key={m}
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
															className='mr-2 h-8 w-8 rounded-full object-cover'
															src={users[m]?.photoURL}
														/>
													)}
													{users[m].displayName}
												</div>
											))}
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
