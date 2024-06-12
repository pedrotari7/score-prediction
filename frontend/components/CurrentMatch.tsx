import { Dispatch, ReactNode, SetStateAction, useContext, useEffect, useState } from 'react';
import UserContext from '../context/UserContext';
import { useSwipeable } from 'react-swipeable';
import LiveGame from './LiveGame';
import {
	Fixture,
	Fixtures,
	Leaderboard,
	Prediction,
	Predictions,
	UpdatePrediction,
	User,
	UserResult,
	Users,
} from '../../interfaces/main';
import RouteContext, { Route } from '../context/RouteContext';
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
import Loading from './Loading';
import RefreshComp from './RefreshComp';
import PredictionsStats from './PredictionsStats';
import SelectLeaderboard from './SelectLeaderboard';
import useNoSpoilers from '../hooks/useNoSpoilers';
import useCompetition from '../hooks/useCompetition';
import { userInputPrediction } from '../hooks/userInputPrediction';
import { DateTime } from 'luxon';
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
	const routeInfo = useContext(RouteContext)!;

	const { setRoute } = routeInfo;

	const parsedGuess = { home: formatScore(guess.home), away: formatScore(guess.away) };

	const emptyScore = guess.home === undefined || guess.away === undefined;
	const hiddenScore = parsedGuess.home === 'H' && parsedGuess.away === 'H';
	const invalidScore = parsedGuess.home === 'X' && parsedGuess.away === 'X';

	const gameDate = DateTime.fromISO(game?.fixture.date);
	const isInPast = getCurrentDate() >= gameDate;

	const { UserInputPrediction } = userInputPrediction(gameID, guess, updatePrediction);

	return (
		<ResultContainer
			prediction={guess}
			game={game}
			className={
				classNames(
					'my-2 flex w-full flex-row items-center justify-between rounded p-4 sm:m-2 sm:w-max',
					'cursor-pointer select-none gap-4'
				) +
				' ' +
				// eslint-disable-next-line tailwindcss/migration-from-tailwind-2
				classNames('hover:bg-opacity-50')
			}
			onClick={() => setRoute({ page: Route.Predictions, data: user.uid })}
		>
			<span className='flex flex-row items-center text-left text-xs'>
				{user?.photoURL && <img className='mr-2 size-8 rounded-full object-cover' src={user?.photoURL} />}
				<span>{user?.displayName}</span>
			</span>

			{invalidScore && !emptyScore && <div className='text-sm font-bold'>Invalid</div>}

			{!hiddenScore && (
				<div className='flex flex-row'>
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
					{!isInPast && myGuess && <UserInputPrediction />}
				</div>
			)}
		</ResultContainer>
	);
};

const KeyboardHandle = ({
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
}) => {
	useEffect(() => {
		const keyDownHandler = (event: KeyboardEvent) => {
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
	const userInfo = useContext(UserContext);

	const { gcc, competition } = useCompetition();
	const { noSpoilers } = useNoSpoilers();

	const [id, setGameID] = useState(gameID);
	const [currentLeaderboard, setCurrentLeaderboard] = useState('global');
	const [members, setMembers] = useState<string[]>(Object.keys(users));

	const calculatePoints = (ur: Partial<UserResult>) => calculateUserResultPoints(ur, competition);

	const sortedFixtures = Object.values(fixtures).sort(
		(a, b) => a.fixture.timestamp - b.fixture.timestamp
	) as Fixture[];

	const nextGame = sortedFixtures.findIndex(game => !isGameFinished(game));

	const game = id ? fixtures[id] : sortedFixtures[nextGame === -1 ? sortedFixtures.length - 1 : nextGame];

	const [isExtraInfoOpen, setIsExtraInfoOpen] = useState(false);

	const handlers = useSwipeable({
		onSwipedLeft: () => nextGameId !== null && !isExtraInfoOpen && setGameID(nextGameId),
		onSwipedRight: () => prevGameId !== null && !isExtraInfoOpen && setGameID(prevGameId),
		preventScrollOnSwipe: true,
	});

	if (!game || !userInfo) return <Loading message='Fetching tournament info...' />;

	const gamePredictions = predictions?.[game.fixture?.id] ?? {};

	const currentLeaderboardPredictions = Object.entries(gamePredictions).filter(([uid]) => members.includes(uid));

	let gamePredictionsAndResults = currentLeaderboardPredictions
		.filter(([uid]) => uid !== userInfo.uid)
		.map(([uid, prediction]) => ({
			uid,
			prediction,
			result: getResult(prediction, game),
		}))
		.sort((a, b) => users[a.uid].displayName.localeCompare(users[b.uid].displayName));

	if (!noSpoilers) {
		gamePredictionsAndResults = gamePredictionsAndResults.sort(
			(a, b) =>
				calculatePoints(b.result ?? {}) - calculatePoints(a.result ?? {}) ||
				(b.result.onescore ?? 0) - (a.result.onescore ?? 0)
		);
	}
	const resultsTally = isGameStarted(game)
		? [...gamePredictionsAndResults, { result: getResult(gamePredictions[userInfo.uid], game) }].reduce(
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
		: {};

	const findGame = (dir: -1 | 1) => {
		const prevGameIdx = sortedFixtures.findIndex(g => g.fixture.id === game.fixture.id) + dir;
		return sortedFixtures[prevGameIdx] ? sortedFixtures[prevGameIdx].fixture.id : null;
	};

	const prevGameId = findGame(-1);
	const nextGameId = findGame(1);

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
						<RefreshComp />
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
