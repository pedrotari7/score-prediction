import React from 'react';
import Game from './Game';

export interface Prediction {
	home: string;
	away: string;
}

export interface Predictions {
	[key: string]: Prediction;
}

export interface Team {
	id: number;
	name: string;
	logo: string;
	winner: null;
}

export interface Teams {
	away: Team;
	home: Team;
}

export interface Venue {
	city: string;
	id: number;
	name: string;
}

export interface FixtureData {
	id: number;
	date: string;
	periods: Object;
	referee: Object;
	status: Object;
	timestamp: number;
	timezone: string;
	venue: Venue;
}

export interface Fixture {
	predictions: Predictions;
	fixture: FixtureData;
	teams: Teams;
}

export interface Fixtures {
	[key: string]: Fixture;
}

const FixturesPage = ({ fixtures, updatePrediction }: { fixtures: Fixtures; updatePrediction: Function }) => {
	return (
		<main className="flex flex-col justify-center select-none text-light m-8 p-8 shadow-pop rounded-md">
			<p className="text-4xl mb-2">Predictions</p>
			{Object.values(fixtures).map(game => (
				<Game
					gameID={game.fixture.id}
					updatePrediction={(update: Prediction) => updatePrediction(update, game.fixture.id)}
					key={game.fixture.id}
				/>
			))}
		</main>
	);
};

export default FixturesPage;
