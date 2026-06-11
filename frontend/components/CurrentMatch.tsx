import Image from 'next/image';
import type { CSSProperties, Dispatch, ReactNode, SetStateAction } from 'react';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Route, useTournamentStore } from '../store/tournamentStore';
import { useSwipeable } from 'react-swipeable';
import LiveGame from './LiveGame';
import type {
	Fixture,
	Fixtures,
	GameReactions,
	Leaderboard,
	Prediction,
	Predictions,
	UpdatePrediction,
	User,
	Users,
} from '../../interfaces/main';
import { classNames, formatScore, getCurrentDate, getStadiumImageURL } from '../lib/utils/reactHelper';
import ResultContainer from './ResultContainer';
import { ChevronLeftIcon, ChevronRightIcon, FaceSmileIcon } from '@heroicons/react/24/outline';
import {
	DEFAULT_USER_RESULT,
	getEarnedPoints,
	getGameStage,
	getResult,
	getStageBoostInfo,
	isGameFinished,
	isGameOnGoing,
	isGameStarted,
} from '../../shared/utils';
import LoadingSkeleton from './LoadingSkeleton';
import RefreshComp from './RefreshComp';
import PredictionsStats from './PredictionsStats';
import SelectLeaderboard from './SelectLeaderboard';
import useNoSpoilers from '../hooks/useNoSpoilers';
import useCompetition from '../hooks/useCompetition';
import { useInputPrediction, UserInputPrediction } from '../hooks/useInputPrediction';
import Panel from './Panel';
import Flag from './Flag';
import { fetchReactions, updateReaction } from '../pages/api';
import data from '@emoji-mart/data';
import dynamic from 'next/dynamic';

const EmojiPicker = dynamic(() => import('@emoji-mart/react'), { ssr: false });

const REACTION_EMOJIS = ['🔥', '😱', '🤡', '🎯', '💀'] as const;

