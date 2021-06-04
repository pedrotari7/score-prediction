import React, { useContext } from 'react';
import UserContext from '../context/UserContext';
import { Fixtures, Venue } from './Fixtures';
import LiveGame from './LiveGame';
import { User, Users } from './Rankings';
import { Prediction, Predictions } from '../../interfaces/main';

const stadiumImageURL = (venue: Venue) => `/stadiums/${venue.city.toLocaleLowerCase().replace(/\s/g, '')}.webp`;

const UserGuess = ({ user, guess }: { user: User; guess: Prediction }) => {
	return (
		<div className="text-light flex flex-row items-center m-2 rounded p-3 bg-blue">
			<span className="text-xs text-left flex flex-row items-center mr-8">
				{user?.photoURL && <img className="object-cover h-8 w-8 rounded-full mr-2" src={user?.photoURL} />}
				<span>{user?.displayName}</span>
			</span>

			<div className="flex flex-row items-center justify-end w-4">
				<span className="mr-2">{guess.home}</span>
			</div>

			<span className="">-</span>

			<div className="flex flex-row items-center justify-start w-4">
				<span className="ml-2">{guess.away}</span>
			</div>
		</div>
	);
};

const CurrentMatch = ({
	fixtures,
	predictions,
	updatePrediction,
	users,
	gameID = undefined,
}: {
	fixtures: Fixtures;
	predictions: Predictions;
	updatePrediction: Function;
	users: Users;
	gameID?: number | undefined;
}) => {
	const userInfo = useContext(UserContext);

	const game = gameID ? fixtures[gameID] : Object.values(fixtures)[0];

	if (!game) return <></>;

	const gamePredictions = predictions?.[game.fixture?.id] ?? {};

	return (
		<main className="flex flex-col justify-center select-none text-light m-8 md:mx-24 p-8 shadow-pop rounded-md bg-dark relative">
			{!gameID && <p className="text-3xl mb-2">Next Game</p>}
			{gameID && <p className="text-3xl mb-2">{game.league?.round}</p>}

			<LiveGame
				predictions={predictions}
				gameID={game.fixture?.id}
				updatePrediction={(update: Prediction) => updatePrediction(update, game.fixture?.id)}
				key={game.fixture?.id}
			/>

			<div className="mt-6">
				<div className="text-xl mb-4">My Prediction</div>
				<div className="flex flex-row flex-wrap">
					{Object.entries(gamePredictions)
						.filter(([uid, _]) => uid === userInfo?.uid)
						.map(([uid, prediction]) => (
							<UserGuess user={users[uid]} guess={prediction} key={uid} />
						))}
				</div>
			</div>

			<div className="mt-6 z-10">
				<div className="text-xl mb-4">Predictions</div>
				<div className="flex flex-row flex-wrap">
					{Object.entries(gamePredictions)
						.filter(([uid, _]) => uid !== userInfo?.uid)
						.map(([uid, prediction]) => (
							<UserGuess user={users[uid]} guess={prediction} key={uid} />
						))}
				</div>
			</div>

			<img
				className="object-cover absolute bottom-0 right-6 opacity-50 z-0 w-48"
				src={stadiumImageURL(game?.fixture.venue)}
			/>
		</main>
	);
};

export default CurrentMatch;
