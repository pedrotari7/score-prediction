import { ArrowPathIcon } from '@heroicons/react/24/outline';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Leaderboard, Users } from '../../interfaces/main';
import CompetitionContext from '../context/CompetitionContext';
import RouteContext, { Route } from '../context/RouteContext';
import UpdateTournamentContext from '../context/UpdateTournamentContext';
import UserContext from '../context/UserContext';
import { classNames, getCompetitionClass } from '../lib/utils/reactHelper';
import { deleteLeaderboard, fetchLeaderboards } from '../pages/api';
import DeleteButton from './DeleteButton';

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
		<div className={classNames(gcc('text-light'), 'm-3 sm:m-6 p-3 sm:p-6 shadow-pop rounded-md select-none')}>
			<div className={classNames('flex flex-row items-center justify-between mb-4')}>
				<div className="font-bold text-2xl">Leaderboards</div>
				<ArrowPathIcon
					className={classNames(gcc('text-light'), 'h-6 w-6', 'hover:opacity-80 cursor-pointer')}
					onClick={() => update()}
				/>
			</div>

			<div className="flex flex-col item-center  justify-evenly w-full">
				{leaderboards &&
					leaderboards.map(l => {
						if (!l) return <></>;
						return (
							<div
								key={l.id}
								className="relative w-full "
								onClick={() => setRoute({ page: Route.Leaderboard, data: l.id })}>
								<div
									className={classNames(
										'w-full',
										gcc('bg-dark'),
										'flex flex-row items-center gap-2  my-2 sm:m-2 rounded p-4',
										'cursor-pointer hover:bg-opacity-50 select-none'
									)}>
									<DeleteButton
										className="absolute top-4 right-1 z-10"
										onClick={async () => {
											if (userInfo) {
												await deleteLeaderboard(l.id, userInfo.token);
												await updateCompetition();
											}
										}}
									/>
									<div className="flex flex-col gap-4">
										<div className="flex flex-row flex-wrap items-center gap-4 text-lg">
											<span className="font-bold">{l?.name}</span>
											<span className="opacity-50">({l.members.length})</span>
										</div>
										<div className="flex gap-4 items-center">
											<span className={classNames('bg-gray-800', 'p-2 rounded-md')}>
												{users[l.creator].displayName}
											</span>
											<span>{l.id}</span>
										</div>

										<div className="flex flex-row gap-4 flex-wrap">
											{l.members.map(m => (
												<div
													key={m}
													className={classNames(
														gcc('bg-blue'),
														gcc('hover:bg-dark'),
														'p-2 rounded-md'
													)}
													onClick={e => {
														e.stopPropagation();
														setRoute({ page: Route.Predictions, data: m });
													}}>
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