const ReactionBar = ({
	targetUid,
	myUid,
	gameReactions,
	onReact,
	isMyPrediction,
	users,
	onPanelChange,
}: {
	targetUid: string;
	myUid: string;
	gameReactions: GameReactions;
	onReact: (targetUid: string, emoji: string) => void;
	isMyPrediction: boolean;
	users: Users;
	onPanelChange?: (open: boolean) => void;
}) => {
	const [pickerOpen, setPickerOpen] = useState(false);
	const [longPressInfo, setLongPressInfo] = useState<{ emoji: string; uids: string[] } | null>(null);
	const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const pickerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!pickerOpen) return;
		const handler = (e: MouseEvent) => {
			if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
				setPickerOpen(false);
			}
		};
		document.addEventListener('mousedown', handler);
		return () => document.removeEventListener('mousedown', handler);
	}, [pickerOpen]);

	useEffect(() => {
		onPanelChange?.(!!longPressInfo);
	}, [longPressInfo]); // eslint-disable-line react-hooks/exhaustive-deps

	const counts: Record<string, number> = {};
	const reactors: Record<string, string[]> = {};
	const myReactions = new Set<string>();
	const orderedEmojis: string[] = [];

	for (const [reactorUid, targets] of Object.entries(gameReactions)) {
		const emojis = targets[targetUid] ?? [];
		for (const emoji of emojis) {
			if (!counts[emoji]) orderedEmojis.push(emoji);
			counts[emoji] = (counts[emoji] ?? 0) + 1;
			reactors[emoji] = [...(reactors[emoji] ?? []), reactorUid];
			if (reactorUid === myUid) myReactions.add(emoji);
		}
	}

	const hasReactions = orderedEmojis.length > 0;
	if (isMyPrediction && !hasReactions) return null;

	const startLongPress = (emoji: string) => {
		longPressTimer.current = setTimeout(() => setLongPressInfo({ emoji, uids: reactors[emoji] ?? [] }), 500);
	};

	const cancelLongPress = () => {
		if (longPressTimer.current) {
			clearTimeout(longPressTimer.current);
			longPressTimer.current = null;
		}
	};

	return (
		<>
			<div className='flex flex-wrap items-center gap-1 pt-1' onClick={e => e.stopPropagation()}>
				{orderedEmojis.map(emoji => {
					const count = counts[emoji] ?? 0;
					const isSelected = myReactions.has(emoji);
					return (
						<div key={emoji} className='group relative'>
							<button
								onClick={
									isMyPrediction
										? undefined
										: e => {
												e.stopPropagation();
												onReact(targetUid, emoji);
											}
								}
								onTouchStart={() => startLongPress(emoji)}
								onTouchEnd={cancelLongPress}
								onTouchMove={cancelLongPress}
								className={classNames(
									'flex items-center gap-0.5 rounded-full px-2 py-0.5 text-sm transition-all',
									isSelected ? 'bg-white/25 ring-1 ring-white/40' : 'bg-white/10 hover:bg-white/20',
									isMyPrediction ? 'cursor-default' : 'cursor-pointer'
								)}
							>
								<span>{emoji}</span>
								<span className='text-xs opacity-60'>{count}</span>
							</button>
							<div className='pointer-events-none absolute bottom-full left-0 z-50 mb-1.5 hidden min-w-max rounded-lg bg-gray-900 p-2 shadow-lg group-hover:block'>
								{(reactors[emoji] ?? []).map(reactorUid => {
									const u = users[reactorUid];
									const name = reactorUid === myUid ? 'You' : (u?.displayName ?? reactorUid);
									return (
										<div key={reactorUid} className='flex items-center gap-2 py-0.5'>
											{u?.photoURL ? (
												<Image
													src={u.photoURL}
													width={20}
													height={20}
													alt=''
													className='size-5 rounded-full object-cover'
												/>
											) : (
												<div className='size-5 rounded-full bg-white/20' />
											)}
											<span className='text-xs'>{name}</span>
										</div>
									);
								})}
							</div>
						</div>
					);
				})}

				{!isMyPrediction && (
					<div ref={pickerRef} className='relative'>
						<button
							onClick={e => {
								e.stopPropagation();
								setPickerOpen(p => !p);
							}}
							aria-label='Add reaction'
							className={classNames(
								'flex items-center rounded-full px-1.5 py-0.5 transition-all',
								pickerOpen
									? 'bg-white/20 opacity-100'
									: 'bg-white/5 opacity-50 hover:bg-white/15 hover:opacity-100'
							)}
						>
							<span className='relative inline-flex'>
								<FaceSmileIcon className='size-4' />
								<span className='absolute -right-0.5 -top-1 text-[9px] font-bold leading-none'>+</span>
							</span>
						</button>

						{pickerOpen && (
							<div className='absolute bottom-full left-0 z-50 mb-1 overflow-hidden rounded-xl shadow-xl'>
								<div className='flex gap-0.5 bg-gray-900/95 p-1.5'>
									{REACTION_EMOJIS.map(emoji => (
										<button
											key={emoji}
											onClick={e => {
												e.stopPropagation();
												onReact(targetUid, emoji);
												setPickerOpen(false);
											}}
											className={classNames(
												'rounded-lg p-1.5 text-xl transition-all hover:scale-125 hover:bg-white/10',
												myReactions.has(emoji) ? 'scale-110 bg-white/20' : ''
											)}
										>
											{emoji}
										</button>
									))}
								</div>
								<EmojiPicker
									data={data}
									theme='dark'
									previewPosition='none'
									skinTonePosition='none'
									maxFrequentRows={1}
									perLine={8}
									style={{ '--border-radius': '0px' } as CSSProperties}
									onEmojiSelect={(emoji: { native: string }) => {
										onReact(targetUid, emoji.native);
										setPickerOpen(false);
									}}
								/>
							</div>
						)}
					</div>
				)}
			</div>

			{longPressInfo && (
				<div
					className='fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center'
					onClick={e => {
						e.stopPropagation();
						setLongPressInfo(null);
					}}
				>
					<div
						className='w-full max-w-sm rounded-t-2xl bg-gray-900 p-4 sm:rounded-2xl'
						onClick={e => e.stopPropagation()}
					>
						<div className='mb-3 flex items-center gap-2'>
							<span className='text-2xl'>{longPressInfo.emoji}</span>
							<span className='font-medium opacity-70'>
								{longPressInfo.uids.length} reaction{longPressInfo.uids.length !== 1 ? 's' : ''}
							</span>
						</div>
						{longPressInfo.uids.map(reactorUid => {
							const u = users[reactorUid];
							const name = reactorUid === myUid ? 'You' : (u?.displayName ?? reactorUid);
							return (
								<div key={reactorUid} className='flex items-center gap-3 py-2'>
									{u?.photoURL ? (
										<Image
											src={u.photoURL}
											width={36}
											height={36}
											alt=''
											className='size-9 rounded-full object-cover'
										/>
									) : (
										<div className='size-9 rounded-full bg-white/20' />
									)}
									<span className='text-sm font-medium'>{name}</span>
								</div>
							);
						})}
					</div>
				</div>
			)}
		</>
	);
};

