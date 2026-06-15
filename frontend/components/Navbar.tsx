import Image from 'next/image';
import { Fragment } from 'react';
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
import { Bars3Icon, EyeIcon, EyeSlashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { classNames } from '../lib/utils/reactHelper';
import { getAuth } from 'firebase/auth';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth';
import type { RouteInfo } from '../store/tournamentStore';
import { Route, useTournamentStore } from '../store/tournamentStore';
import { app } from '../lib/firebaseClient';
import { competitions, currentCompetitions, isGameFinished } from '../../shared/utils';
import NoSpoilersToggle from './NoSpoilersToggle';
import useNoSpoilers from '../hooks/useNoSpoilers';
import useCompetition from '../hooks/useCompetition';

interface NavItem {
	name: string;
	info: RouteInfo;
}

export default function Navbar({ loading, setLoading }: { loading: boolean; setLoading: (loading: boolean) => void }) {
	const router = useRouter();
	const { user } = useAuth();

	const { noSpoilers, setNoSpoilers } = useNoSpoilers();
	const { gcc, competition } = useCompetition();
	const fixtures = useTournamentStore(s => s.fixtures);
	const finalGame = Object.values(fixtures).find(f => f.league.round === 'Final');
	const isTournamentFinished = !!finalGame && isGameFinished(finalGame);

	const navigation: NavItem[] = [
		{ name: 'NextGame', info: { page: Route.Match } },
		{ name: 'MyPredictions', info: { page: Route.Predictions, data: user?.uid } },
		{ name: 'Leaderboard', info: { page: Route.Leaderboard } },
		{ name: 'Standings', info: { page: Route.Standings } },
		{ name: 'Calendar', info: { page: Route.Calendar } },
		{ name: 'Stats', info: { page: Route.Stats } },
		{ name: 'Recap', info: { page: Route.Recap } },
		{ name: 'Rules', info: { page: Route.Rules, data: user?.uid } },
	]
		.filter(it => it.info.page !== Route.Recap || isTournamentFinished)
		.filter(it => !noSpoilers || (noSpoilers && it.info.page !== Route.Standings));

	const route = useTournamentStore(s => s.route);
	const setRoute = useTournamentStore(s => s.setRoute);

	if (!competition) return <></>;

	const updateRoute = (info: RouteInfo) => setRoute(info);

	const isCurrent = ({ info: { page } }: NavItem) => {
		return page === Route.Predictions && route.page === Route.Predictions
			? route.data === user?.uid
			: page === route.page;
	};

	const concurrentCompetition = currentCompetitions.find(c => c.name !== competition.name);

	const otherCompetitions = [
		competitions.euro2020,
		competitions.wc2022,
		competitions.euro2024,
		competitions.ca2024,
		competitions.wc2026,
	]
		.map(c => c.name)
		.filter(comp => comp !== competition.name);

	const activeStyle = { background: `linear-gradient(135deg, ${competition.color}, ${competition.color}aa)` };

	return (
		<Disclosure as='nav' className='fixed inset-x-0 top-0 z-20 h-16 select-none px-2 pt-2 sm:px-4'>
			{({ open }) => (
				<>
					<div className='glass-panel mx-auto flex h-12 max-w-7xl items-center justify-between rounded-2xl px-2 shadow-glass sm:px-4'>
						<div className='flex items-center gap-1 lg:hidden'>
							{/* Mobile menu button */}
							{!loading && (
								<DisclosureButton
									className={classNames(
										gcc('text-light'),
										'inline-flex items-center justify-center rounded-xl p-2 transition-colors hover:bg-white/10 focus:outline-none'
									)}
									onFocus={e => {
										if (!open) e.currentTarget.blur();
									}}
								>
									<span className='sr-only'>Open main menu</span>
									{open ? (
										<XMarkIcon className='block size-5' aria-hidden='true' />
									) : (
										<Bars3Icon className='block size-5' aria-hidden='true' />
									)}
								</DisclosureButton>
							)}
							{!open && !loading && (
								<span className={classNames(gcc('text-light'), 'ml-1 text-sm font-bold')}>
									{navigation.find(item => isCurrent(item))?.name}
								</span>
							)}
						</div>
						<div className='flex flex-1 items-center justify-center lg:items-stretch lg:justify-start'>
							<div
								className='flex shrink-0 cursor-pointer items-center transition-transform hover:scale-105'
								onClick={() => updateRoute({ page: Route.Home })}
							>
								<Image
									src={competition.logo}
									width={80}
									height={32}
									alt='logo'
									className='block h-8 w-auto'
								/>
							</div>
							<div className='hidden lg:ml-6 lg:block'>
								<div className='flex items-center space-x-1'>
									{!loading &&
										navigation.map((item, index) => (
											<button
												key={index}
												onClick={() => updateRoute(item.info)}
												style={isCurrent(item) ? activeStyle : undefined}
												className={classNames(
													'text-sm font-semibold transition-all duration-200',
													isCurrent(item)
														? 'text-white shadow-md'
														: `text-gray-300 hover:bg-white/10 ${gcc('hover:text-light')}`,
													'cursor-pointer select-none rounded-full px-4 py-2'
												)}
												aria-current={isCurrent(item) ? 'page' : undefined}
											>
												{item.name}
											</button>
										))}
									{concurrentCompetition && !loading ? (
										<button
											onClick={() => {
												setLoading(true);
												router.push(`/${concurrentCompetition?.name}`);
											}}
											className={classNames(
												'text-sm font-semibold transition-colors hover:bg-white/10',
												`text-gray-300 ${gcc('hover:text-light')}`,
												'cursor-pointer select-none rounded-full px-4 py-2'
											)}
										>
											{concurrentCompetition.name}
										</button>
									) : null}
								</div>
							</div>
						</div>
						<div className='flex items-center gap-1 sm:gap-2'>
							{noSpoilers !== null && user && (
								<button
									onClick={() => setNoSpoilers(!noSpoilers)}
									title={noSpoilers ? 'Show results' : 'Hide results'}
									className={classNames(
										gcc('text-light'),
										'rounded-xl p-2 transition-colors hover:bg-white/10'
									)}
								>
									{noSpoilers ? (
										<EyeSlashIcon className='size-5' aria-hidden='true' />
									) : (
										<EyeIcon className='size-5' aria-hidden='true' />
									)}
								</button>
							)}
							{/* Profile dropdown */}
							<Menu as='div' className='relative'>
								{({ open, close }) => (
									<div className='flex flex-row gap-2'>
										<div className='flex items-center justify-center'>
											{user && (
												<MenuButton
													className={classNames(
														'flex items-center rounded-full text-sm',
														'focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-transparent'
													)}
												>
													<span className='sr-only'>Open user menu</span>
													<Image
														className='size-9 rounded-full border-2 border-white/10 bg-[#181a1b] transition-colors hover:border-white/40'
														src={user?.photoURL || '/default-avatar.png'}
														alt={user?.displayName || ''}
														width={36}
														height={36}
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
													gcc('text-light'),
													'glass-panel absolute right-0 mt-2 w-48 origin-top-right rounded-2xl bg-[#181a1b]/80 py-1 shadow-glass focus:outline-none'
												)}
											>
												{noSpoilers !== null && <NoSpoilersToggle />}
												{user?.admin && (
													<>
														<MenuItem>
															{({ focus }) => (
																<div
																	onClick={() => updateRoute({ page: Route.Users })}
																	className={classNames(
																		focus ? 'bg-white/10' : '',
																		'block cursor-pointer px-4 py-2 text-sm'
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
																		focus ? 'bg-white/10' : '',
																		'block cursor-pointer px-4 py-2 text-sm'
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
																		focus ? 'bg-white/10' : '',
																		'block cursor-pointer px-4 py-2 text-sm'
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
																	close();
																	setLoading(true);
																	router.push(`/${comp}`);
																}}
																className={classNames(
																	focus ? 'bg-white/10' : '',
																	'block px-4 py-2 text-sm'
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
																focus ? 'bg-white/10' : '',
																'block px-4 py-2 text-sm'
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

					<Transition
						show={open}
						enter='transition ease-out duration-200'
						enterFrom='opacity-0 -translate-y-2'
						enterTo='opacity-100 translate-y-0'
						leave='transition ease-in duration-100'
						leaveFrom='opacity-100 translate-y-0'
						leaveTo='opacity-0 -translate-y-2'
					>
						<DisclosurePanel
							static
							className={classNames(
								gcc('text-light'),
								'glass-panel mx-auto mt-2 max-w-7xl rounded-2xl shadow-glass lg:hidden'
							)}
						>
							<div className='flex flex-col gap-1 p-2'>
								{!loading &&
									navigation.map((item, index) => (
										<DisclosureButton
											key={item.name}
											as='button'
											onClick={() => {
												updateRoute(item.info);
												open = false;
											}}
											style={{
												animationDelay: `${index * 30}ms`,
												...(isCurrent(item) ? activeStyle : {}),
											}}
											className={classNames(
												'w-full animate-fade-slide-up text-left text-sm font-semibold transition-all duration-200',
												isCurrent(item)
													? 'text-white shadow-md'
													: `text-gray-300 hover:bg-white/10 ${gcc('hover:text-light')}`,
												'block cursor-pointer rounded-xl px-4 py-2.5'
											)}
											aria-current={isCurrent(item) ? 'page' : undefined}
										>
											{item.name}
										</DisclosureButton>
									))}
								{concurrentCompetition && !loading ? (
									<button
										onClick={() => {
											setLoading(true);
											router.push(`/${concurrentCompetition?.name}`);
										}}
										className={classNames(
											'text-sm font-semibold',
											`text-gray-300 hover:bg-white/10 ${gcc('hover:text-light')}`,
											'flex cursor-pointer items-center justify-start gap-2 rounded-xl p-4'
										)}
									>
										<Image
											src={concurrentCompetition.logo}
											width={80}
											height={40}
											alt=''
											className='h-10 w-auto'
										/>
									</button>
								) : null}
							</div>
						</DisclosurePanel>
					</Transition>
				</>
			)}
		</Disclosure>
	);
}
