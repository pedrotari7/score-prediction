import Image from 'next/image';
import { Fragment, useEffect, useRef, useState } from 'react';
import {
	Dialog,
	DialogBackdrop,
	DialogPanel,
	Menu,
	MenuButton,
	MenuItem,
	MenuItems,
	Transition,
	TransitionChild,
} from '@headlessui/react';
import {
	BookOpenIcon,
	CalendarDaysIcon,
	ChartBarIcon,
	ClipboardDocumentListIcon,
	EllipsisHorizontalIcon,
	EyeIcon,
	EyeSlashIcon,
	FilmIcon,
	HomeIcon,
	TableCellsIcon,
	TrophyIcon,
} from '@heroicons/react/24/outline';
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

const pageIcons: Partial<Record<Route, typeof HomeIcon>> = {
	[Route.Match]: HomeIcon,
	[Route.Predictions]: ClipboardDocumentListIcon,
	[Route.Leaderboard]: TrophyIcon,
	[Route.Standings]: TableCellsIcon,
	[Route.Calendar]: CalendarDaysIcon,
	[Route.Stats]: ChartBarIcon,
	[Route.Recap]: FilmIcon,
	[Route.Rules]: BookOpenIcon,
};

const primaryPages = [Route.Match, Route.Predictions, Route.Leaderboard, Route.Calendar];

