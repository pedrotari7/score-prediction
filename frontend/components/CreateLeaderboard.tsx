import { PlusCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import React, { useContext, useEffect, useRef, useState } from 'react';
import RouteContext, { Route } from '../context/RouteContext';
import UpdateTournamentContext from '../context/UpdateTournamentContext';
import UserContext from '../context/UserContext';
import useCompetition from '../hooks/useCompetition';
import { classNames } from '../lib/utils/reactHelper';
import { createLeaderboard } from '../pages/api';
import Loading from './Loading';

const CreateLeaderboard = () => {
	const updateCompetition = useContext(UpdateTournamentContext)!;
	const inputRef = useRef<HTMLInputElement>(null);
	const userInfo = useContext(UserContext);
	const routeInfo = useContext(RouteContext);
	const [loading, setLoading] = useState(false);

	const [open, setOpen] = useState(false);

	const { gcc } = useCompetition();
	useEffect(() => {
		if (open) inputRef.current?.focus();
	}, [open]);

	const handleCreate = async () => {
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
	};

	return (
		<div
			className={classNames(
				!open ? gcc('hover:bg-dark') : '',
				'flex h-12 cursor-pointer flex-row items-center gap-2 rounded-md p-2 font-bold',
				'max-w-full transition-all duration-100 ease-in-out'
			)}
			onClick={() => setOpen(true)}
		>
			{!open && (
				<div className=''>
					<PlusCircleIcon className={classNames(gcc('text-light'), 'size-8 cursor-pointer')} />
				</div>
			)}
			{open && (
				<>
					<input
						placeholder='leaderboard name'
						type='text'
						maxLength={50}
						className='w-48 bg-white px-3 py-2 text-black focus:outline-none'
						ref={inputRef}
						onKeyDown={e => {
							if (e.key === 'Enter') handleCreate();
						}}
						onClick={e => e.stopPropagation()}
					/>
					<div
						className={classNames(
							gcc('bg-blue'),
							'flex h-10 w-20 cursor-pointer items-center justify-center rounded-md p-2'
						)}
						onClick={async e => {
							e.stopPropagation();
							await handleCreate();
						}}
					>
						{loading && <Loading className='size-4' />}
						{!loading && <div>Create</div>}
					</div>
					<div
						className={classNames(
							gcc('text-light'),
							'flex size-10 cursor-pointer items-center justify-center rounded-md p-2 hover:bg-gray-700'
						)}
						onClick={e => {
							e.stopPropagation();
							setOpen(false);
						}}
					>
						<XMarkIcon className='size-5' />
					</div>
				</>
			)}
			{!open && <div>Create</div>}
		</div>
	);
};

export default CreateLeaderboard;
