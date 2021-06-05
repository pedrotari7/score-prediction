import { DateTime } from 'luxon';
import { ChangeEvent, useContext } from 'react';
import { Predictions } from '../../interfaces/main';
import FixturesContext from '../context/FixturesContext';
import RouteContext, { Route } from '../context/RouteContext';
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
	const data = useContext(FixturesContext);
	const routeInfo = useContext(RouteContext);

	if (!data || !routeInfo) return <></>;

	const { setRoute } = routeInfo;

	const game = data[gameID];

	const prediction = predictions?.[gameID]?.[userID] || DEFAULT_PREDICTION;

	const round = game?.league.round;

	const gameDate = DateTime.fromISO(game?.fixture.date);

	const isInPast = getCurrentDate() < gameDate;

	const onPredictionChange = (e: ChangeEvent<HTMLInputElement>, team: string) => {
		updatePrediction({ ...prediction, [team]: e.target.value });
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
				<div className="flex flex-row items-center justify-end lg:w-6/12">
					<span className="hidden lg:block mr-2">{game?.teams.home.name}</span>

					<Flag team={game?.teams.home} />

					<ScoreInput
						id={`${gameID}-home`}
						value={prediction.home}
						className="mx-2"
						disabled={!isInPast}
						onchange={(e: ChangeEvent<HTMLInputElement>) => onPredictionChange(e, 'home')}
					/>

					<ScoreInput value={game.goals.home} disabled={true} className="mx-2" />
				</div>

				<div className="flex flex-row items-center justify-start lg:w-6/12 my-2 lg:my-0">
					<ScoreInput value={game.goals.away} disabled={true} className="mx-2" />
					<ScoreInput
						id={`${gameID}-away`}
						value={prediction.away}
						className="mx-2"
						disabled={!isInPast}
						onchange={(e: ChangeEvent<HTMLInputElement>) => onPredictionChange(e, 'away')}
					/>

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
