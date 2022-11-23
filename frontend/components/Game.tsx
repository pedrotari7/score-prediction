import { DateTime } from 'luxon';
import { ChangeEvent, useContext, useRef } from 'react';
import { Prediction, Predictions } from '../../interfaces/main';
import { isNum } from '../../shared/utils';
import CompetitionContext from '../context/CompetitionContext';
import FixturesContext from '../context/FixturesContext';
import RouteContext, { Route } from '../context/RouteContext';
import UserContext from '../context/UserContext';
import { classNames, formatScore, getCompetitionClass, getCurrentDate } from '../lib/utils/reactHelper';
import Flag from './Flag';
import ResultContainer from './ResultContainer';
import { Round } from './Round';
import ScoreInput from './ScoreInput';

const DEFAULT_PREDICTION = { home: null, away: null };

const Game = ({
	predictions,
	updatePrediction,
	gameID,
	userID,
}: {
	predictions: Predictions;
	updatePrediction: (prediction: Prediction) => Promise<void>;
	gameID: number;
	userID: string;
}) => {
	const data = useContext(FixturesContext)!;
	const routeInfo = useContext(RouteContext)!;
	const competition = useContext(CompetitionContext);
	const { uid } = useContext(UserContext)!;

	const homeInputRef = useRef<HTMLInputElement>(null);
	const awayInputRef = useRef<HTMLInputElement>(null);

	if (!data || !routeInfo) return <></>;

	const { setRoute } = routeInfo;

	const isMyPredictions = uid === userID;

	const game = data[gameID];

	const prediction = predictions?.[gameID]?.[userID] || DEFAULT_PREDICTION;

	const gameDate = DateTime.fromISO(game?.fixture.date);

	const isInPast = getCurrentDate() >= gameDate;

	const onPredictionChange = async (e: ChangeEvent<HTMLInputElement>, team: string) => {
		const value = parseInt(e.target.value);
		await updatePrediction({ ...prediction, [team]: isNaN(value) ? null : value });
	};

	const isValidScore = (n: number | null) => isNum(n) && n >= 0;

	const hasBothPredictions = isValidScore(prediction.home) && isValidScore(prediction.away);

	const gcc = (p: string) => getCompetitionClass(p, competition);

	return (
		<div
			className={classNames(
				gcc('text-light'),
				gcc('bg-dark'),
				gcc('hover:bg-blue'),
				`my-2 flex flex-col items-center justify-evenly rounded p-2 shadow-pop lg:flex-row`,
				'cursor-pointer'
			)}
			onClick={() => {
				if (hasBothPredictions || isInPast || !isMyPredictions) {
					return setRoute({ page: Route.Match, data: gameID });
				}
				if (!isValidScore(prediction.home)) return homeInputRef.current?.focus();
				return awayInputRef.current?.focus();
			}}>
			<span className="flex w-full items-center justify-between text-left text-xs lg:w-3/12 ">
				<Round game={game} />
				<span className="text-xs">{DateTime.fromISO(game?.fixture.date).toFormat('dd LLL HH:mm ccc')}</span>
			</span>

			<div className="flex w-full flex-row items-center justify-between sm:justify-center lg:w-8/12">
				<div className="flex w-2/12 flex-row items-center justify-end sm:w-5/12 lg:w-5/12">
					<span className="mr-2 hidden font-bold sm:block">{game?.teams.home.name}</span>
					<Flag team={game?.teams.home} />
				</div>

				<div className="flex w-4/12 flex-row items-center justify-center lg:w-4/12">
					{!isInPast && isMyPredictions && (
						<>
							<ScoreInput
								innerRef={homeInputRef}
								id={`${gameID}-home`}
								value={prediction.home}
								className="mx-2"
								onchange={async (e: ChangeEvent<HTMLInputElement>) =>
									await onPredictionChange(e, 'home')
								}
							/>

							<ScoreInput
								innerRef={awayInputRef}
								id={`${gameID}-away`}
								value={prediction.away}
								className="mx-2"
								onchange={async (e: ChangeEvent<HTMLInputElement>) =>
									await onPredictionChange(e, 'away')
								}
							/>
						</>
					)}

					{!isInPast && !isMyPredictions && (
						<div className="mx-4 font-bold">
							{formatScore(prediction.home)} - {formatScore(prediction.away)}
						</div>
					)}

					{isInPast && (
						<div className="mx-4 flex flex-col items-center justify-center font-bold lg:w-6/12">
							<ResultContainer className="mb-2 min-w-result px-2" prediction={prediction} game={game}>
								{(!isValidScore(prediction.home) || !isValidScore(prediction.away)) && (
									<span>No prediction</span>
								)}
								{isValidScore(prediction.home) && isValidScore(prediction.away) && (
									<div className=" py flex flex-row items-center justify-center">
										{prediction.home} - {prediction.away}
									</div>
								)}
							</ResultContainer>
							<div className="flex flex-row flex-wrap items-center justify-center">
								{game.goals.home} - {game.goals.away}
								{game.score.penalty.home && (
									<div className="ml-2 text-sm">
										<span>(</span>
										<span>{game.score.penalty.home}</span>
										<span className="mx-2">-</span>
										<span>{game.score.penalty.away}</span>
										<span>)</span>
									</div>
								)}
								<span className="ml-2">{game.fixture.status.short}</span>
							</div>
						</div>
					)}
				</div>

				<div className="my-2 flex w-2/12 flex-row items-center justify-start sm:w-5/12 lg:my-0 lg:w-5/12">
					<Flag team={game?.teams.away} />
					<span className="ml-2 hidden font-bold sm:block">{game?.teams.away.name}</span>
				</div>
			</div>

			<span className="my-2 text-right text-xs lg:my-0 lg:w-2/12">
				{game?.fixture.venue.name}, {game?.fixture.venue.city}
			</span>
		</div>
	);
};

export default Game;
