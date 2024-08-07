import { Disclosure, DisclosureButton, DisclosurePanel, Transition } from '@headlessui/react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { useRef } from 'react';
import { classNames } from '../lib/utils/reactHelper';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import useCompetition from '../hooks/useCompetition';

const ShowMore = ({
	children,
	className,
	more,
	setIsOpen,
}: {
	children: ReactNode;
	className: string;
	more: ReactNode;
	setIsOpen: Dispatch<SetStateAction<boolean>>;
}) => {
	const disclosureRef = useRef<HTMLDivElement>(null);

	const executeScroll = (open: boolean) => {
		disclosureRef.current?.scrollIntoView({ block: 'start', inline: 'nearest' });
		setIsOpen(!open);
	};

	const { gcc } = useCompetition();

	return (
		<div ref={disclosureRef}>
			<Disclosure as='div' className={classNames(className)}>
				{({ open }) => (
					<div>
						{children}

						<Transition
							enter='transition duration-100 ease-out'
							enterFrom='transform scale-95 opacity-0'
							enterTo='transform scale-100 opacity-100'
							leave='transition duration-75 ease-out'
							leaveFrom='transform scale-100 opacity-100'
							leaveTo='transform scale-95 opacity-0'
						>
							<DisclosurePanel>{open ? <div>{more}</div> : null}</DisclosurePanel>
						</Transition>
						{more && (
							<div onClick={() => executeScroll(open)} className='mt-4 flex justify-center'>
								<DisclosureButton
									className={classNames(
										gcc('hover:bg-blue'),
										'flex w-full justify-center rounded-md p-2 focus:outline-none'
									)}
								>
									{!open && (
										<div className='flex flex-col items-center opacity-60'>
											<span>Show Game Extra Info</span>
											<ChevronDownIcon className='block size-8' aria-hidden='true' />
										</div>
									)}
									{open && (
										<div className='flex flex-col items-center opacity-60'>
											<ChevronUpIcon className='block size-8' aria-hidden='true' />
											<span>Hide Game Extra Info</span>
										</div>
									)}
								</DisclosureButton>
							</div>
						)}
					</div>
				)}
			</Disclosure>
		</div>
	);
};

export default ShowMore;
