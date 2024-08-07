import type { Dispatch, SetStateAction } from 'react';
import { Fragment, useContext } from 'react';
import {
	Disclosure,
	DisclosureButton,
	DisclosurePanel,
	Menu,
	MenuButton,
	MenuItem,
	MenuItems,
	Transition,
} from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { classNames } from '../lib/utils/reactHelper';
import { getAuth } from 'firebase/auth';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth';
import type { RouteInfo } from '../context/RouteContext';
import RouteContext, { Route } from '../context/RouteContext';
import { app } from '../lib/firebaseClient';
import { competitions, currentCompetitions } from '../../shared/utils';
import NoSpoilersToggle from './NoSpoilersToggle';
import useNoSpoilers from '../hooks/useNoSpoilers';
import useCompetition from '../hooks/useCompetition';

interface NavItem {
	name: string;
	info: RouteInfo;
}

export default function Navbar({
	loading,
	setLoading,
}: {
	loading: boolean;
	setLoading: Dispatch<SetStateAction<boolean>>;
}) {
	const router = useRouter();
	const { user } = useAuth();

	const { noSpoilers } = useNoSpoilers();
	const { gcc, competition } = useCompetition();

	const navigation: NavItem[] = [
		{ name: 'NextGame', info: { page: Route.Match } },
		{ name: 'MyPredictions', info: { page: Route.Predictions, data: user?.uid } },
		{ name: 'Leaderboard', info: { page: Route.Leaderboard } },
		{ name: 'Standings', info: { page: Route.Standings } },
		{ name: 'Stats', info: { page: Route.Stats } },
		{ name: 'Rules', info: { page: Route.Rules, data: user?.uid } },
	].filter(it => !noSpoilers || (noSpoilers && it.info.page !== Route.Standings));

	const routeInfo = useContext(RouteContext);

	if (!routeInfo || !competition) return <></>;

	const { route, setRoute } = routeInfo;

	const updateRoute = (info: RouteInfo) => setRoute(info);

	const isCurrent = ({ info: { page } }: NavItem) => {
		return page === Route.Predictions && route.page === Route.Predictions
			? route.data === user?.uid
			: page === route.page;
	};

	const concurrentCompetition = currentCompetitions.find(c => c.name !== competition.name);

	const otherCompetitions = [competitions.euro2020, competitions.wc2022, competitions.euro2024, competitions.ca2024]
		.map(c => c.name)
		.filter(comp => comp !== competition.name);

	return (
		<Disclosure as='nav' className={classNames(gcc('bg-blue'), 'fixed top-0 z-20 h-16 w-full select-none')}>
			{({ open }) => (
				<>
					<div className='mx-auto max-w-7xl px-2 sm:px-6 lg:px-8'>
						<div className='relative flex h-16 items-center justify-between'>
							<div className='absolute inset-y-0 left-0 flex items-center sm:hidden'>
								{/* Mobile menu button */}
								{!loading && (
									<DisclosureButton
										className={classNames(
											gcc('text-light'),
											'inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white'
										)}
									>
										<span className='sr-only'>Open main menu</span>
										{open ? (
											<XMarkIcon className='block size-6' aria-hidden='true' />
										) : (
											<Bars3Icon className='block size-6' aria-hidden='true' />
										)}
									</DisclosureButton>
								)}
							</div>
							<div className='flex flex-1 items-center justify-center sm:items-stretch sm:justify-start'>
								<div
									className='flex shrink-0 cursor-pointer items-center'
									onClick={() => updateRoute({ page: Route.Home })}
								>
									<img className='block h-8 w-auto' src={competition.logo} alt='logo' />
								</div>
								<div className='hidden sm:ml-6 sm:block'>
									<div className='flex space-x-4'>
										{!loading &&
											navigation.map((item, index) => (
												<div
													key={index}
													onClick={() => updateRoute(item.info)}
													className={classNames(
														'text-lg font-bold hover:bg-gray-700',
														isCurrent(item)
															? `${gcc('bg-dark')} ${gcc('text-light')}`
															: `text-gray-300 ${gcc('hover:text-light')}`,
														'cursor-pointer select-none rounded-md px-3 py-2'
													)}
													aria-current={isCurrent(item) ? 'page' : undefined}
												>
													{item.name}
												</div>
											))}
										{concurrentCompetition && !loading ? (
											<div
												onClick={() => {
													setLoading(true);
													router.push(`/${concurrentCompetition?.name}`);
												}}
												className={classNames(
													'text-lg font-bold hover:bg-gray-700',
													`text-gray-300 ${gcc('hover:text-light')}`,
													'cursor-pointer select-none rounded-md px-3 py-2'
												)}
											>
												{concurrentCompetition.name}
											</div>
										) : null}
									</div>
								</div>
							</div>
							<div className='absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:pr-0'>
								{/* Profile dropdown */}
								<Menu as='div' className='relative'>
									{({ open }) => (
										<div className='flex flex-row gap-2'>
											<div className='flex items-center justify-center'>
												{user && (
													<MenuButton
														className={classNames(
															'flex items-center rounded-full bg-gray-800 text-sm',
															'focus:outline-none focus:ring-2 focus:ring-transparent focus:ring-offset-2 focus:ring-offset-gray-800'
														)}
													>
														<span className='sr-only'>Open user menu</span>
														<img
															className='size-10 rounded-full border-4 border-transparent bg-[#181a1b] hover:border-white'
															src={user?.photoURL || ''}
															alt=''
														/>
													</MenuButton>
												)}
											</div>
											<Transition
												show={open}
												as={Fragment}
												enter='transition ease-out duration-100'
												enterFrom='transform opacity-0 scale-95'
												enterTo='transform opacity-100 scale-100'
												leave='transition ease-in duration-75'
												leaveFrom='transform opacity-100 scale-100'
												leaveTo='transform opacity-0 scale-95'
											>
												<MenuItems
													static
													className={classNames(
														gcc('bg-light'),
														'absolute right-0 mt-2 w-48 origin-top-right rounded-md py-1 shadow-lg ring-1 ring-black/5 focus:outline-none'
													)}
												>
													{noSpoilers !== null && <NoSpoilersToggle />}
													{user?.admin && (
														<>
															<MenuItem>
																{({ focus }) => (
																	<div
																		onClick={() =>
																			updateRoute({ page: Route.Users })
																		}
																		className={classNames(
																			focus ? 'bg-gray-100' : '',
																			'block cursor-pointer px-4 py-2 text-sm text-gray-700'
																		)}
																	>
																		Users
																	</div>
																)}
															</MenuItem>
															<MenuItem>
																{({ focus }) => (
																	<div
																		onClick={() =>
																			updateRoute({
																				page: Route.ListLeaderboards,
																			})
																		}
																		className={classNames(
																			focus ? 'bg-gray-100' : '',
																			'block cursor-pointer px-4 py-2 text-sm text-gray-700'
																		)}
																	>
																		Leaderboards
																	</div>
																)}
															</MenuItem>
															<MenuItem>
																{({ focus }) => (
																	<div
																		onClick={() =>
																			updateRoute({ page: Route.Settings })
																		}
																		className={classNames(
																			focus ? 'bg-gray-100' : '',
																			'block cursor-pointer px-4 py-2 text-sm text-gray-700'
																		)}
																	>
																		Settings
																	</div>
																)}
															</MenuItem>
														</>
													)}

													{otherCompetitions.map(comp => (
														<MenuItem key={comp}>
															{({ focus }) => (
																<a
																	href=''
																	onClick={e => {
																		e.preventDefault();
																		setLoading(true);
																		router.push(`/${comp}`);
																	}}
																	className={classNames(
																		focus ? 'bg-gray-100' : '',
																		'block px-4 py-2 text-sm text-gray-700'
																	)}
																>
																	{comp.toUpperCase()}
																</a>
															)}
														</MenuItem>
													))}

													<MenuItem>
														{({ focus }) => (
															<a
																href=''
																onClick={async e => {
																	e.preventDefault();
																	await getAuth(app).signOut();
																}}
																className={classNames(
																	focus ? 'bg-gray-100' : '',
																	'block px-4 py-2 text-sm text-gray-700'
																)}
															>
																Sign out
															</a>
														)}
													</MenuItem>
												</MenuItems>
											</Transition>
										</div>
									)}
								</Menu>
							</div>
						</div>
					</div>

					<DisclosurePanel className={classNames(gcc('bg-blue'), 'sm:hidden')}>
						<div className='flex flex-col space-y-1 px-2 pb-3 pt-2'>
							{!loading &&
								navigation.map(item => (
									<DisclosureButton key={item.name}>
										<div
											onClick={() => {
												updateRoute(item.info);
												open = false;
											}}
											className={classNames(
												'text-lg font-bold',
												isCurrent(item)
													? `${gcc('bg-dark')} ${gcc('text-light')}`
													: `text-gray-300 hover:bg-gray-700 ${gcc('hover:text-light')}`,
												'block cursor-pointer rounded-md px-3 py-2'
											)}
											aria-current={isCurrent(item) ? 'page' : undefined}
										>
											{item.name}
										</div>
									</DisclosureButton>
								))}
							{concurrentCompetition && !loading ? (
								<div
									onClick={() => {
										setLoading(true);
										router.push(`/${concurrentCompetition?.name}`);
									}}
									className={classNames(
										'text-lg font-bold',
										`text-gray-300 hover:bg-gray-700 ${gcc('hover:text-light')}`,
										'flex cursor-pointer items-center justify-start gap-2 rounded-md px-3 py-8'
									)}
								>
									<img className='h-10' src={concurrentCompetition.logo} alt='' />
								</div>
							) : null}
						</div>
					</DisclosurePanel>
				</>
			)}
		</Disclosure>
	);
}
