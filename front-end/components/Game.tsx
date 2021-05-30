import { DateTime } from 'luxon';
import { ChangeEvent, useContext } from 'react';
import FixturesContext from '../context/FixturesContext';
import UserContext from '../context/UserContext';
import { classNames } from '../lib/utils/reactHelper';

const ScoreInput = ({ className, value, onchange }: any) => (
	<input
		value={value}
		onChange={onchange}
		className={classNames(
			className,
			'block w-14 h-7 bg-gray-300 text-gray-700 border border-gray-200 text-center',
			'rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500'
		)}
		type="text"
	/>
);

const DEFAULT_PREDICTION = { home: '', away: '' };

const Game = ({ updatePrediction, gameID }: { updatePrediction: Function; gameID: number }) => {
	const data = useContext(FixturesContext);
	const userInfo = useContext(UserContext);

	if (!data || !userInfo) return <></>;

	const game = data.fixtures[gameID];

	const prediction = game?.predictions[userInfo.uid] || DEFAULT_PREDICTION;

	return (
		<div className="text-light flex flex-row items-center justify-evenly my-2 rounded p-2 bg-gray-900 shadow-panel">
			<span className="text-xs w-2/12">{DateTime.fromISO(game?.fixture.date).toFormat('dd LLL HH:mm')}</span>

			<div className="flex flex-row items-center justify-end w-4/12">
				<span className="invisible sm:visible mr-2">{game?.teams.home.name}</span>
				<img className="object-cover h-3 w-5 mr-2" src={game?.teams.home.logo} />
				<ScoreInput
					value={prediction.home}
					className="mx-2"
					onchange={(e: ChangeEvent<HTMLInputElement>) =>
						updatePrediction({ ...prediction, home: e.target.value })
					}
				/>
			</div>

			<div className="flex flex-row items-center justify-start w-4/12">
				<ScoreInput
					value={prediction.away}
					className="mx-2"
					onchange={(e: ChangeEvent<HTMLInputElement>) =>
						updatePrediction({ ...prediction, away: e.target.value })
					}
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
