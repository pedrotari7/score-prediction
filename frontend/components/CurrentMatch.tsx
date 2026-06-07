import Image from 'next/image';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { memo, useEffect, useMemo, useState } from 'react';
import { Route, useTournamentStore } from '../store/tournamentStore';
import { useSwipeable } from 'react-swipeable';
import LiveGame from './LiveGame';
import type {
	Fixture,
	Fixtures,
	Leaderboard,
	Prediction,
	Predictions,
	UpdatePrediction,
	User,
	Users,
} from '../../interfaces/main';
import { classNames, formatScore, getCurrentDate, getStadiumImageURL } from '../lib/utils/reactHelper';
import ResultContainer from './ResultContainer';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import {
	calculateUserResultPoints,
	DEFAULT_USER_RESULT,
	getResult,
	isGameFinished,
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

const UserGuess = ({
	gameID,
	user,
	guess,
	game,
	updatePrediction,
	myGuess = false,
}: {
	gameID: number;
	user: User;
	guess: Prediction;
	game: Fixture;
	updatePrediction: UpdatePrediction;
	myGuess?: boolean;
}) => {
	const setRoute = useTournamentStore(s => s.setRoute);
	const boosts = useTournamentStore(s => s.boosts);
	const doUpdateBoost = useTournamentStore(s => s.updateBoost);
	const uid = useTournamentStore(s => s.uid);
	const { competition } = useCompetition();

	const maxBoosts = competition.points.boosts ?? 0;
	const myBoosts = boosts?.[uid] ?? [];
	const isBoosted = myBoosts.includes(gameID);
	const remainingBoosts = maxBoosts - myBoosts.length;

	const parsedGuess = { home: formatScore(guess.home), away: formatScore(guess.away) };

	const emptyScore = guess.home === undefined || guess.away === undefined;
	const hiddenScore = parsedGuess.home === 'H' && parsedGuess.away === 'H';
	const invalidScore = parsedGuess.home === 'X' && parsedGuess.away === 'X';

	const gameDate = new Date(game?.fixture.date);
	const isInPast = getCurrentDate().getTime() >= gameDate.getTime();

	const { homeInputRef, awayInputRef } = useInputPrediction(gameID, guess);

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
						: 'flex-row items-center justify-between gap-4',
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
				<div className='flex justify-center text-xl sm:justify-start'>
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
						<UserInputPrediction
							gameID={gameID}
							prediction={guess}
							updatePrediction={updatePrediction}
							homeInputRef={homeInputRef}
							awayInputRef={awayInputRef}
						/>
					)}
				</div>
			)}
			{!isInPast && myGuess && maxBoosts > 0 && (
				<div className='flex justify-center sm:justify-start'>
					<button
						onClick={e => {
							e.stopPropagation();
							doUpdateBoost(gameID);
						}}
						disabled={!isBoosted && remainingBoosts <= 0}
						className={classNames(
							'rounded-full px-3 py-1 text-xs font-bold transition-colors',
							isBoosted
								? 'bg-indigo-500 text-white'
								: remainingBoosts > 0
									? 'bg-gray-600 text-gray-300 hover:bg-indigo-500/50'
									: 'cursor-not-allowed bg-gray-700 text-gray-500'
						)}
					>
						{isBoosted ? '2x Boosted' : `2x (${remainingBoosts} left)`}
					</button>
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
}: {
	prevGameId: number | null;
	nextGameId: number | null;
	children: ReactNode;
	className?: string;
	setGameID: Dispatch<SetStateAction<number>>;
}) {
	useEffect(() => {
		const keyDownHandler = (event: KeyboardEvent) => {
			if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
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
	}, [prevGameId, nextGameId, setGameID]);

	return <div className={className}>{children}</div>;
});

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

	const { gcc, competition } = useCompetition();
	const { noSpoilers } = useNoSpoilers();

	const [id, setGameID] = useState(gameID);
	const [currentLeaderboard, setCurrentLeaderboard] = useState('global');
	const [members, setMembers] = useState<string[]>(Object.keys(users));

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
		onSwipedLeft: () => nextGameId !== null && !isExtraInfoOpen && setGameID(nextGameId),
		onSwipedRight: () => prevGameId !== null && !isExtraInfoOpen && setGameID(prevGameId),
		preventScrollOnSwipe: true,
	});

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
			sorted.sort(
				(a, b) =>
					calculateUserResultPoints(b.result ?? {}, competition) -
						calculateUserResultPoints(a.result ?? {}, competition) ||
					(b.result.onescore ?? 0) - (a.result.onescore ?? 0)
			);
		}
		return sorted;
	}, [currentLeaderboardPredictions, uid, game, users, noSpoilers, competition]);

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
		<KeyboardHandle prevGameId={prevGameId} nextGameId={nextGameId} setGameID={setGameID}>
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

					<div className='relative'>
						{!isExtraInfoOpen && prevGameId !== null && (
							<div
								className={classNames(
									`absolute left-0 top-1/2 w-max -translate-y-1/2 cursor-pointer rounded-md sm:-translate-x-full`
								)}
								onClick={() => setGameID(prevGameId)}
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
								onClick={() => setGameID(nextGameId)}
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
