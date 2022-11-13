import { Dispatch, ReactNode, SetStateAction, useContext, useEffect, useState } from 'react';
import UserContext from '../context/UserContext';
import { useSwipeable } from 'react-swipeable';
import LiveGame from './LiveGame';
import { Fixture, Fixtures, Prediction, Predictions, User, Users } from '../../interfaces/main';
import RouteContext, { Route } from '../context/RouteContext';
import { classNames, formatScore, getCompetitionClass, getStadiumImageURL } from '../lib/utils/reactHelper';
import ResultContainer from './ResultContainer';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { getResult, isGameFinished } from '../../shared/utils';
import CompetitionContext from '../context/CompetitionContext';

const UserGuess = ({ user, guess, game }: { user: User; guess: Prediction; game: Fixture }) => {
	const routeInfo = useContext(RouteContext)!;

	const { setRoute } = routeInfo;

	const parsedGuess = { home: formatScore(guess.home), away: formatScore(guess.away) };

	const competition = useContext(CompetitionContext);

	const gcc = (p: string) => getCompetitionClass(p, competition);

	return (
		<ResultContainer
			prediction={guess}
			game={game}
			className={classNames(
				gcc('text-light'),
				game.fixture.status.short === 'NS' ? gcc('bg-blue') : '',
				'flex flex-row items-center justify-between  my-2 sm:m-2 rounded p-4 w-full sm:w-max',
				'cursor-pointer hover:bg-opacity-50 select-none'
			)}
			onClick={() => setRoute({ page: Route.Predictions, data: user.uid })}>
			<span className="text-xs text-left flex flex-row items-center mr-8">
				{user?.photoURL && <img className="object-cover h-8 w-8 rounded-full mr-2" src={user?.photoURL} />}
				<span>{user?.displayName}</span>
			</span>

			<div className="flex flex-row">
				<div className="flex flex-row items-center justify-end font-bold">
					<span className="mr-2">{parsedGuess.home}</span>
				</div>

				<span className="">-</span>

				<div className="flex flex-row items-center justify-start font-bold">
					<span className="ml-2">{parsedGuess.away}</span>
				</div>
			</div>
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
}: {
	fixtures: Fixtures;
	predictions: Predictions;
	users: Users;
	gameID: number;
}) => {
	const userInfo = useContext(UserContext);
	const competition = useContext(CompetitionContext);

	const [id, setGameID] = useState(gameID);

	const sortedFixtures = Object.values(fixtures).sort((a, b) => a.fixture.timestamp - b.fixture.timestamp);

	const nextGame = sortedFixtures.findIndex(game => !isGameFinished(game));

	const game = id ? fixtures[id] : sortedFixtures[nextGame === -1 ? sortedFixtures.length - 1 : nextGame];

	const [isExtraInfoOpen, setIsExtraInfoOpen] = useState(false);

	const handlers = useSwipeable({
		onSwipedLeft: () => nextGameId !== null && setGameID(nextGameId),
		onSwipedRight: () => prevGameId !== null && setGameID(prevGameId),
		preventDefaultTouchmoveEvent: true,
	});

	if (!game) return <></>;

	const gamePredictions = predictions?.[game.fixture?.id] ?? {};

	const gamePredictionsAndResults = Object.entries(gamePredictions)
		.filter(([uid]) => uid !== userInfo?.uid)
		.map(([uid, prediction]) => ({
			uid,
			prediction,
			result: getResult(prediction, game),
		}))
		.sort((a, b) => (b.result.points ?? 0) - (a.result.points ?? 0));

	const findGame = (dir: -1 | 1) => {
		const prevGameIdx = sortedFixtures.findIndex(g => g.fixture.id === game.fixture.id) + dir;
		return sortedFixtures[prevGameIdx] ? sortedFixtures[prevGameIdx].fixture.id : null;
	};

	const prevGameId = findGame(-1);
	const nextGameId = findGame(1);

	const stadiumImage = getStadiumImageURL(game?.fixture.venue);

	const gcc = (p: string) => getCompetitionClass(p, competition);

	return (
		<KeyboardHandle prevGameId={prevGameId} nextGameId={nextGameId} setGameID={setGameID}>
			<main
				{...handlers}
				className={classNames(
					gcc('text-light'),
					gcc('bg-dark'),
					'flex flex-col justify-center select-none  m-4 sm:m-8 md:mx-24 p-4 sm:p-8 shadow-pop rounded-md  relative'
				)}>
				{!id && <p className="text-3xl mb-2">Next Game</p>}
				{id && <p className="text-3xl mb-2">{game.league?.round}</p>}

				<div className="relative">
					{!isExtraInfoOpen && prevGameId !== null && (
						<div
							className={classNames(
								gcc('text-blue'),
								gcc('hover:text-light'),
								`cursor-pointer w-max   rounded-md absolute left-0 top-1/2 transform -translate-y-1/2 sm:-translate-x-full`
							)}
							onClick={() => setGameID(prevGameId)}>
							<ChevronLeftIcon className={classNames(gcc('text-light'), 'h-8 w-8')} />
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
								`cursor-pointer w-max rounded-md absolute right-0 top-1/2 transform -translate-y-1/2 sm:translate-x-full`
							)}
							onClick={() => setGameID(nextGameId)}>
							<ChevronRightIcon className={classNames(gcc('text-light'), 'h-8 w-8')} />
						</div>
					)}
				</div>

				<div className="mt-6">
					<div className="text-xl mb-4">My Prediction</div>
					<div className="flex flex-row flex-wrap">
						{Object.entries(gamePredictions)
							.filter(([uid, _]) => uid === userInfo?.uid)
							.map(([uid, prediction]) => (
								<UserGuess user={users[uid]} guess={prediction} key={uid} game={game} />
							))}
					</div>
				</div>

				<div className="mt-6 mb-20 z-10">
					<div className="text-xl mb-4">Predictions</div>
					<div className="flex flex-row flex-wrap">
						{gamePredictionsAndResults.map(({ uid, prediction }) => (
							<UserGuess user={users[uid]} guess={prediction} key={uid} game={game} />
						))}
					</div>
				</div>

				{stadiumImage && (
					<img className="object-cover absolute bottom-0 right-6 opacity-50 z-0 w-48" src={stadiumImage} />
				)}
			</main>
		</KeyboardHandle>
	);
};

export default CurrentMatch;
