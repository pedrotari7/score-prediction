import Image from 'next/image';
import { useMemo } from 'react';
import type { Fixture, Fixtures, Predictions, UserResult, Users } from '../../interfaces/main';
import {
	calculateUserResultPoints,
	DEFAULT_USER_RESULT,
	getResult,
	isGameFinished,
	isGameStarted,
	joinResults,
} from '../../shared/utils';
import useCompetition from '../hooks/useCompetition';
import useNoSpoilers from '../hooks/useNoSpoilers';
import { classNames, formatScore, getCurrentDate } from '../lib/utils/reactHelper';
import { Route, useTournamentStore } from '../store/tournamentStore';
import Flag from './Flag';
import Panel from './Panel';
import ResultContainer from './ResultContainer';

const HeadToHead = ({
	fixtures,
	predictions,
	users,
	compareUid,
}: {
	fixtures: Fixtures;
	predictions: Predictions;
	users: Users;
	compareUid: string;
}) => {
	const { gcc, competition } = useCompetition();
	const { RedactedSpoilers } = useNoSpoilers();
	const myUid = useTournamentStore(s => s.uid);
	const setRoute = useTournamentStore(s => s.setRoute);

	const userA = users[myUid];
	const userB = users[compareUid];

	const stages = useMemo(() => {
		const sortedFixtures = Object.values(fixtures).sort((a, b) => a.fixture.timestamp - b.fixture.timestamp);

		const grouped: Record<string, Fixture[]> = {};
		for (const game of sortedFixtures) {
			const stage = game.league.round.includes('Group') ? 'Group Stage' : game.league.round;
			if (!grouped[stage]) grouped[stage] = [];
			grouped[stage].push(game);
		}
		return grouped;
	}, [fixtures]);

	const tally = useMemo(() => {
		let tallyA: UserResult = { ...DEFAULT_USER_RESULT };
		let tallyB: UserResult = { ...DEFAULT_USER_RESULT };

		for (const game of Object.values(fixtures)) {
			if (!isGameFinished(game)) continue;
			const predA = predictions[game.fixture.id]?.[myUid];
			const predB = predictions[game.fixture.id]?.[compareUid];
			if (predA) tallyA = joinResults(tallyA, getResult(predA, game));
			if (predB) tallyB = joinResults(tallyB, getResult(predB, game));
		}
		tallyA.groups = userA?.score?.['all']?.groups ?? 0;
		tallyB.groups = userB?.score?.['all']?.groups ?? 0;
		tallyA.points = calculateUserResultPoints(tallyA, competition);
		tallyB.points = calculateUserResultPoints(tallyB, competition);
		return { a: tallyA, b: tallyB };
	}, [fixtures, predictions, myUid, compareUid, competition, userA?.score, userB?.score]);

	if (!userA || !userB) return <div className='p-8 text-center text-xl text-white'>User not found</div>;

	const now = getCurrentDate().getTime();

	const TallyRow = ({ label, color, keyName }: { label: string; color: string; keyName: keyof UserResult }) => {
		const valA = tally.a[keyName];
		const valB = tally.b[keyName];
		const better = valA > valB ? 'a' : valB > valA ? 'b' : 'tie';
		return (
			<div className='flex flex-row items-center gap-2 text-sm'>
				<span className={classNames('w-8 text-center font-bold', better === 'a' ? 'text-white' : 'opacity-40')}>
					{valA}
				</span>
				<div className={classNames('flex-1 rounded-md px-2 py-1 text-center text-xs font-bold', color)}>
					{label}
				</div>
				<span className={classNames('w-8 text-center font-bold', better === 'b' ? 'text-white' : 'opacity-40')}>
					{valB}
				</span>
			</div>
		);
	};

	const GameRow = ({ game }: { game: Fixture }) => {
		const gameId = game.fixture.id;
		const predA = predictions[gameId]?.[myUid];
		const predB = predictions[gameId]?.[compareUid];
		const gameDate = new Date(game.fixture.date).getTime();
		const isInPast = now >= gameDate;
		const started = isGameStarted(game);

		return (
			<div
				className={classNames(
					gcc('bg-dark'),
					'flex flex-row items-center justify-between rounded-md p-3 text-sm'
				)}
			>
				<div className='flex w-3/12 items-center justify-center'>
					{predA && isInPast ? (
						<ResultContainer prediction={predA} game={game} className='px-2 py-1' showEarnedPoints={false}>
							<span className='font-bold'>
								{formatScore(predA.home)} - {formatScore(predA.away)}
							</span>
						</ResultContainer>
					) : predA ? (
						<span className='font-bold'>
							{formatScore(predA.home)} - {formatScore(predA.away)}
						</span>
					) : (
						<span className='opacity-40'>-</span>
					)}
				</div>

				<div className='flex w-6/12 items-center gap-2'>
					<div className='flex flex-1 flex-col items-center gap-0.5 sm:flex-row-reverse sm:items-center sm:gap-1'>
						<Flag team={game.teams.home} />
						<span className='text-center text-[10px] leading-tight opacity-70 sm:text-right sm:text-xs'>
							{game.teams.home.name}
						</span>
					</div>
					<RedactedSpoilers>
						<>
							{started && (
								<span className='shrink-0 font-bold'>
									{game.goals.home} - {game.goals.away}
								</span>
							)}
							{!started && <span className='shrink-0 text-xs opacity-50'>vs</span>}
						</>
					</RedactedSpoilers>
					<div className='flex flex-1 flex-col items-center gap-0.5 sm:flex-row sm:items-center sm:gap-1'>
						<Flag team={game.teams.away} />
						<span className='text-center text-[10px] leading-tight opacity-70 sm:text-left sm:text-xs'>
							{game.teams.away.name}
						</span>
					</div>
				</div>

				<div className='flex w-3/12 items-center justify-center'>
					{predB && isInPast ? (
						<ResultContainer prediction={predB} game={game} className='px-2 py-1' showEarnedPoints={false}>
							<span className='font-bold'>
								{formatScore(predB.home)} - {formatScore(predB.away)}
							</span>
						</ResultContainer>
					) : predB ? (
						<span className='font-bold'>
							{formatScore(predB.home)} - {formatScore(predB.away)}
						</span>
					) : (
						<span className='opacity-40'>-</span>
					)}
				</div>
			</div>
		);
	};

	return (
		<Panel className={classNames('m-4 select-none rounded-md p-4 shadow-pop sm:m-8 sm:p-8')}>
			<button
				onClick={() => setRoute({ page: Route.Leaderboard })}
				className={classNames(gcc('bg-blue'), 'mb-4 rounded-md px-4 py-2 font-bold hover:opacity-80')}
			>
				Back to Leaderboard
			</button>

			<div className='mb-6 flex flex-row items-center justify-center gap-8'>
				<div className='flex flex-col items-center gap-2'>
					{userA.photoURL && (
						<Image
							className='size-12 rounded-full object-cover'
							src={userA.photoURL}
							width={48}
							height={48}
							alt=''
						/>
					)}
					<span className='font-bold'>{userA.displayName}</span>
				</div>
				<span className='text-2xl font-bold'>vs</span>
				<div className='flex flex-col items-center gap-2'>
					{userB.photoURL && (
						<Image
							className='size-12 rounded-full object-cover'
							src={userB.photoURL}
							width={48}
							height={48}
							alt=''
						/>
					)}
					<span className='font-bold'>{userB.displayName}</span>
				</div>
			</div>

			<div className='mx-auto mb-6 flex w-full max-w-xs flex-col gap-1'>
				<TallyRow label='Exact' color='bg-green-600' keyName='exact' />
				<TallyRow label='Result' color='bg-yellow-600' keyName='result' />
				<TallyRow label='Team Score' color='bg-pink-600' keyName='onescore' />
				<TallyRow label='Fail' color='bg-red-600' keyName='fail' />
				<TallyRow label='Groups' color='bg-purple-700' keyName='groups' />
				<TallyRow label='Penalty' color='bg-gray-500' keyName='penalty' />
				<TallyRow label='Points' color='bg-gray-700' keyName='points' />
			</div>

			{Object.entries(stages).map(([stage, games]) => (
				<div key={stage} className='mb-6'>
					<div className='mb-2 text-lg font-bold'>{stage}</div>
					<div className='flex flex-col gap-2'>
						{games.map(game => (
							<GameRow key={game.fixture.id} game={game} />
						))}
					</div>
				</div>
			))}
		</Panel>
	);
};

export default HeadToHead;
