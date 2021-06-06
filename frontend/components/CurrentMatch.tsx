import React, { useContext } from 'react';
import UserContext from '../context/UserContext';
import LiveGame from './LiveGame';
import { Fixtures, Prediction, Predictions, User, Users, Venue } from '../../interfaces/main';
import RouteContext, { Route } from '../context/RouteContext';
import { classNames } from '../lib/utils/reactHelper';

const stadiumImageURL = (venue: Venue) => `/stadiums/${venue.city.toLocaleLowerCase().replace(/\s/g, '')}.webp`;

const UserGuess = ({ user, guess }: { user: User; guess: Prediction }) => {
	const routeInfo = useContext(RouteContext)!;

	const { setRoute } = routeInfo;

	return (
		<div
			className={classNames(
				'text-light flex flex-row items-center m-2 rounded p-3 bg-blue',
				'cursor-pointer hover:bg-opacity-50'
			)}
			onClick={() => setRoute({ page: Route.Predictions, data: user.uid })}>
			<span className="text-xs text-left flex flex-row items-center mr-8">
				{user?.photoURL && <img className="object-cover h-8 w-8 rounded-full mr-2" src={user?.photoURL} />}
				<span>{user?.displayName}</span>
			</span>

			<div className="flex flex-row items-center justify-end w-4 font-bold">
				<span className="mr-2">{guess.home}</span>
			</div>

			<span className="">-</span>

			<div className="flex flex-row items-center justify-start w-4 font-bold">
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
	gameID,
}: {
	fixtures: Fixtures;
	predictions: Predictions;
	updatePrediction: Function;
	users: Users;
	gameID: number;
}) => {
	const userInfo = useContext(UserContext);

	const sortedFixtures = Object.values(fixtures).sort((a, b) => a.fixture.timestamp - b.fixture.timestamp);

	const game = gameID ? fixtures[gameID] : sortedFixtures[0];

	if (!game) return <></>;

	const gamePredictions = predictions?.[game.fixture?.id] ?? {};

	return (
		<main className="flex flex-col justify-center select-none text-light m-8 md:mx-24 p-8 shadow-pop rounded-md bg-dark relative">
			{!gameID && <p className="text-3xl mb-2">Next Game</p>}
			{gameID && <p className="text-3xl mb-2">{game.league?.round}</p>}

			<LiveGame gameID={game.fixture?.id} key={game.fixture?.id} />

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