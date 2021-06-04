import { DateTime } from 'luxon';
import { ChangeEvent, useContext } from 'react';
import FixturesContext from '../context/FixturesContext';
import RouteContext, { Route } from '../context/RouteContext';
import UserContext from '../context/UserContext';
import { classNames, getCurrentDate } from '../lib/utils/reactHelper';
import { Predictions } from './Fixtures';
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
				'text-light flex flex-row items-center justify-evenly my-2 rounded p-2 bg-gark shadow-pop',
				'cursor-pointer hover:bg-blue'
			)}
			onClick={() => setRoute({ page: Route.Match, data: gameID })}>
			<span className="text-xs text-left w-1/12 flex ">
				<div className="w-5 h-5 flex items-center">
					<span>{group}</span>
				</div>
			</span>
			<span className="text-xs w-1/12">{DateTime.fromISO(game?.fixture.date).toFormat('dd LLL HH:mm')}</span>

			<div className="flex flex-row items-center justify-end w-4/12">
				<span className="invisible sm:visible mr-2">{game?.teams.home.name}</span>
				<img className="object-cover h-3 w-5 mr-2" src={game?.teams.home.logo} />
				<ScoreInput
					value={prediction.home}
					className="mx-2"
					disabled={!isInPast}
					onchange={(e: ChangeEvent<HTMLInputElement>) => onPredictionChange(e, 'home')}
				/>
			</div>

			<div className="flex flex-row items-center justify-start w-4/12">
				<ScoreInput
					value={prediction.away}
					className="mx-2"
					disabled={!isInPast}
					onchange={(e: ChangeEvent<HTMLInputElement>) => onPredictionChange(e, 'away')}
				/>
				<img className="object-cover h-3 w-5 ml-2" src={game?.teams.away.logo} />
				<span className="invisible sm:visible ml-2">{game?.teams.away.name}</span>
			</div>
			<span className="text-xs text-right w-0 md:w-2/12 invisible md:visible">
				{game?.fixture.venue.name}, {game?.fixture.venue.city}
			</span>
		</div>
	);
};

export default Game;
