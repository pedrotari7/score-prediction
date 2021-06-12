import { Disclosure, Transition } from '@headlessui/react';
import { ReactChild } from 'react';
import { classNames } from '../lib/utils/reactHelper';
import { DotsHorizontalIcon, ChevronUpIcon } from '@heroicons/react/outline';

const ShowMore = ({ children, className, more }: { children: ReactChild; className: string; more: JSX.Element }) => {
	return (
		<Disclosure as="div" className={classNames(className)}>
			{({ open }) => (
				<>
					{children}

					<Disclosure.Button className="focus:outline-none flex justify-center mt-4">
						{!open && <DotsHorizontalIcon className="block h-6 w-6" aria-hidden="true" />}
						{open && <ChevronUpIcon className="block h-6 w-6" aria-hidden="true" />}
					</Disclosure.Button>
					<Transition
						enter="transition duration-100 ease-out"
						enterFrom="transform scale-95 opacity-0"
						enterTo="transform scale-100 opacity-100"
						leave="transition duration-75 ease-out"
						leaveFrom="transform scale-100 opacity-100"
						leaveTo="transform scale-95 opacity-0">
						{open && <div>{more}</div>}
					</Transition>
				</>
			)}
		</Disclosure>
	);
};

export default ShowMore;
