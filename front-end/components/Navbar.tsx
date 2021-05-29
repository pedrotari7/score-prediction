import { Fragment } from 'react';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { MenuIcon, XIcon } from '@heroicons/react/outline';
import { classNames } from '../lib/utils/reactHelper';
import { firebaseClient } from '../lib/firebaseClient';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth';

interface NavItem {
	name: string;
	href: string;
}

const navigation: NavItem[] = [
	{ name: 'MyPredictions', href: '/' },
	{ name: 'Fixtures', href: '/fixtures' },
	{ name: 'Standings', href: '/standings' },
];

export default function Navbar() {
	const router = useRouter();
	const { user } = useAuth();

	const isCurrent = (item: NavItem) => item.href === router.asPath;

	return (
		<Disclosure as="nav" className="bg-blue sticky top-0 w-full">
			{({ open }) => (
				<>
					<div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
						<div className="relative flex items-center justify-between h-16">
							<div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
								{/* Mobile menu button*/}
								<Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md text-light hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
									<span className="sr-only">Open main menu</span>
									{open ? (
										<XIcon className="block h-6 w-6" aria-hidden="true" />
									) : (
										<MenuIcon className="block h-6 w-6" aria-hidden="true" />
									)}
								</Disclosure.Button>
							</div>
							<div className="flex-1 flex items-center justify-center sm:items-stretch sm:justify-start">
								<div className="flex-shrink-0 flex items-center">
									<img className="block h-8 w-auto" src="/logo.svg" alt="logo" />
								</div>
								<div className="hidden sm:block sm:ml-6">
									<div className="flex space-x-4">
										{navigation.map(item => (
											<a
												key={item.name}
												href={item.href}
												className={classNames(
													isCurrent(item)
														? 'bg-gray-900 text-light'
														: 'text-gray-300 hover:bg-gray-700 hover:text-light',
													'px-3 py-2 rounded-md text-sm font-medium'
												)}
												aria-current={isCurrent(item) ? 'page' : undefined}>
												{item.name}
											</a>
										))}
									</div>
								</div>
							</div>
							<div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
								{/* Profile dropdown */}
								<Menu as="div" className="ml-3 relative">
									{({ open }) => (
										<>
											<div>
												<Menu.Button className="bg-gray-800 flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
													<span className="sr-only">Open user menu</span>
													<img
														className="h-8 w-8 rounded-full"
														src={user?.photoURL || ''}
														alt=""
													/>
												</Menu.Button>
											</div>
											<Transition
												show={open}
												as={Fragment}
												enter="transition ease-out duration-100"
												enterFrom="transform opacity-0 scale-95"
												enterTo="transform opacity-100 scale-100"
												leave="transition ease-in duration-75"
												leaveFrom="transform opacity-100 scale-100"
												leaveTo="transform opacity-0 scale-95">
												<Menu.Items
													static
													className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-light ring-1 ring-black ring-opacity-5 focus:outline-none">
													{user?.admin && (
														<Menu.Item>
															{({ active }) => (
																<a
																	href="/settings"
																	onClick={async () => {}}
																	className={classNames(
																		active ? 'bg-gray-100' : '',
																		'block px-4 py-2 text-sm text-gray-700'
																	)}>
																	Settings
																</a>
															)}
														</Menu.Item>
													)}
													<Menu.Item>
														{({ active }) => (
															<a
																href="#"
																onClick={async () => {
																	await firebaseClient
																		.auth()
																		.signOut()
																		.then(() => {
																			router.push('/');
																		});
																}}
																className={classNames(
																	active ? 'bg-gray-100' : '',
																	'block px-4 py-2 text-sm text-gray-700'
																)}>
																Sign out
															</a>
														)}
													</Menu.Item>
												</Menu.Items>
											</Transition>
										</>
									)}
								</Menu>
							</div>
						</div>
					</div>

					<Disclosure.Panel className="sm:hidden">
						<div className="px-2 pt-2 pb-3 space-y-1">
							{navigation.map(item => (
								<a
									key={item.name}
									href={item.href}
									className={classNames(
										isCurrent(item)
											? 'bg-gray-900 text-light'
											: 'text-gray-300 hover:bg-gray-700 hover:text-light',
										'block px-3 py-2 rounded-md text-base font-medium'
									)}
									aria-current={isCurrent(item) ? 'page' : undefined}>
									{item.name}
								</a>
							))}
						</div>
					</Disclosure.Panel>
				</>
			)}
		</Disclosure>
	);
}
