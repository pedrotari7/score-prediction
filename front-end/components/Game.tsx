import { DateTime } from 'luxon';
import { ChangeEvent, useContext } from 'react';
import { Predictions } from '../../interfaces/main';
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
}: {
	predictions: Predictions;
	updatePrediction: Function;
	gameID: number;
}) => {
	const data = useContext(FixturesContext);
	const userInfo = useContext(UserContext);
	const routeInfo = useContext(RouteContext);

	if (!data || !userInfo || !routeInfo) return <></>;

	const { setRoute } = routeInfo;

	const game = data[gameID];

	const prediction = predictions?.[gameID]?.[userInfo.uid] || DEFAULT_PREDICTION;

	const group = game?.league.round.match(/Group (.) -/)?.[1];

	const gameDate = DateTime.fromISO(game?.fixture.date);

	const isInPast = getCurrentDate() < gameDate;

	const onPredictionChange = (e: ChangeEvent<HTMLInputElement>, team: string) => {
		updatePrediction({ ...prediction, [team]: e.target.value });
	};

	return (
		<div
			className={classNames(
				'text-light flex flex-col sm:flex-row items-center justify-evenly my-2 rounded p-2 bg-gark shadow-pop',
				'cursor-pointer hover:bg-blue'
			)}
			onClick={() => setRoute({ page: Route.Match, data: gameID })}>
			<span className="text-xs text-left w-full sm:w-2/12 flex justify-between items-center ">
				<div className="w-5 h-5 flex items-center">
					<span>{group}</span>
				</div>
				<span className="text-xs">{DateTime.fromISO(game?.fixture.date).toFormat('dd LLL HH:mm')}</span>
			</span>

			<div className="flex flex-row sm:w-8/12 justify-center items-center">
				<div className="flex flex-row items-center justify-end sm:w-6/12">
					<span className="hidden sm:block mr-2">{game?.teams.home.name}</span>

					<Flag team={game?.teams.home} />

					<ScoreInput
						id={`${gameID}-home`}
						value={prediction.home}
						className="mx-2"
						disabled={!isInPast}
						onchange={(e: ChangeEvent<HTMLInputElement>) => onPredictionChange(e, 'home')}
					/>
				</div>

				<div className="flex flex-row items-center justify-start sm:w-6/12 my-2 sm:my-0">
					<ScoreInput
						id={`${gameID}-away`}
						value={prediction.away}
						className="mx-2"
						disabled={!isInPast}
						onchange={(e: ChangeEvent<HTMLInputElement>) => onPredictionChange(e, 'away')}
					/>

					<Flag team={game?.teams.away} />

					<span className="hidden sm:block ml-2">{game?.teams.away.name}</span>
				</div>
			</div>

			<span className="text-xs text-right sm:w-2/12 my-2 sm:my-0">
				{game?.fixture.venue.name}, {game?.fixture.venue.city}
			</span>
		</div>
	);
};

export default Game;
