import Image from 'next/image';
import { useState } from 'react';
import type {
	Competition,
	Fixture,
	Fixtures,
	Predictions,
	Standings,
	User,
	UpdatePrediction,
} from '../../interfaces/main';
import { getStageBoostInfo, isGameFinished, isGameStarted, isNum } from '../../shared/utils';
import useCompetition from '../hooks/useCompetition';
import useNoSpoilers from '../hooks/useNoSpoilers';
import { useAuth } from '../lib/auth';
import { classNames } from '../lib/utils/reactHelper';
import { useTournamentStore } from '../store/tournamentStore';
import Game, { DebugCountdowns } from './Game';
import Panel from './Panel';
import PredictedGroups from './PredictedGroups';
import RefreshComp from './RefreshComp';
import { UserScores } from './UserScores';

const EMPTY_BOOSTS: number[] = [];

const StageBoostBadge = ({
	round,
	uid,
	competition,
	fixtures,
}: {
	round: string;
	uid: string;
	competition: Competition;
	fixtures: Fixtures;
}) => {
	const userBoosts = useTournamentStore(s => s.boosts?.[uid]) ?? EMPTY_BOOSTS;
	const { max, remaining } = getStageBoostInfo(competition, round, userBoosts, fixtures);
	if (max <= 0 || remaining >= max) return null;
	return (
		<span className='rounded-full bg-indigo-500 px-2 py-0.5 text-xs font-bold'>
			{remaining} boost{remaining !== 1 ? 's' : ''} left
		</span>
	);
};

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
	const { competition } = useCompetition();
	const [showOnlyUnpredicted, setShowOnlyUnpredicted] = useState(false);

	if (!user)
		return (
			<div className='flex h-full items-center justify-center text-3xl text-light'>
				<div className='text-center'>This user hasn&apos;t participated in this competition</div>
			</div>
		);

	const uid = currentUser?.uid;
	const isMyPredictions = uid === user.uid;

	const debugCountdowns = <DebugCountdowns />;

	const needsPrediction = (game: Fixture) => {
		const prediction = predictions?.[game.fixture.id]?.[user.uid];
		return !isGameStarted(game) && !(isNum(prediction?.home) && isNum(prediction?.away));
	};

	const unpredictedGames = isMyPredictions
		? Object.values(fixtures)
				.filter(needsPrediction)
				.sort((a, b) => a.fixture.timestamp - b.fixture.timestamp)
		: [];

	const scrollToNextUnpredicted = () => {
		const next = unpredictedGames[0];
		if (!next) return;
		document.getElementById(`game-${next.fixture.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
	};

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

	const filterUnpredicted = (games: Fixture[]) =>
		showOnlyUnpredicted && isMyPredictions ? games.filter(needsPrediction) : games;

	return (
		<Panel className={classNames('m-8 flex select-none flex-col justify-center rounded-md p-8 shadow-pop')}>
			{debugCountdowns}
			<div className='mb-6 flex flex-col items-center gap-2 text-3xl sm:flex-row'>
				<div className='flex flex-row items-center justify-center'>
					{user?.photoURL && (
						<Image
							className='mr-2 size-8 rounded-full object-cover'
							src={user.photoURL}
							width={32}
							height={32}
							alt=''
						/>
					)}
					{uid !== user.uid && <p>{user.displayName}</p>}
					{uid === user.uid && <p>My Predictions</p>}
				</div>

				<RedactedSpoilers>
					<div className='text-sm'>
						<UserScores user={user} stage='all' />
					</div>
				</RedactedSpoilers>
			</div>

			{isMyPredictions && unpredictedGames.length > 0 && (
				<div className='sticky top-16 z-10 mb-6 flex flex-wrap items-center justify-between gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm shadow-pop sm:text-base'>
					<button onClick={scrollToNextUnpredicted} className='font-bold'>
						{unpredictedGames.length} game{unpredictedGames.length !== 1 ? 's' : ''} need
						{unpredictedGames.length === 1 ? 's' : ''} a prediction — jump to next
					</button>
					<label className='flex items-center gap-2 text-xs sm:text-sm'>
						<input
							type='checkbox'
							checked={showOnlyUnpredicted}
							onChange={e => setShowOnlyUnpredicted(e.target.checked)}
						/>
						Show only unpredicted
					</label>
				</div>
			)}

			{Object.entries(otherStageFixtures)
				.sort(([_, gA], [__, gB]) => gB?.[0]?.fixture.timestamp - gA?.[0]?.fixture.timestamp)
				.map(([round, games], index) => {
					games.sort(sortWithFinishedLast);
					const visibleGames = filterUnpredicted(games);
					if (visibleGames.length === 0) return null;
					return (
						<div key={round} className='mb-6'>
							<div className={classNames('mb-6 flex flex-row items-center justify-between')}>
								<div className='flex items-center gap-2 text-3xl'>
									{round}
									{uid === user.uid && (
										<StageBoostBadge
											round={round}
											uid={uid}
											competition={competition}
											fixtures={fixtures}
										/>
									)}
								</div>
								{index === 0 && <RefreshComp />}
							</div>

							{visibleGames.map(GameFilled)}
						</div>
					);
				})}

			{(() => {
				const visibleGroupStageFixtures = filterUnpredicted(sortedGroupStageFixtures);
				if (showOnlyUnpredicted && isMyPredictions && visibleGroupStageFixtures.length === 0) return null;
				return (
					<div className='flex flex-col'>
						<div className={classNames('mb-6 flex flex-row items-center justify-between')}>
							<div className='text-3xl'>Group Stage</div>
							{Object.keys(otherStageFixtures).length === 0 && <RefreshComp />}
						</div>

						<div className='flex flex-col-reverse md:flex-col'>
							<PredictedGroups
								predictions={predictions}
								fixtures={fixtures}
								standings={standings}
								userID={user.uid}
							/>

							<div className='flex flex-col'>{visibleGroupStageFixtures.map(GameFilled)}</div>
						</div>
					</div>
				);
			})()}
		</Panel>
	);
};

export default FixturesPage;
