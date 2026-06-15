import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import type { Fixture, Fixtures } from '../../interfaces/main';
import { isGameFinished, isNum } from '../../shared/utils';
import useCompetition from '../hooks/useCompetition';
import useMediaQuery from '../hooks/useMediaQuery';
import useNoSpoilers from '../hooks/useNoSpoilers';
import { classNames, formatScore, GROUP_COLORS } from '../lib/utils/reactHelper';
import { Route, useTournamentStore } from '../store/tournamentStore';
import Flag from './Flag';
import Panel from './Panel';
import { getPredictionResult } from './ResultContainer';

// indexed by Date#getDay() (Sunday = 0)
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const HOUR_HEIGHT = 48; // px
const DAY_HEIGHT = HOUR_HEIGHT * 24;
const GAME_DURATION_MINUTES = 2 * 60;
// extra space at the bottom to fit the 24:00 label and games starting late that run past midnight
const BOTTOM_BUFFER = (GAME_DURATION_MINUTES / 60) * HOUR_HEIGHT + 16;

const startOfWeek = (date: Date) => {
	const d = new Date(date);
	const weekday = (d.getDay() + 6) % 7; // Monday = 0
	d.setDate(d.getDate() - weekday);
	d.setHours(0, 0, 0, 0);
	return d;
};

const addDays = (date: Date, days: number) => {
	const d = new Date(date);
	d.setDate(d.getDate() + days);
	return d;
};

const dateKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

