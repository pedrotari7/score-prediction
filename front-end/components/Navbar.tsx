import { Fragment, useContext } from 'react';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { MenuIcon, XIcon } from '@heroicons/react/outline';
import { classNames } from '../lib/utils/reactHelper';
import { firebaseClient } from '../lib/firebaseClient';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth';
import RouteContext, { Route } from '../context/RouteContext';

interface NavItem {
	name: string;
	page: Route;
}

const navigation: NavItem[] = [
	{ name: 'MyPredictions', page: Route.MyPredictions },
	{ name: 'Standings', page: Route.Standings },
	{ name: 'Ranking', page: Route.Ranking },
];

export default function Navbar() {
	const router = useRouter();
	const { user } = useAuth();

	const routeInfo = useContext(RouteContext);

	if (!routeInfo) return <></>;

	const { route, setRoute } = routeInfo;

	const isCurrent = (item: NavItem) => item.page === route;

	return (
		<Disclosure as="nav" className="bg-blue sticky top-0 w-full z-10">
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
							<div className="flex-1 flex items-center justify-center sm:items-stretch sm:justify-start cursor-pointer">
								<div className="flex-shrink-0 flex items-center" onClick={() => setRoute(Route.Home)}>
									<img className="block h-8 w-auto" src="/logo.svg" alt="logo" />
								</div>
								<div className="hidden sm:block sm:ml-6">
									<div className="flex space-x-4">
										{navigation.map(item => (
											<div
												key={item.name}
												onClick={() => setRoute(item.page)}
												className={classNames(
													isCurrent(item)
														? 'bg-dark text-light'
														: 'text-gray-300 hover:bg-gray-700 hover:text-light',
													'px-3 py-2 rounded-md text-sm font-medium cursor-pointer select-none'
												)}
												aria-current={isCurrent(item) ? 'page' : undefined}>
												{item.name}
											</div>
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
																<div
																	onClick={() => setRoute(Route.Settings)}
																	className={classNames(
																		active ? 'bg-gray-100' : '',
																		'cursor-pointer block px-4 py-2 text-sm text-gray-700'
																	)}>
																	Settings
																</div>
															)}
														</Menu.Item>
													)}
													<Menu.Item>
														{({ active }) => (
															<a
																href="#"
																onClick={async () => {
																	await firebaseClient.auth().signOut();
																	router.push('/');
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
						<div className="px-2 pt-2 pb-3 space-y-1 flex flex-col">
							{navigation.map(item => (
								<Disclosure.Button key={item.name}>
									<div
										onClick={() => {
											setRoute(item.page);
											open = false;
										}}
										className={classNames(
											isCurrent(item)
												? 'bg-dark text-light'
												: 'text-gray-300 hover:bg-gray-700 hover:text-light',
											'block px-3 py-2 rounded-md text-base font-medium cursor-pointer'
										)}
										aria-current={isCurrent(item) ? 'page' : undefined}>
										{item.name}
									</div>
								</Disclosure.Button>
							))}
						</div>
					</Disclosure.Panel>
				</>
			)}
		</Disclosure>
	);
}
