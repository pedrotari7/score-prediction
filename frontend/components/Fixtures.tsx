import { Fixtures, Prediction, Predictions, Standings, User } from '../../interfaces/main';
import { useAuth } from '../lib/auth';
import { classNames } from '../lib/utils/reactHelper';
import Game from './Game';
import PredictedGroups from './PredictedGroups';

const FixturesPage = ({
	fixtures,
	predictions,
	updatePrediction,
	standings,
	user,
}: {
	fixtures: Fixtures;
	predictions: Predictions;
	updatePrediction: Function;
	standings: Standings;
	user: User;
}) => {
	const { user: currentUser } = useAuth();

	const uid = currentUser?.uid;

	const sortedFixtures = Object.values(fixtures).sort((a, b) => a.fixture.timestamp - b.fixture.timestamp);

	return (
		<main
			className={classNames(
				'flex flex-col justify-center select-none text-light m-8 p-8 shadow-pop rounded-md bg-dark',
				'mx-2 md:mx-24 lg:mx-48'
			)}>
			<div className="text-3xl mb-6 flex flex-row items-center">
				<img className="object-cover h-8 w-8 rounded-full mr-2" src={user?.photoURL} />
				{uid !== user.uid && <p>{user.displayName}</p>}
				{uid === user.uid && <p>My Predictions</p>}
			</div>

			<div className="flex flex-col-reverse md:flex-col">
				<PredictedGroups
					predictions={predictions}
					fixtures={fixtures}
					standings={standings}
					userID={user.uid}
				/>

				<div className="flex flex-col">
					{sortedFixtures.map((game, index) => (
						<Game
							predictions={predictions}
							gameID={game.fixture?.id}
							updatePrediction={(update: Prediction) => updatePrediction(update, game.fixture?.id)}
							key={index}
							userID={user.uid}
						/>
					))}
				</div>
			</div>
		</main>
	);
};

export default FixturesPage;