const UserGuess = ({
	gameID,
	user,
	guess,
	game,
	updatePrediction,
	myGuess = false,
	gameReactions,
	onReact,
	users,
	onReactionPanelChange,
}: {
	gameID: number;
	user: User;
	guess: Prediction;
	game: Fixture;
	updatePrediction: UpdatePrediction;
	myGuess?: boolean;
	gameReactions?: GameReactions;
	onReact?: (targetUid: string, emoji: string) => void;
	users?: Users;
	onReactionPanelChange?: (open: boolean) => void;
}) => {
	const setRoute = useTournamentStore(s => s.setRoute);
	const boosts = useTournamentStore(s => s.boosts);
	const doUpdateBoost = useTournamentStore(s => s.updateBoost);
	const uid = useTournamentStore(s => s.uid);
	const fixtures = useTournamentStore(s => s.fixtures);
	const { competition } = useCompetition();

	const myBoosts = boosts?.[uid] ?? [];
	const isBoosted = myBoosts.includes(gameID);
	const stage = getGameStage(game);
	const { max: maxBoosts, remaining: remainingBoosts } = getStageBoostInfo(
		competition,
		stage,
		myBoosts,
		fixtures ?? {}
	);

	const parsedGuess = { home: formatScore(guess.home), away: formatScore(guess.away) };

	const emptyScore = guess.home === undefined || guess.away === undefined;
	const hiddenScore = parsedGuess.home === 'H' && parsedGuess.away === 'H';
	const invalidScore = parsedGuess.home === 'X' && parsedGuess.away === 'X';

	const gameDate = new Date(game?.fixture.date);
	const isInPast = getCurrentDate().getTime() >= gameDate.getTime();

	const { homeInputRef, awayInputRef } = useInputPrediction(gameID, guess);
	const showReactions = isGameFinished(game) && !!gameReactions && !!onReact;

	return (
		<ResultContainer
			prediction={guess}
			game={game}
			userID={user.uid}
			className={
				classNames(
					'my-2 flex w-full rounded p-4 sm:m-2 sm:w-max',
					!isInPast && myGuess
						? 'flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4'
						: classNames('flex-row items-center justify-between gap-4', showReactions ? 'flex-wrap' : ''),
					'cursor-pointer select-none'
				) +
				' ' +
				// eslint-disable-next-line tailwindcss/migration-from-tailwind-2
				classNames('hover:bg-opacity-50')
			}
			onClick={() => setRoute({ page: Route.Predictions, data: user.uid })}
		>
			<div className='flex items-center gap-2'>
				{user?.photoURL && (
					<Image
						className='size-8 rounded-full object-cover'
						src={user.photoURL}
						width={32}
						height={32}
						alt=''
					/>
				)}
				<span className='text-xl'>{user?.displayName}</span>
				<span className='text-sm text-light'>{user?.score?.['all']?.points ?? 0} pts</span>
			</div>

			{invalidScore && !emptyScore && <div className='text-sm font-bold'>Invalid</div>}

			{!hiddenScore && (
				<div className='flex items-center justify-center gap-3 text-xl sm:justify-start'>
					{(isInPast || !myGuess) && !invalidScore && (
						<>
							<div className='flex flex-row items-center justify-end font-bold'>
								<span className='mr-2'>{parsedGuess.home}</span>
							</div>

							<span className=''>-</span>

							<div className='flex flex-row items-center justify-start font-bold'>
								<span className='ml-2'>{parsedGuess.away}</span>
							</div>
						</>
					)}
					{!isInPast && myGuess && (
						<>
							<UserInputPrediction
								gameID={gameID}
								prediction={guess}
								updatePrediction={updatePrediction}
								homeInputRef={homeInputRef}
								awayInputRef={awayInputRef}
							/>
							{maxBoosts > 0 && (
								<button
									onClick={e => {
										e.stopPropagation();
										doUpdateBoost(gameID);
									}}
									disabled={!isBoosted && remainingBoosts <= 0}
									className={classNames(
										'relative flex size-10 items-center justify-center rounded-full text-sm font-black transition-all',
										isBoosted
											? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 ring-2 ring-indigo-400/50'
											: remainingBoosts > 0
												? 'bg-gray-700/80 text-gray-300 ring-1 ring-gray-500/50 hover:bg-indigo-500/30 hover:text-white hover:ring-indigo-400/50'
												: 'cursor-not-allowed bg-gray-800/50 text-gray-600'
									)}
								>
									2x
								</button>
							)}
						</>
					)}
				</div>
			)}
			{showReactions && (
				<div className='w-full leading-none'>
					<ReactionBar
						targetUid={user.uid}
						myUid={uid}
						gameReactions={gameReactions}
						onReact={onReact}
						isMyPrediction={myGuess}
						users={users ?? {}}
						onPanelChange={onReactionPanelChange}
					/>
				</div>
			)}
		</ResultContainer>
	);
};

