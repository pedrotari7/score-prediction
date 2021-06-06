import { DateTime } from 'luxon';
import { ChangeEvent, useContext, ReactChildren, ReactNode } from 'react';
import { Predictions, Result, Score } from '../../interfaces/main';
import FixturesContext from '../context/FixturesContext';
import RouteContext, { Route } from '../context/RouteContext';
import UserContext from '../context/UserContext';
import { classNames, getCurrentDate } from '../lib/utils/reactHelper';
import Flag from './Flag';
import ScoreInput from './ScoreInput';

const DEFAULT_PREDICTION = { home: '', away: '' };

const Game = ({
	predictions,
	updatePrediction,
	gameID,
	userID,
}: {
	predictions: Predictions;
	updatePrediction: Function;
	gameID: number;
	userID: string;
}) => {
	const data = useContext(FixturesContext)!;
	const routeInfo = useContext(RouteContext)!;
	const { uid } = useContext(UserContext)!;

	if (!data || !routeInfo) return <></>;

	const { setRoute } = routeInfo;

	const isMyPredictions = uid === userID;

	const game = data[gameID];

	const prediction = predictions?.[gameID]?.[userID] || DEFAULT_PREDICTION;

	const round = game?.league.round;

	const gameDate = DateTime.fromISO(game?.fixture.date);

	const isInPast = getCurrentDate() >= gameDate;

	const onPredictionChange = (e: ChangeEvent<HTMLInputElement>, team: string) => {
		updatePrediction({ ...prediction, [team]: parseInt(e.target.value) });
	};

	const Result = ({ children, className = '' }: { className?: string; children: ReactNode }) => {
		const { home: predH, away: predA } = prediction;
		const { home: realH, away: realA } = game.goals;

		const getOutcome = (g: Result) => {
			if (g.home > g.away) return 'winH';
			if (g.home < g.away) return 'winA';
			if (g.home === g.away) return 'draw';
		};

		const isExactScore = predH === realH && predA === realA;
		const isCorrectResult = !isExactScore && getOutcome(prediction) === getOutcome(game.goals);
		const isCorrectGoal = !isExactScore && !isCorrectResult && (predH === realH || predA === realA);
		const isWrong = !isExactScore && !isCorrectResult && !isCorrectGoal;
		return (
			<div
				className={classNames(
					className,
					'rounded-md px-2 mb-2 w-24 text-center',
					isExactScore ? 'bg-green-500' : '',
					isCorrectResult ? 'bg-indigo-600' : '',
					isCorrectGoal ? 'bg bg-pink-500' : '',
					isWrong ? 'bg-red-500' : ''
				)}>
				{children}
			</div>
		);
	};

	return (
		<div
			className={classNames(
				'text-light flex flex-col lg:flex-row items-center justify-evenly my-2 rounded p-2 bg-gark shadow-pop',
				'cursor-pointer hover:bg-blue'
			)}
			onClick={() => setRoute({ page: Route.Match, data: gameID })}>
			<span className="text-xs text-left w-full lg:w-2/12 flex justify-between items-center ">
				<div className="items-center">
					<span>{round}</span>
				</div>
				<span className="text-xs">{DateTime.fromISO(game?.fixture.date).toFormat('dd LLL HH:mm')}</span>
			</span>

			<div className="flex flex-row lg:w-8/12 justify-center items-center">
				<div className="flex flex-row items-center justify-end lg:w-5/12">
					<span className="hidden lg:block mr-2">{game?.teams.home.name}</span>

					<Flag team={game?.teams.home} />
				</div>

				{!isInPast && isMyPredictions && (
					<>
						<ScoreInput
							id={`${gameID}-home`}
							value={prediction.home}
							className="mx-2"
							onchange={(e: ChangeEvent<HTMLInputElement>) => onPredictionChange(e, 'home')}
						/>

						<ScoreInput
							id={`${gameID}-away`}
							value={prediction.away}
							className="mx-2"
							onchange={(e: ChangeEvent<HTMLInputElement>) => onPredictionChange(e, 'away')}
						/>
					</>
				)}

				{!isInPast && !isMyPredictions && (
					<div className="font-bold mx-4">
						{prediction.home || 'X'} - {prediction.away || 'X'}
					</div>
				)}

				{isInPast && (
					<div className="font-bold mx-4 lg:w-3/12 flex flex-col items-center justify-center">
						<Result>
							{(!prediction.home || !prediction.away) && <span>No prediction</span>}
							{prediction.home && prediction.away && (
								<span>
									{prediction.home} - {prediction.away}
								</span>
							)}
						</Result>
						<div>
							{game.goals.home} - {game.goals.away}
							<span className="ml-2">{game.fixture.status.short}</span>
						</div>
					</div>
				)}

				<div className="flex flex-row items-center justify-start lg:w-5/12 my-2 lg:my-0">
					<Flag team={game?.teams.away} />

					<span className="hidden lg:block ml-2">{game?.teams.away.name}</span>
				</div>
			</div>

			<span className="text-xs text-right lg:w-2/12 my-2 lg:my-0">
				{game?.fixture.venue.name}, {game?.fixture.venue.city}
			</span>
		</div>
	);
};

export default Game;
