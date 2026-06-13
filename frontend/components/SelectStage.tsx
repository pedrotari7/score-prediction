import type { Dispatch, SetStateAction } from 'react';
import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { ChevronUpDownIcon } from '@heroicons/react/24/outline';
import { classNames } from '../lib/utils/reactHelper';
import useCompetition from '../hooks/useCompetition';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const SelectStage = ({
	stages,
	setCurrentStage,
	currentStage,
	className,
}: {
	stages: string[];
	currentStage: string;
	setCurrentStage: Dispatch<SetStateAction<string>>;
	className?: string;
}) => {
	const { competition } = useCompetition();

	return (
		<div className='flex flex-row items-center justify-center gap-8'>
			<span className='font-bold text-zinc-400'>Stages</span>
			<Listbox value={currentStage} onChange={setCurrentStage}>
				<div className={classNames('relative', className ?? 'w-48 max-w-full')}>
					<Listbox.Button
						className='relative w-full cursor-pointer rounded py-2 pl-3 pr-10 text-left text-white outline outline-1 outline-white sm:text-sm'
						style={{ backgroundColor: competition.color }}
					>
						<span className='block truncate'>{capitalize(currentStage)}</span>
						<span className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2'>
							<ChevronUpDownIcon className='size-5 text-white' aria-hidden='true' />
						</span>
					</Listbox.Button>
					<Transition
						as={Fragment}
						enter='transition ease-out duration-100'
						enterFrom='opacity-0 scale-95'
						enterTo='opacity-100 scale-100'
						leave='transition ease-in duration-75'
						leaveFrom='opacity-100 scale-100'
						leaveTo='opacity-0 scale-95'
					>
						<Listbox.Options
							className='absolute z-10 mt-1 max-h-60 w-full origin-top overflow-auto rounded py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none'
							style={{ backgroundColor: competition.color }}
						>
							{stages.map(s => (
								<Listbox.Option
									key={s}
									value={s}
									className={({ active }) =>
										classNames(
											'relative cursor-pointer select-none py-2 pl-3 pr-4 text-white transition-colors duration-150',
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
											{capitalize(s)}
										</span>
									)}
								</Listbox.Option>
							))}
						</Listbox.Options>
					</Transition>
				</div>
			</Listbox>
		</div>
	);
};

export default SelectStage;
