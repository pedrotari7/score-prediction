import { Disclosure, Transition } from '@headlessui/react';
import { Dispatch, ReactNode, SetStateAction, useRef } from 'react';
import { classNames } from '../lib/utils/reactHelper';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/outline';

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
								<Disclosure.Button className="focus:outline-none p-2 flex justify-center w-full rounded-md hover:bg-blue">
									{!open && <ChevronDownIcon className="block h-8 w-8" aria-hidden="true" />}
									{open && <ChevronUpIcon className="block h-8 w-8" aria-hidden="true" />}
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
