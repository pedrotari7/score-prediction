import { DateTime } from 'luxon';
import { ChangeEvent, useState } from 'react';
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

const Game = ({ game }: { game: any }) => {
	const [score, setScore] = useState({ home: '0', away: '0' });
	return (
		<div className="text-light flex flex-row items-center justify-evenly my-2 rounded p-2 bg-gray-900">
			<span className="text-xs w-2/12">{DateTime.fromISO(game.fixture.date).toFormat('dd LLL HH:mm')}</span>

			<div className="flex flex-row items-center justify-end w-4/12">
				<span className="mr-2">{game.teams.home.name}</span>
				<img className="object-cover h-3 w-5 mr-2" src={game.teams.home.logo} />
				<ScoreInput
					value={score.home}
					className="mx-2"
					onchange={(e: ChangeEvent<HTMLInputElement>) => setScore({ ...score, home: e.target.value })}
				/>
			</div>

			<div className="flex flex-row items-center justify-start w-4/12">
				<ScoreInput
					value={score.away}
					className="mx-2"
					onchange={(e: ChangeEvent<HTMLInputElement>) => setScore({ ...score, away: e.target.value })}
				/>
				<img className="object-cover h-3 w-5 ml-2" src={game.teams.away.logo} />
				<span className="ml-2">{game.teams.away.name}</span>
			</div>
			<span className="text-xs text-right w-2/12">
				{game.fixture.venue.name}, {game.fixture.venue.city}
			</span>
		</div>
	);
};

export default Game;