const formatDateParam = (date: Date) =>
	`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const parseDateParam = (value: string) => {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
	if (!match) return null;
	const [, year, month, day] = match;
	const date = new Date(Number(year), Number(month) - 1, Number(day));
	return Number.isNaN(date.getTime()) ? null : date;
};

const formatTime = (isoStr: string) =>
	new Date(isoStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

type PositionedGame = {
	game: Fixture;
	top: number;
	height: number;
	left: number;
	width: number;
};

const layoutDayGames = (games: Fixture[]): PositionedGame[] => {
	const items = games
		.map(game => {
			const date = new Date(game.fixture.date);
			const start = date.getHours() * 60 + date.getMinutes();
			return { game, start, end: start + GAME_DURATION_MINUTES };
		})
		.sort((a, b) => a.start - b.start);

	const result: PositionedGame[] = [];

	// Split games into clusters of mutually overlapping games, then lay out each
	// cluster independently so non-overlapping games can take up the full width.
	let cluster: typeof items = [];
	let clusterEnd = -Infinity;

	const flushCluster = () => {
		if (cluster.length === 0) return;

		const columnEnds: number[] = [];

		const withColumns = cluster.map(item => {
			let column = columnEnds.findIndex(end => end <= item.start);
			if (column === -1) {
				column = columnEnds.length;
				columnEnds.push(item.end);
			} else {
				columnEnds[column] = item.end;
			}
			return { ...item, column };
		});

		const totalColumns = columnEnds.length;

		withColumns.forEach(({ game, start, column }) => {
			result.push({
				game,
				top: (start / 60) * HOUR_HEIGHT,
				height: (GAME_DURATION_MINUTES / 60) * HOUR_HEIGHT,
				left: (column / totalColumns) * 100,
				width: (1 / totalColumns) * 100,
			});
		});

		cluster = [];
	};

	items.forEach(item => {
		if (cluster.length === 0 || item.start < clusterEnd) {
			cluster.push(item);
			clusterEnd = Math.max(clusterEnd, item.end);
		} else {
			flushCluster();
			cluster.push(item);
			clusterEnd = item.end;
		}
	});

	flushCluster();

	return result;
};

const CalendarPage = ({ fixtures }: { fixtures: Fixtures }) => {
	const { gcc, competition } = useCompetition();
	const { noSpoilers, RedactedSpoilers } = useNoSpoilers();
	const setRoute = useTournamentStore(s => s.setRoute);
	const predictions = useTournamentStore(s => s.predictions);
	const uid = useTournamentStore(s => s.uid);
	const groupMap = useTournamentStore(s => s.groupMap);

	const router = useRouter();
	const hasSyncedFromUrl = useRef(false);

	const isDayView = useMediaQuery('(max-width: 1279px)');

	const fixtureList = useMemo(() => Object.values(fixtures), [fixtures]);

	const [currentDate, setCurrentDate] = useState(() => {
		const today = new Date();
		const competitionEnd = new Date(competition.end);
		competitionEnd.setHours(23, 59, 59, 999);

		if (today >= new Date(competition.start) && today <= competitionEnd) return today;

		const first = fixtureList.sort((a, b) => a.fixture.timestamp - b.fixture.timestamp)[0];
		return first ? new Date(first.fixture.date) : today;
	});

	const updateUrlDate = (date: Date) => {
		router.replace(
			{ pathname: router.pathname, query: { ...router.query, week: formatDateParam(date) } },
			undefined,
			{ shallow: true }
		);
	};

	useEffect(() => {
		if (hasSyncedFromUrl.current) return;
		hasSyncedFromUrl.current = true;

		const params = new URLSearchParams(window.location.search);
		const parsed = parseDateParam(params.get('week') ?? '');
		if (parsed) setCurrentDate(parsed);
		else updateUrlDate(currentDate);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const fixturesByDay = useMemo(() => {
		const map: Record<string, Fixture[]> = {};

		fixtureList.forEach(game => {
			const key = dateKey(new Date(game.fixture.date));
			(map[key] ??= []).push(game);
		});

		return map;
	}, [fixtureList]);

	const days = useMemo(() => {
		if (isDayView) return [currentDate];
		const start = startOfWeek(currentDate);
		return Array.from({ length: 7 }, (_, i) => addDays(start, i));
	}, [currentDate, isDayView]);

	const now = new Date();
	const today = dateKey(now);
	const nowOffset = ((now.getHours() * 60 + now.getMinutes()) / 60) * HOUR_HEIGHT;

	const goToAdjacent = useCallback(
		(delta: number) => {
			const next = addDays(currentDate, isDayView ? delta : delta * 7);
			setCurrentDate(next);
			updateUrlDate(next);
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[currentDate, isDayView]
	);
	const goToToday = () => {
		const next = new Date();
		setCurrentDate(next);
		updateUrlDate(next);
	};

	const swipeHandlers = useSwipeable({
		onSwipedLeft: () => goToAdjacent(1),
		onSwipedRight: () => goToAdjacent(-1),
		preventScrollOnSwipe: true,
	});

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
			if (e.key === 'ArrowLeft') goToAdjacent(-1);
			if (e.key === 'ArrowRight') goToAdjacent(1);
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [goToAdjacent]);

	const headerLabel = isDayView
		? currentDate.toLocaleDateString('en-US', {
				weekday: 'short',
				month: 'short',
				day: 'numeric',
				year: 'numeric',
			})
		: `${days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${days[6].toLocaleDateString(
				'en-US',
				{ month: 'short', day: 'numeric', year: 'numeric' }
			)}`;

	return (
		<Panel className={classNames('m-2 flex select-none flex-col p-2 sm:m-8 sm:p-8')}>
			<div className='mb-4 flex flex-row items-center justify-between gap-2 text-base sm:mb-6 sm:text-2xl'>
				<div className='font-bold'>{headerLabel}</div>
				<div className='flex items-center gap-1'>
					<button
						onClick={goToToday}
						className={classNames(
							gcc('hover:bg-blue'),
							'rounded-md px-2 py-1 text-xs font-bold sm:text-sm'
						)}
					>
						Today
					</button>
					<button
						onClick={() => goToAdjacent(-1)}
						className={classNames(gcc('hover:bg-blue'), 'rounded-md px-3 py-1 font-bold')}
						aria-label={isDayView ? 'Previous day' : 'Previous week'}
					>
						‹
					</button>
					<button
						onClick={() => goToAdjacent(1)}
						className={classNames(gcc('hover:bg-blue'), 'rounded-md px-3 py-1 font-bold')}
						aria-label={isDayView ? 'Next day' : 'Next week'}
					>
						›
					</button>
				</div>
			</div>

			<div {...swipeHandlers} className='max-h-[75vh] overflow-auto rounded'>
				<div
					className='grid grid-rows-[auto_1fr]'
					style={{ gridTemplateColumns: `3rem repeat(${days.length}, minmax(4.5rem, 1fr))` }}
				>
					{!isDayView && (
						<>
							<div className={classNames(gcc('bg-dark'), 'sticky left-0 top-0 z-20')} />

							{days.map((day, index) => {
								const isToday = dateKey(day) === today;

								return (
									<div
										key={day.toISOString()}
										className={classNames(
											gcc('bg-dark'),
											'sticky top-0 z-10 flex flex-col items-center gap-1 border-l border-white/10 py-1',
											index === 0 ? 'border-l-0' : ''
										)}
									>
										<span className='text-[10px] font-bold uppercase opacity-70 sm:text-xs'>
											{WEEKDAY_LABELS[day.getDay()]}
										</span>
										<span
											className={classNames(
												'flex size-6 items-center justify-center rounded-full text-sm font-bold sm:size-8 sm:text-lg',
												isToday ? gcc('bg-blue') : ''
											)}
										>
											{day.getDate()}
										</span>
									</div>
								);
							})}
						</>
					)}

					<div
						className={classNames(gcc('bg-dark'), 'sticky left-0 z-10')}
						style={{ height: DAY_HEIGHT + BOTTOM_BUFFER }}
					>
						{Array.from({ length: 25 }, (_, hour) => (
							<span
								key={hour}
								className='absolute right-1 text-right text-[10px] opacity-70'
								style={{ top: hour * HOUR_HEIGHT }}
							>
								{String(hour).padStart(2, '0')}:00
							</span>
						))}
					</div>

					{days.map((day, index) => {
						const isToday = dateKey(day) === today;
						const games = fixturesByDay[dateKey(day)] ?? [];

						return (
							<div
								key={day.toISOString()}
								className={classNames(
									'relative border-l border-white/10',
									index === 0 ? 'border-l-0' : ''
								)}
								style={{
									height: DAY_HEIGHT + BOTTOM_BUFFER,
									backgroundImage:
										'repeating-linear-gradient(to bottom, transparent, transparent 47px, rgba(255,255,255,0.1) 48px)',
								}}
							>
								{isToday && (
									<div
										className='pointer-events-none absolute inset-x-0 z-10 flex items-center'
										style={{ top: nowOffset }}
									>
										<div className='size-2 -translate-x-1/2 rounded-full bg-red-500' />
										<div className='h-px w-full bg-red-500' />
									</div>
								)}

								{layoutDayGames(games).map(({ game, top, height, left, width }, gameIndex) => {
									const prediction = predictions?.[game.fixture.id]?.[uid];
									const isPredictValid = isNum(prediction?.home) && isNum(prediction?.away);

									const { isExactScore, isCorrectResult, isCorrectGoal, isWrong } =
										isPredictValid && prediction
											? getPredictionResult(prediction, game)
											: {
													isExactScore: false,
													isCorrectResult: false,
													isCorrectGoal: false,
													isWrong: false,
												};

									const showResultColor = isGameFinished(game) && !noSpoilers && isPredictValid;

									return (
										<button
											key={game.fixture.id}
											onClick={() => setRoute({ page: Route.Match, data: game.fixture.id })}
											className={classNames(
												showResultColor && isExactScore ? 'bg-green-600' : '',
												showResultColor && isCorrectResult ? 'bg-yellow-600' : '',
												showResultColor && isCorrectGoal ? 'bg-pink-600' : '',
												showResultColor && isWrong ? 'bg-red-600' : '',
												!showResultColor ? gcc('bg-blue') : '',
												!isPredictValid ? 'ring-2 ring-red-600' : '',
												'absolute animate-fade-slide-up overflow-hidden rounded p-1 text-left transition-[filter] hover:z-10 hover:brightness-125'
											)}
											style={{
												top: top + 4,
												height: height - 8,
												left: `calc(${left}% + 4px)`,
												width: `calc(${width}% - 8px)`,
												animationDelay: `${Math.min(gameIndex, 8) * 30}ms`,
											}}
										>
											<div className='flex flex-col gap-0.5 text-[10px] leading-tight sm:text-xs'>
												<div className='flex items-center justify-between gap-1 font-bold'>
													<span className='flex items-center gap-1 truncate'>
														<Flag team={game.teams.home} className='!mx-0' />
														<span className='truncate'>{game.teams.home.name}</span>
													</span>
													{isPredictValid && <span>{prediction?.home}</span>}
												</div>
												<div className='flex items-center justify-between gap-1 font-bold'>
													<span className='flex items-center gap-1 truncate'>
														<Flag team={game.teams.away} className='!mx-0' />
														<span className='truncate'>{game.teams.away.name}</span>
													</span>
													{isPredictValid && <span>{prediction?.away}</span>}
												</div>
											</div>

											{(() => {
												let round = game.league.round;
												let stageBg = '';
												if (round.includes('Group')) {
													const leg = round.split('-').pop();
													const group = groupMap[game.teams.home.id];
													if (group) {
														round = group + leg;
														stageBg = GROUP_COLORS[group];
													}
												}
												return (
													<div
														className={classNames(
															stageBg || gcc('bg-dark'),
															'absolute right-1 top-1 rounded px-1 text-[10px] font-bold sm:text-xs'
														)}
													>
														{round}
													</div>
												);
											})()}

											<div
												className={classNames(
													gcc('bg-dark'),
													'absolute bottom-1 right-1 rounded px-1 text-[10px] font-bold sm:text-xs'
												)}
											>
												{isGameFinished(game) ? (
													<RedactedSpoilers>
														<span>
															{formatScore(game.goals.home)} -{' '}
															{formatScore(game.goals.away)}
														</span>
													</RedactedSpoilers>
												) : (
													<span>{formatTime(game.fixture.date)}</span>
												)}
											</div>
										</button>
									);
								})}
							</div>
						);
					})}
				</div>
			</div>
		</Panel>
	);
};

export default CalendarPage;
