import { Fixture, Fixtures, Predictions, Standings, User, UpdatePrediction } from '../../interfaces/main';
import { isGameFinished } from '../../shared/utils';
import useCompetition from '../hooks/useCompetition';
import useNoSpoilers from '../hooks/useNoSpoilers';
import { useAuth } from '../lib/auth';
import { classNames } from '../lib/utils/reactHelper';
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
	const { RedactedSpoilers } = useNoSpoilers();
	const { gcc } = useCompetition();

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
			updatePrediction={updatePrediction}
			userID={user.uid}
			key={index}
		/>
	);

	return (
		<div
			className={classNames(
				gcc('text-light'),
				'm-8 flex select-none flex-col justify-center rounded-md p-8 shadow-pop',
				'mx-2 md:mx-24 lg:mx-48'
			)}
		>
			<div className='mb-6 flex flex-col items-center gap-2 text-3xl sm:flex-row'>
				<div className='flex flex-row items-center justify-center'>
					<img className='mr-2 h-8 w-8 rounded-full object-cover' src={user?.photoURL} />
					{uid !== user.uid && <p>{user.displayName}</p>}
					{uid === user.uid && <p>My Predictions</p>}
				</div>

				<RedactedSpoilers>
					<div className='text-sm'>
						<UserScores user={user} />
					</div>
				</RedactedSpoilers>
			</div>

			{Object.entries(otherStageFixtures)
				.sort(([_, gA], [__, gB]) => gB?.[0]?.fixture.timestamp - gA?.[0]?.fixture.timestamp)
				.map(([round, games], index) => {
					games.sort(sortWithFinishedLast);
					return (
						<div key={round} className='mb-6'>
							<div className={classNames('mb-6 flex flex-row items-center justify-between')}>
								<div className='text-3xl'>{round}</div>
								{index === 0 && <RefreshComp />}
							</div>

							{games.map(GameFilled)}
						</div>
					);
				})}

			<div className='flex flex-col'>
				<div className={classNames('mb-6 flex flex-row items-center justify-between')}>
					<div className='text-3xl'>Group Stage</div>
					{!otherStageFixtures && <RefreshComp />}
				</div>

				<div className='flex flex-col-reverse md:flex-col'>
					<PredictedGroups
						predictions={predictions}
						fixtures={fixtures}
						standings={standings}
						userID={user.uid}
					/>

					<div className='flex flex-col'>{sortedGroupStageFixtures.map(GameFilled)}</div>
				</div>
			</div>
		</div>
	);
};

export default FixturesPage;
