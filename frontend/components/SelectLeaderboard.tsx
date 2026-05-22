import type { Dispatch, SetStateAction } from 'react';
import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { ChevronUpDownIcon } from '@heroicons/react/24/outline';
import type { Leaderboard, Users } from '../../interfaces/main';
import { classNames } from '../lib/utils/reactHelper';
import useCompetition from '../hooks/useCompetition';

const SelectLeaderboard = ({
	users,
	leaderboards,
	setMembers,
	currentLeaderboard,
	setCurrentLeaderboard,
	className,
}: {
	users: Users;
	leaderboards: Record<string, Leaderboard>;
	setMembers: Dispatch<SetStateAction<string[]>>;
	currentLeaderboard: string;
	setCurrentLeaderboard: Dispatch<SetStateAction<string>>;
	className?: string;
}) => {
	const allLeaderboards: Record<string, Leaderboard> = {
		global: { id: 'global', name: 'Global', members: Object.keys(users), creator: 'global' },
		...leaderboards,
	};

	const { competition } = useCompetition();
	const selected = allLeaderboards[currentLeaderboard];

	return (
		<Listbox
			value={currentLeaderboard}
			onChange={value => {
				setCurrentLeaderboard(value);
				setMembers(allLeaderboards[value]?.members ?? []);
			}}
		>
			<div className={classNames('relative', className ?? 'w-96 max-w-full')}>
				<Listbox.Button
					className='relative w-full cursor-pointer rounded py-2 pl-3 pr-10 text-left text-white outline outline-1 outline-white sm:text-sm'
					style={{ backgroundColor: competition.color }}
				>
					<span className='block truncate'>{selected?.name}</span>
					<span className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2'>
						<ChevronUpDownIcon className='size-5 text-white' aria-hidden='true' />
					</span>
				</Listbox.Button>
				<Transition
					as={Fragment}
					leave='transition ease-in duration-100'
					leaveFrom='opacity-100'
					leaveTo='opacity-0'
				>
					<Listbox.Options
						className='absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none'
						style={{ backgroundColor: competition.color }}
					>
						{Object.values(allLeaderboards).map(l => (
							<Listbox.Option
								key={l.id}
								value={l.id}
								className={({ active }) =>
									classNames(
										'relative cursor-pointer select-none py-2 pl-3 pr-4 text-white',
										active ? 'bg-[#2b2d2e]' : ''
									)
								}
							>
								{({ selected }) => (
									<span
										className={classNames(
											'block truncate',
											selected ? 'font-semibold' : 'font-normal'
										)}
									>
										{l.name}
									</span>
								)}
							</Listbox.Option>
						))}
					</Listbox.Options>
				</Transition>
			</div>
		</Listbox>
	);
};

export default SelectLeaderboard;
