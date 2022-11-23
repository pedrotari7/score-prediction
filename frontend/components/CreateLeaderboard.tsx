import { PlusCircleIcon } from '@heroicons/react/24/outline';
import React, { useContext, useEffect, useRef, useState } from 'react';
import CompetitionContext from '../context/CompetitionContext';
import RouteContext, { Route } from '../context/RouteContext';
import UpdateTournamentContext from '../context/UpdateTournamentContext';
import UserContext from '../context/UserContext';
import { classNames, getCompetitionClass } from '../lib/utils/reactHelper';
import { createLeaderboard } from '../pages/api';
import Loading from './Loading';

const CreateLeaderboard = () => {
	const competition = useContext(CompetitionContext);
	const updateCompetition = useContext(UpdateTournamentContext)!;
	const inputRef = useRef<HTMLInputElement>(null);
	const userInfo = useContext(UserContext);
	const routeInfo = useContext(RouteContext);
	const [loading, setLoading] = useState(false);

	const [open, setOpen] = useState(false);

	const gcc = (p: string) => getCompetitionClass(p, competition);

	useEffect(() => {
		inputRef.current?.focus();
	}, [inputRef]);

	return (
		<div
			className={classNames(
				!open ? gcc('hover:bg-dark') : '',
				'flex h-12 cursor-pointer flex-row items-center gap-2 rounded-md p-2 font-bold',
				'max-w-full transition-all duration-100 ease-in-out'
			)}
			onClick={async () => setOpen(true)}
		>
			<div className=''>
				<PlusCircleIcon className={classNames(gcc('text-light'), 'h-8 w-8 cursor-pointer')} />
			</div>
			{open && (
				<>
					<input
						placeholder='leaderboard name'
						type='text'
						className='w-48 bg-white px-3 py-2 text-black focus:outline-none'
						ref={inputRef}
					/>
					<div
						className={classNames(
							gcc('bg-blue'),
							'flex h-10 w-20 cursor-pointer items-center justify-center rounded-md p-2'
						)}
						onClick={async () => {
							if (inputRef.current && userInfo && !loading) {
								setLoading(true);
								const name = inputRef.current.value;
								if (name) {
									const result = await createLeaderboard(name, userInfo.token);
									await updateCompetition();
									if (result.success && routeInfo) {
										routeInfo.setRoute({ page: Route.Leaderboard, data: result.uid });
									}
								}
								setLoading(false);
							}
						}}
					>
						{loading && <Loading className='h-4 w-4' />}
						{!loading && <div>Create</div>}
					</div>
				</>
			)}
			{!open && <div>Create</div>}
		</div>
	);
};

export default CreateLeaderboard;
