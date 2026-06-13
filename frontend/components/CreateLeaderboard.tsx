import { PlusCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useRef, useState } from 'react';
import type { Leaderboard } from '../../interfaces/main';
import { useTournamentStore } from '../store/tournamentStore';
import useCompetition from '../hooks/useCompetition';
import { classNames } from '../lib/utils/reactHelper';
import { createLeaderboard, fetchLeaderboards } from '../pages/api';
import Loading from './Loading';

const CreateLeaderboard = ({
	onCreated,
}: {
	onCreated?: (leaderboardId: string, leaderboards: Record<string, Leaderboard>) => void;
}) => {
	const inputRef = useRef<HTMLInputElement>(null);
	const token = useTournamentStore(s => s.token);
	const [loading, setLoading] = useState(false);

	const [open, setOpen] = useState(false);

	const { gcc } = useCompetition();
	useEffect(() => {
		if (open) inputRef.current?.focus();
	}, [open]);

	const handleCreate = async () => {
		if (inputRef.current && token && !loading) {
			setLoading(true);
			const name = inputRef.current.value;
			if (name) {
				const result = await createLeaderboard(name, token);
				if (result.success) {
					const { data: updatedLeaderboards } = await fetchLeaderboards(token);
					const lbMap = (updatedLeaderboards ?? []).reduce(
						(acc: Record<string, Leaderboard>, lb: Leaderboard) => ({ ...acc, [lb.id]: lb }),
						{}
					);
					onCreated?.(result.uid, lbMap);
				}
			}
			setLoading(false);
			setOpen(false);
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
						className='w-48 animate-fade-slide-up bg-white px-3 py-2 text-black focus:outline-none'
						ref={inputRef}
						onKeyDown={e => {
							if (e.key === 'Enter') handleCreate();
						}}
						onClick={e => e.stopPropagation()}
					/>
					<div
						className={classNames(
							gcc('bg-blue'),
							'flex h-10 w-20 animate-fade-slide-up cursor-pointer items-center justify-center rounded-md p-2'
						)}
						style={{ animationDelay: '40ms' }}
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
							'flex size-10 animate-fade-slide-up cursor-pointer items-center justify-center rounded-md p-2 transition-colors hover:bg-gray-700'
						)}
						style={{ animationDelay: '80ms' }}
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
