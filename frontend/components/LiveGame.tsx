import { DateTime } from 'luxon';
import React, { ChangeEvent, useContext } from 'react';
import { Predictions } from '../../interfaces/main';
import FixturesContext from '../context/FixturesContext';
import UserContext from '../context/UserContext';
import { getCurrentDate } from '../lib/utils/reactHelper';
import Flag from './Flag';
import ScoreInput from './ScoreInput';

const LiveGame = ({
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

	if (!data || !userInfo) return <></>;

	const game = data[gameID];

	const prediction = predictions[userInfo.uid];

	const group = game?.league.round.match(/Group (.) -/)?.[1];

	const gameDate = DateTime.fromISO(game?.fixture.date);

	const isInPast = getCurrentDate() < gameDate;

	return (
		<div className="text-light flex flex-row items-center justify-evenly my-2 rounded p-2 bg-gark shadow-pop">
			<span className="text-xs text-left w-1/12 flex ">
				<div className="w-5 h-5 flex items-center justify-center">
					<span>{group}</span>
				</div>
			</span>

			<div className="w-10/12 flex flex-row justify-center items-center">
				<div className="flex flex-row items-center justify-end sm:w-4/12">
					<span className="hidden sm:block mr-2">{game?.teams.home.name}</span>
					<Flag team={game?.teams.home} />

					{!isInPast && (
						<ScoreInput
							value={prediction.home}
							className="mx-2"
							onchange={(e: ChangeEvent<HTMLInputElement>) => {
								e.preventDefault();
								updatePrediction({ ...prediction, home: e.target.value });
							}}
						/>
					)}
				</div>

				{isInPast && (
					<span className="text-md sm:w-4/12 text-center mx-2">
						{DateTime.fromISO(game?.fixture.date).toFormat('dd LLL HH:mm')}
					</span>
				)}

				<div className="flex flex-row items-center justify-start sm:w-4/12">
					{!isInPast && (
						<ScoreInput
							value={prediction.away}
							onchange={(e: ChangeEvent<HTMLInputElement>) => {
								e.preventDefault();
								updatePrediction({ ...prediction, away: e.target.value });
							}}
						/>
					)}
					<Flag team={game?.teams.away} />
					<span className="hidden sm:block ml-2">{game?.teams.away.name}</span>
				</div>
			</div>

			<span className="text-xs text-right w-0 md:w-2/12 invisible md:visible">
				{game?.fixture.venue.name}, {game?.fixture.venue.city}
			</span>
		</div>
	);
};

export default LiveGame;