const KeyboardHandle = memo(function KeyboardHandle({
	prevGameId,
	nextGameId,
	children,
	className,
	setGameID,
	isReactionPanelOpen,
}: {
	prevGameId: number | null;
	nextGameId: number | null;
	children: ReactNode;
	className?: string;
	setGameID: Dispatch<SetStateAction<number>>;
	isReactionPanelOpen: boolean;
}) {
	useEffect(() => {
		const keyDownHandler = (event: KeyboardEvent) => {
			if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
			if (isReactionPanelOpen) return;
			switch (event.code) {
				case 'ArrowLeft':
					if (prevGameId !== null) setGameID(prevGameId);
					break;
				case 'ArrowRight':
					if (nextGameId !== null) setGameID(nextGameId);
					break;
			}
		};
		document.addEventListener('keydown', keyDownHandler);

		return () => document.removeEventListener('keydown', keyDownHandler);
	}, [prevGameId, nextGameId, setGameID, isReactionPanelOpen]);

	return <div className={className}>{children}</div>;
});

const GameStoryStrip = ({
	sortedFixtures,
	currentId,
	onSelect,
	noSpoilers,
}: {
	sortedFixtures: Fixture[];
	currentId: number;
	onSelect: (id: number) => void;
	noSpoilers: boolean | null;
}) => {
	const activeRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
	}, [currentId]);

	return (
		<div
			className='-mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4 py-1.5 pb-2 sm:-mx-8 sm:px-8'
			style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
		>
			{sortedFixtures.map(fixture => {
				const isActive = fixture.fixture.id === currentId;
				const isLive = isGameOnGoing(fixture);
				const isFinished = isGameFinished(fixture);
				const notStarted = !isGameStarted(fixture);

				return (
					<button
						key={fixture.fixture.id}
						ref={isActive ? activeRef : undefined}
						onClick={() => onSelect(fixture.fixture.id)}
						className={classNames(
							'flex shrink-0 flex-col items-center justify-between rounded-xl border-2 px-2 py-1.5 transition-all duration-200 focus:outline-none',
							isActive ? 'scale-105 border-white bg-white/15' : 'border-transparent',
							isLive && !isActive ? 'bg-green-900/40' : '',
							isFinished && !isActive ? 'bg-white/5' : '',
							notStarted && !isActive ? 'opacity-50' : ''
						)}
					>
						<div className='flex items-center'>
							<Flag team={fixture.teams.home} className='scale-75 [&_img]:mx-0.5' />
							{isLive ? (
								<span className='relative mx-1 flex size-1.5 shrink-0'>
									<span className='absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75' />
									<span className='relative inline-flex size-1.5 rounded-full bg-green-500' />
								</span>
							) : (
								<span className='text-[10px] opacity-30'>-</span>
							)}
							<Flag team={fixture.teams.away} className='scale-75 [&_img]:mx-0.5' />
						</div>
						<div className='text-[10px] font-bold tabular-nums leading-none'>
							{isGameStarted(fixture) ? (
								noSpoilers ? (
									<span className='opacity-30'>?-?</span>
								) : (
									<span className={isLive ? 'text-green-400' : 'opacity-70'}>
										{fixture.goals.home}-{fixture.goals.away}
									</span>
								)
							) : (
								<span className='opacity-40'>
									<span>
										{new Date(fixture.fixture.date).toLocaleDateString([], {
											day: 'numeric',
											month: 'short',
										})}
									</span>
									<br />
									<span>
										{new Date(fixture.fixture.date).toLocaleTimeString([], {
											hour: '2-digit',
											minute: '2-digit',
											hour12: false,
										})}
									</span>
								</span>
							)}
						</div>
					</button>
				);
			})}
		</div>
	);
};

