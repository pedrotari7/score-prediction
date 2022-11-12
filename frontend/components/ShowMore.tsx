import { Disclosure, Transition } from '@headlessui/react';
import { Dispatch, ReactNode, SetStateAction, useContext, useRef } from 'react';
import { classNames, getCompetitionClass } from '../lib/utils/reactHelper';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import CompetitionContext from '../context/CompetitionContext';

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

	const competition = useContext(CompetitionContext);
	const gcc = (p: string) => getCompetitionClass(p, competition);

	return (
		<div ref={disclosureRef}>
			<Disclosure as="div" className={classNames(className)}>
				{({ open }) => (
					<>
						{children}

						<Transition
							enter="transition duration-100 ease-out"
							enterFrom="transform scale-95 opacity-0"
							enterTo="transform scale-100 opacity-100"
							leave="transition duration-75 ease-out"
							leaveFrom="transform scale-100 opacity-100"
							leaveTo="transform scale-95 opacity-0">
							{open && <div>{more}</div>}
						</Transition>
						{more && (
							<div onClick={() => executeScroll(open)} className="flex justify-center mt-4 ">
								<Disclosure.Button
									className={classNames(
										gcc('hover:bg-blue'),
										'focus:outline-none p-2 flex justify-center w-full rounded-md'
									)}>
									{!open && (
										<div className="flex flex-col items-center opacity-60">
											<span>Show More</span>
											<ChevronDownIcon className="block h-8 w-8" aria-hidden="true" />
										</div>
									)}
									{open && (
										<div className="flex flex-col items-center opacity-60">
											<ChevronUpIcon className="block h-8 w-8" aria-hidden="true" />
											<span>Show Less</span>
										</div>
									)}
								</Disclosure.Button>
							</div>
						)}
					</>
				)}
			</Disclosure>
		</div>
	);
};

export default ShowMore;
