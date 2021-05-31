import React, { useContext } from 'react';
import UserContext from '../context/UserContext';
import { Fixtures, Prediction } from './Fixtures';
import Game from './Game';
import { User, Users } from './Rankings';

const UserGuess = ({ user, guess }: { user: User; guess: Prediction }) => {
	return (
		<div className="text-light flex flex-row items-center justify-evenly my-2 rounded p-2">
			<span className="text-xs text-left w-2/12 flex flex-row items-center">
				<img className="object-cover h-8 w-8 rounded-full mr-2" src={user.photoURL} />
				<span>{user.displayName}</span>
			</span>

			<div className="flex flex-row items-center justify-end w-4/12">
				<span className="mr-2">{guess.home}</span>
			</div>

			<div className="flex flex-row items-center justify-start w-4/12">
				<span className="mr-2">{guess.away}</span>
			</div>
			<span className="text-xs text-right w-0 md:w-2/12 invisible md:visible"></span>
		</div>
	);
};

const CurrentMatch = ({
	fixtures,
	updatePrediction,
	users,
}: {
	fixtures: Fixtures;
	updatePrediction: Function;
	users: Users;
}) => {
	const userInfo = useContext(UserContext);

	const game = Object.values(fixtures)[0];

	return (
		<main className="flex flex-col justify-center select-none text-light m-8 p-8 shadow-pop rounded-md">
			<p className="text-3xl mb-2">Next Game</p>
			<Game
				gameID={game.fixture?.id}
				updatePrediction={(update: Prediction) => updatePrediction(update, game.fixture?.id)}
				key={game.fixture?.id}
			/>

			<div>
				{Object.entries(game.predictions)
					.filter(([uid, _]) => uid !== userInfo?.uid)
					.map(([uid, prediction]) => (
						<UserGuess user={users[uid]} guess={prediction} key={uid} />
					))}
			</div>
		</main>
	);
};

export default CurrentMatch;
