import { useContext } from 'react';
import { Fixture, Fixtures, Prediction, Predictions, Standings, User, UpdatePrediction } from '../../interfaces/main';
import { isGameFinished } from '../../shared/utils';
import CompetitionContext from '../context/CompetitionContext';
import { useAuth } from '../lib/auth';
import { classNames, getCompetitionClass } from '../lib/utils/reactHelper';
import Game from './Game';
import PredictedGroups from './PredictedGroups';
import RefreshComp from './RefreshComp';
import { UserScores } from './UserScores';

const FixturesPage = ({
	fixtures,
	predictions,
	updatePrediction,
	standings,
	user,
}: {
	fixtures: Fixtures;
	predictions: Predictions;
	updatePrediction: UpdatePrediction;
	standings: Standings;
	user: User;
}) => {
	const { user: currentUser } = useAuth();

	const uid = currentUser?.uid;

	const isGroupStage = (f: Fixture) => f.league.round.includes('Group');

	const groupStageFixtures = Object.values(fixtures).filter((f: Fixture) => isGroupStage(f));

	const otherStageFixtures = Object.values(fixtures)
		.filter((f: Fixture) => !isGroupStage(f))
		.reduce<Record<string, Fixture[]>>((rounds, f: Fixture) => {
			const round = f.league.round;

			if (!(round in rounds)) rounds[round] = [];

			rounds[round].push(f);

			return rounds;
		}, {});

	const sortWithFinishedLast = (a: Fixture, b: Fixture) => {
		if (isGameFinished(a) && isGameFinished(b)) return b.fixture.timestamp - a.fixture.timestamp;
		if (isGameFinished(a) && !isGameFinished(b)) return 1;
		if (!isGameFinished(a) && isGameFinished(b)) return -1;
		return a.fixture.timestamp - b.fixture.timestamp;
	};

	const sortedGroupStageFixtures = groupStageFixtures.sort(sortWithFinishedLast);

	const GameFilled = (game: Fixture, index: number) => (
		<Game
			predictions={predictions}
			gameID={game.fixture?.id}
			updatePrediction={async (update: Prediction) => await updatePrediction(update, game.fixture?.id)}
			userID={user.uid}
			key={index}
		/>
	);

	const competition = useContext(CompetitionContext);

	const gcc = (p: string) => getCompetitionClass(p, competition);

	return (
		<div
			className={classNames(
				gcc('text-light'),
				'flex flex-col justify-center select-none m-8 p-8 shadow-pop rounded-md',
				'mx-2 md:mx-24 lg:mx-48'
			)}>
			<div className="text-3xl mb-6 flex flex-col sm:flex-row items-center gap-2">
				<div className="flex flex-row items-center justify-center">
					<img className="object-cover h-8 w-8 rounded-full mr-2" src={user?.photoURL} />
					{uid !== user.uid && <p>{user.displayName}</p>}
					{uid === user.uid && <p>My Predictions</p>}
				</div>
				<div className="text-sm">
					<UserScores user={user} />
				</div>
			</div>

			{Object.entries(otherStageFixtures)
				.sort(([_, gA], [__, gB]) => gB?.[0]?.fixture.timestamp - gA?.[0]?.fixture.timestamp)
				.map(([round, games]) => {
					games.sort(sortWithFinishedLast);
					return (
						<div key={round} className="mb-6">
							<div className="text-3xl mb-6">{round}</div>
							{games.map(GameFilled)}
						</div>
					);
				})}

			<div className="flex flex-col">
				<div className={classNames('flex flex-row items-center justify-between mb-6')}>
					<div className="text-3xl">Group Stage</div>
					<RefreshComp />
				</div>

				<div className="flex flex-col-reverse md:flex-col">
					<PredictedGroups
						predictions={predictions}
						fixtures={fixtures}
						standings={standings}
						userID={user.uid}
					/>

					<div className="flex flex-col">{sortedGroupStageFixtures.map(GameFilled)}</div>
				</div>
			</div>
		</div>
	);
};

export default FixturesPage;
