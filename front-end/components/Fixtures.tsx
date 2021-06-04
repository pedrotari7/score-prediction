import { Fixtures, Prediction, Predictions, Standings } from '../../interfaces/main';
import { classNames } from '../lib/utils/reactHelper';
import Game from './Game';
import PredictedGroups from './PredictedGroups';

const FixturesPage = ({
	fixtures,
	predictions,
	updatePrediction,
	standings,
}: {
	fixtures: Fixtures;
	predictions: Predictions;
	updatePrediction: Function;
	standings: Standings;
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
