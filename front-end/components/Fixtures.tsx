import { classNames } from '../lib/utils/reactHelper';
import Game from './Game';
import PredictedGroups from './PredictedGroups';

export interface Prediction {
	home: string;
	away: string;
}

export interface Predictions {
	[key: string]: Record<string, Prediction>;
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
	fixture: FixtureData;
	teams: Teams;
	league: League;
}

export interface Fixtures {
	[key: string]: Fixture;
}

const FixturesPage = ({
	fixtures,
	predictions,
	updatePrediction,
	standings,
}: {
	fixtures: Fixtures;
	predictions: Predictions;
	updatePrediction: Function;
	standings: [string, any][];
}) => {
	return (
		<main
			className={classNames(
				'flex flex-col justify-center select-none text-light m-8 p-8 shadow-pop rounded-md bg-dark',
				'mx-2 md:mx-24 lg:mx-48'
			)}>
			<p className="text-4xl mb-2">Predictions</p>

			<div className="flex flex-col-reverse md:flex-col">
				<PredictedGroups predictions={predictions} fixtures={fixtures} standings={standings} />

				<div className="flex flex-col">
					{Object.values(fixtures).map((game, index) => (
						<Game
							predictions={predictions}
							gameID={game.fixture?.id}
							updatePrediction={(update: Prediction) => updatePrediction(update, game.fixture?.id)}
							key={index}
						/>
					))}
				</div>
			</div>
		</main>
	);
};

export default FixturesPage;