const CurrentMatch = ({
	fixtures,
	predictions,
	users,
	gameID,
	leaderboards,
	updatePrediction,
}: {
	fixtures: Fixtures;
	predictions: Predictions;
	users: Users;
	gameID: number;
	leaderboards: Record<string, Leaderboard>;
	updatePrediction: UpdatePrediction;
}) => {
	const uid = useTournamentStore(s => s.uid);
	const token = useTournamentStore(s => s.token);
	const userInfo = { uid, token };

	const odds = useTournamentStore(s => s.odds);
	const boosts = useTournamentStore(s => s.boosts);

	const { gcc, competition } = useCompetition();
	const { noSpoilers } = useNoSpoilers();

	const [id, setGameID] = useState(gameID);
	const [currentLeaderboard, setCurrentLeaderboard] = useState('global');
	const [members, setMembers] = useState<string[]>(Object.keys(users));
	const [gameReactions, setGameReactions] = useState<GameReactions>({});
	const [isReactionPanelOpen, setIsReactionPanelOpen] = useState(false);

	useEffect(() => {
		if (currentLeaderboard === 'global') {
			setMembers(Object.keys(users));
		}
	}, [users, currentLeaderboard]);

	const sortedFixtures = useMemo(
		() => Object.values(fixtures).sort((a, b) => a.fixture.timestamp - b.fixture.timestamp) as Fixture[],
		[fixtures]
	);

	const nextGame = sortedFixtures.findIndex(game => !isGameFinished(game));

	const game = id ? fixtures[id] : sortedFixtures[nextGame === -1 ? sortedFixtures.length - 1 : nextGame];

	const [isExtraInfoOpen, setIsExtraInfoOpen] = useState(false);

	const prevGameId = useMemo(() => {
		if (!game) return null;
		const idx = sortedFixtures.findIndex(g => g.fixture.id === game.fixture.id);
		return sortedFixtures[idx - 1]?.fixture.id ?? null;
	}, [sortedFixtures, game]);

	const nextGameId = useMemo(() => {
		if (!game) return null;
		const idx = sortedFixtures.findIndex(g => g.fixture.id === game.fixture.id);
		return sortedFixtures[idx + 1]?.fixture.id ?? null;
	}, [sortedFixtures, game]);

	const handlers = useSwipeable({
		onSwipedLeft: () => nextGameId !== null && !isExtraInfoOpen && !isReactionPanelOpen && setGameID(nextGameId),
		onSwipedRight: () => prevGameId !== null && !isExtraInfoOpen && !isReactionPanelOpen && setGameID(prevGameId),
		preventScrollOnSwipe: true,
	});

	useEffect(() => {
		if (!game || !isGameFinished(game)) {
			setGameReactions({});
			return;
		}
		fetchReactions(token, game.fixture.id, competition).then(reactions => {
			setGameReactions(reactions);
		});
	}, [game?.fixture.id, game?.fixture.status.short]); // eslint-disable-line react-hooks/exhaustive-deps

	const handleReact = async (targetUid: string, emoji: string) => {
		if (!game) return;
		const gameId = game.fixture.id;
		const prev = gameReactions;
		setGameReactions(curr => {
			const next = { ...curr, [uid]: { ...(curr[uid] ?? {}) } };
			const current = next[uid][targetUid] ?? [];
			const updated = current.includes(emoji) ? current.filter(e => e !== emoji) : [...current, emoji];
			if (updated.length === 0) {
				delete next[uid][targetUid];
			} else {
				next[uid][targetUid] = updated;
			}
			return next;
		});
		try {
			await updateReaction(token, gameId, targetUid, emoji, competition);
		} catch {
			setGameReactions(prev);
		}
	};

	const gamePredictions = useMemo(() => (game ? (predictions?.[game.fixture?.id] ?? {}) : {}), [predictions, game]);

	const currentLeaderboardPredictions = useMemo(
		() => Object.entries(gamePredictions).filter(([entryUid]) => members.includes(entryUid)),
		[gamePredictions, members]
	);

	const gamePredictionsAndResults = useMemo(() => {
		if (!game) return [];
		const sorted = currentLeaderboardPredictions
			.filter(([entryUid]) => entryUid !== uid)
			.map(([entryUid, prediction]) => ({
				uid: entryUid,
				prediction,
				result: getResult(prediction, game),
			}))
			.sort(
				(a, b) =>
					(users[b.uid].score?.['all']?.points ?? 0) - (users[a.uid].score?.['all']?.points ?? 0) ||
					users[a.uid].displayName.localeCompare(users[b.uid].displayName)
			);
		if (!noSpoilers) {
			sorted.sort((a, b) => {
				const gameOdds = odds?.[game.fixture.id];
				const aBoosted = boosts?.[a.uid]?.includes(game.fixture.id) ?? false;
				const bBoosted = boosts?.[b.uid]?.includes(game.fixture.id) ?? false;
				return (
					getEarnedPoints(b.prediction, game, competition, gameOdds, bBoosted) -
						getEarnedPoints(a.prediction, game, competition, gameOdds, aBoosted) ||
					(b.result.onescore ?? 0) - (a.result.onescore ?? 0)
				);
			});
		}
		return sorted;
	}, [currentLeaderboardPredictions, uid, game, users, noSpoilers, competition, odds, boosts]);

	const resultsTally = useMemo(
		() =>
			game && isGameStarted(game)
				? [...gamePredictionsAndResults, { result: getResult(gamePredictions[uid], game) }].reduce(
						(acc, { result: r }) => ({
							...acc,
							exact: acc.exact + (r.exact ?? 0),
							onescore: acc.onescore + (r.onescore ?? 0),
							result: acc.result + (r.result ?? 0),
							penalty: acc.penalty + (r.penalty ?? 0),
							fail: acc.fail + (r.fail ?? 0),
						}),
						DEFAULT_USER_RESULT
					)
				: {},
		[gamePredictionsAndResults, game, gamePredictions, uid]
	);

	if (!game || !userInfo) return <LoadingSkeleton />;

	const stadiumImage = getStadiumImageURL(game?.fixture.venue);

	return (
		<KeyboardHandle
			prevGameId={prevGameId}
			nextGameId={nextGameId}
			setGameID={setGameID}
			isReactionPanelOpen={isReactionPanelOpen}
		>
			<Panel
				className={classNames(
					gcc('text-light'),
					gcc('bg-dark'),
					'relative m-4 flex select-none flex-col justify-center rounded-md p-4 shadow-pop sm:m-8 sm:p-8 md:mx-24'
				)}
			>
				<div {...handlers}>
					<div className={classNames('mb-4 flex flex-row items-center justify-between')}>
						{!id && <p className='text-3xl'>Next Game</p>}
						{id && <p className='text-3xl'>{game.league?.round}</p>}
						<div className='flex items-center gap-3'>
							<span className='flex items-center gap-1 text-xs opacity-40 sm:hidden'>
								<span>← swipe →</span>
							</span>
							<span className='hidden items-center gap-1 text-xs opacity-40 sm:flex'>
								<kbd className='rounded border border-current px-1.5 py-0.5'>←</kbd>
								<kbd className='rounded border border-current px-1.5 py-0.5'>→</kbd>
							</span>
							<RefreshComp />
						</div>
					</div>

					<GameStoryStrip
						sortedFixtures={sortedFixtures}
						currentId={game.fixture.id}
						onSelect={id => !isReactionPanelOpen && setGameID(id)}
						noSpoilers={noSpoilers}
					/>

					<div className='relative'>
						{!isExtraInfoOpen && prevGameId !== null && (
							<div
								className={classNames(
									`absolute left-0 top-1/2 w-max -translate-y-1/2 cursor-pointer rounded-md sm:-translate-x-full`
								)}
								onClick={() => !isReactionPanelOpen && setGameID(prevGameId)}
							>
								<ChevronLeftIcon className={classNames(gcc('text-light'), 'size-8')} />
							</div>
						)}
						<LiveGame
							gameID={game.fixture?.id}
							key={game.fixture?.id}
							setIsExtraInfoOpen={setIsExtraInfoOpen}
						/>
						{!isExtraInfoOpen && nextGameId !== null && (
							<div
								className={classNames(
									gcc('text-blue'),
									gcc('hover:text-light'),
									`absolute right-0 top-1/2 w-max -translate-y-1/2 cursor-pointer rounded-md sm:translate-x-full`
								)}
								onClick={() => !isReactionPanelOpen && setGameID(nextGameId)}
							>
								<ChevronRightIcon className={classNames(gcc('text-light'), 'size-8')} />
							</div>
						)}
					</div>

					<div className='mt-6'>
						<div className='mb-4 text-xl font-bold'>My Prediction</div>
						<div className='flex flex-row flex-wrap'>
							<UserGuess
								gameID={game.fixture.id}
								user={users[userInfo.uid]}
								guess={gamePredictions[userInfo.uid] ?? { home: undefined, away: undefined }}
								key={userInfo.uid}
								game={game}
								updatePrediction={updatePrediction}
								myGuess
								gameReactions={gameReactions}
								onReact={handleReact}
								users={users}
								onReactionPanelChange={setIsReactionPanelOpen}
							/>
						</div>
					</div>

					<PredictionsStats
						game={game}
						gamePredictions={currentLeaderboardPredictions.map(([_, p]) => p)}
						resultsTally={resultsTally}
					/>

					<div className='z-10 mb-20 mt-6'>
						<div className='mb-4 flex flex-row items-center justify-between text-xl'>
							<div className='font-bold'>
								Predictions <span className='opacity-50'>({gamePredictionsAndResults.length})</span>
							</div>
							{Object.keys(leaderboards).length > 0 && (
								<SelectLeaderboard
									users={users}
									leaderboards={leaderboards}
									currentLeaderboard={currentLeaderboard}
									setCurrentLeaderboard={setCurrentLeaderboard}
									setMembers={setMembers}
									className='!w-36 text-xs'
								/>
							)}
						</div>
						<div className='flex flex-row flex-wrap'>
							{gamePredictionsAndResults.map(({ uid, prediction }) => (
								<UserGuess
									gameID={game.fixture.id}
									user={users[uid]}
									guess={prediction}
									key={uid}
									game={game}
									updatePrediction={updatePrediction}
									gameReactions={gameReactions}
									onReact={handleReact}
									users={users}
									onReactionPanelChange={setIsReactionPanelOpen}
								/>
							))}
						</div>
					</div>

					{stadiumImage && (
						<div></div>
						// <img className="object-cover absolute bottom-0 right-6 opacity-50 z-0 w-48" src={stadiumImage} />
					)}
				</div>
			</Panel>
		</KeyboardHandle>
	);
};

export default CurrentMatch;