export default function Navbar({ loading, setLoading }: { loading: boolean; setLoading: (loading: boolean) => void }) {
	const router = useRouter();
	const { user } = useAuth();
	const [moreOpen, setMoreOpen] = useState(false);

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

	const isCurrent = ({ info: { page } }: NavItem) => {
		if (page === Route.Predictions && route.page === Route.Predictions) return route.data === user?.uid;
		if (page === Route.Match && route.page === Route.Home) return true;
		return page === route.page;
	};

	const primaryNav = primaryPages
		.map(page => navigation.find(item => item.info.page === page))
		.filter((item): item is NavItem => !!item);
	const moreNav = navigation.filter(item => !primaryPages.includes(item.info.page));

	const primaryActiveIndex = primaryNav.findIndex(isCurrent);
	const activeIndex =
		primaryActiveIndex !== -1 ? primaryActiveIndex : moreNav.some(isCurrent) ? primaryNav.length : -1;

	const navItemRefs = useRef<(HTMLButtonElement | null)[]>([]);
	const [indicatorRect, setIndicatorRect] = useState<{ left: number; width: number } | null>(null);

	useEffect(() => {
		const update = () => {
			const el = navItemRefs.current[activeIndex];
			setIndicatorRect(el ? { left: el.offsetLeft, width: el.offsetWidth } : null);
		};
		update();
		window.addEventListener('resize', update);
		return () => window.removeEventListener('resize', update);
	}, [activeIndex, loading]);

	if (!competition) return <></>;

	const updateRoute = (info: RouteInfo) => setRoute(info);

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
		<>
			<nav className='fixed inset-x-0 top-0 z-20 h-16 select-none px-2 pt-2 sm:px-4'>
				<div className='glass-panel mx-auto flex h-12 max-w-7xl items-center justify-between rounded-2xl px-2 shadow-glass sm:px-4'>
					<div className='flex flex-1 items-center gap-1 lg:hidden'>
						{!loading && (
							<span className={classNames(gcc('text-light'), 'ml-1 text-sm font-bold')}>
								{navigation.find(item => isCurrent(item))?.name}
							</span>
						)}
					</div>
					<div className='flex shrink-0 items-center justify-center lg:flex-1 lg:items-stretch lg:justify-start'>
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
					<div className='flex flex-1 items-center justify-end gap-1 sm:gap-2 lg:flex-none'>
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
																onClick={() => updateRoute({ page: Route.Settings })}
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
			</nav>

			{/* Mobile bottom navigation */}
			<nav className='glass-panel fixed inset-x-2 bottom-2 z-20 flex h-14 select-none items-center justify-around rounded-2xl px-3 shadow-glass lg:hidden'>
				{indicatorRect && (
					<div
						className='absolute inset-y-1 rounded-xl shadow-md transition-all duration-300 ease-out'
						style={{ ...activeStyle, left: indicatorRect.left, width: indicatorRect.width }}
						aria-hidden='true'
					/>
				)}
				{!loading &&
					primaryNav.map((item, index) => {
						const Icon = pageIcons[item.info.page] ?? HomeIcon;
						const active = index === activeIndex;
						return (
							<button
								key={item.name}
								ref={el => {
									navItemRefs.current[index] = el;
								}}
								onClick={() => updateRoute(item.info)}
								className={classNames(
									'relative z-10 mx-1 flex flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[11px] font-semibold transition-colors duration-200',
									active
										? 'text-white'
										: `text-gray-200 hover:bg-white/10 hover:text-white ${gcc('hover:text-light')}`
								)}
								aria-current={active ? 'page' : undefined}
							>
								<Icon className='size-6' aria-hidden='true' />
								{item.name}
							</button>
						);
					})}
				{!loading && (
					<button
						ref={el => {
							navItemRefs.current[primaryNav.length] = el;
						}}
						onClick={() => setMoreOpen(true)}
						className={classNames(
							'relative z-10 mx-1 flex flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[11px] font-semibold transition-colors duration-200',
							activeIndex === primaryNav.length
								? 'text-white'
								: `text-gray-200 hover:bg-white/10 hover:text-white ${gcc('hover:text-light')}`
						)}
					>
						<EllipsisHorizontalIcon className='size-6' aria-hidden='true' />
						More
					</button>
				)}
			</nav>

			<Transition show={moreOpen} as={Fragment}>
				<Dialog onClose={() => setMoreOpen(false)} className='relative z-30 lg:hidden'>
					<TransitionChild
						as={Fragment}
						enter='transition-opacity ease-out duration-200'
						enterFrom='opacity-0'
						enterTo='opacity-100'
						leave='transition-opacity ease-in duration-150'
						leaveFrom='opacity-100'
						leaveTo='opacity-0'
					>
						<DialogBackdrop className='fixed inset-0 bg-black/40' />
					</TransitionChild>

					<TransitionChild
						as={Fragment}
						enter='transition ease-out duration-200'
						enterFrom='opacity-0 translate-y-4'
						enterTo='opacity-100 translate-y-0'
						leave='transition ease-in duration-150'
						leaveFrom='opacity-100 translate-y-0'
						leaveTo='opacity-0 translate-y-4'
					>
						<DialogPanel
							className={classNames(
								gcc('text-light'),
								'glass-panel fixed inset-x-2 bottom-20 max-h-[60vh] overflow-y-auto rounded-2xl bg-[#181a1b]/90 p-2 shadow-glass'
							)}
						>
							<div className='grid grid-cols-3 gap-2 p-1'>
								{moreNav.map(item => {
									const Icon = pageIcons[item.info.page] ?? EllipsisHorizontalIcon;
									const active = isCurrent(item);
									return (
										<button
											key={item.name}
											onClick={() => {
												updateRoute(item.info);
												setMoreOpen(false);
											}}
											style={active ? activeStyle : undefined}
											className={classNames(
												'flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-xs font-semibold transition-all duration-200',
												active
													? 'text-white shadow-md'
													: `text-gray-300 hover:bg-white/10 ${gcc('hover:text-light')}`
											)}
											aria-current={active ? 'page' : undefined}
										>
											<Icon className='size-6' aria-hidden='true' />
											{item.name}
										</button>
									);
								})}
								{concurrentCompetition ? (
									<button
										onClick={() => {
											setMoreOpen(false);
											setLoading(true);
											router.push(`/${concurrentCompetition?.name}`);
										}}
										className={classNames(
											'flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-xs font-semibold',
											`text-gray-300 hover:bg-white/10 ${gcc('hover:text-light')}`
										)}
									>
										<Image
											src={concurrentCompetition.logo}
											width={40}
											height={24}
											alt=''
											className='h-6 w-auto'
										/>
										{concurrentCompetition.name}
									</button>
								) : null}
							</div>
						</DialogPanel>
					</TransitionChild>
				</Dialog>
			</Transition>
		</>
	);
}
