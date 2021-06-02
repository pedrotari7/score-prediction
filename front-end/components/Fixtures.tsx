import Game from './Game';
import PredictedGroups from './PredictedGroups';

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

export interface League {
	country: string;
	flag: string;
	id: number;
	logo: string;
	name: string;
	round: string;
	season: number;
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
	league: League;
}

export interface Fixtures {
	[key: string]: Fixture;
}

const FixturesPage = ({
	fixtures,
	updatePrediction,
	standings,
}: {
	fixtures: Fixtures;
	updatePrediction: Function;
	standings: [string, any][];
}) => {
	return (
		<main className="flex flex-col justify-center select-none text-light m-8 p-8 shadow-pop rounded-md bg-dark">
			<p className="text-4xl mb-2">Predictions</p>

			<div className="flex flex-col-reverse md:flex-col">
				<PredictedGroups fixtures={fixtures} standings={standings} />

				<div className="flex flex-col">
					{Object.values(fixtures).map(game => (
						<Game
							gameID={game.fixture?.id}
							updatePrediction={(update: Prediction) => updatePrediction(update, game.fixture?.id)}
							key={game.fixture?.id}
						/>
					))}
				</div>
			</div>
		</main>
	);
};

export default FixturesPage;
