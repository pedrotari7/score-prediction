import Image from 'next/image';
import type { MouseEventHandler, ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import type { Leaderboard, Users } from '../../interfaces/main';
import { DEFAULT_USER_RESULT, hasBoosts, isGameFinished } from '../../shared/utils';
import { Route, useTournamentStore } from '../store/tournamentStore';
import { classNames } from '../lib/utils/reactHelper';
import DesktopOnly from './DesktopOnly';
import MobileOnly from './MobileOnly';
import RefreshComp from './RefreshComp';
import { UserScores } from './UserScores';
import CreateLeaderboard from './CreateLeaderboard';
import SelectLeaderboard from './SelectLeaderboard';
import ShareLeaderboard from './ShareLeaderboard';
import useNoSpoilers from '../hooks/useNoSpoilers';
import useCompetition from '../hooks/useCompetition';
import Panel from './Panel';
import { useAuth } from '../lib/auth';
import SelectStage from './SelectStage';

interface SortOption {
	key: string;
	text: string;
	color: string;
}

const SortOptions: Record<string, SortOption> = {
	exact: { key: 'exact', text: 'Exact', color: 'bg-green-600' },
	result: { key: 'result', text: 'Correct Result', color: 'bg-yellow-600' },
	onescore: { key: 'onescore', text: 'Team Score', color: 'bg-pink-600' },
	fail: { key: 'fail', text: 'Fail', color: 'bg-red-600' },
	groups: { key: 'groups', text: 'Groups', color: 'bg-purple-700' },
	upset: { key: 'upset', text: 'Upsets', color: 'bg-cyan-700' },
	boost: { key: 'boost', text: 'Boosts', color: 'bg-indigo-500' },
	penalty: { key: 'penalty', text: 'Penalties', color: 'bg-gray-500' },
	points: { key: 'points', text: 'Points', color: ' bg-gray-700' },
};

const FilterOption = ({
	children,
	className,
	active,
	onClick,
}: {
	children: ReactNode;
	className: string;
	active: boolean;
	onClick: MouseEventHandler<HTMLDivElement>;
}) => (
	<div
		onClick={onClick}
		className={classNames(
			'm-1 cursor-pointer select-none rounded-full px-3 py-1.5 text-xs font-semibold transition-all sm:text-sm',
			'ring-2 ring-transparent hover:ring-white/40',
			active ? 'scale-105 shadow-md ring-white/80' : 'opacity-50 hover:opacity-100',
			className
		)}
	>
		{children}
	</div>
);

const Leaderboards = ({
	users,
	leaderboards,
	setLeaderboards,
}: {
	users: Users;
	leaderboards: Record<string, Leaderboard>;
	setLeaderboards: (leaderboards: Record<string, Leaderboard>) => void;
}) => {
	const auth = useAuth();
	const { RedactedSpoilers } = useNoSpoilers();
	const route = useTournamentStore(s => s.route);
	const setRoute = useTournamentStore(s => s.setRoute);
	const { competition } = useCompetition();
	const fixtures = useTournamentStore(s => s.fixtures);
	const finalGame = Object.values(fixtures).find(f => f.league.round === 'Final');
	const isTournamentFinished = !!finalGame && isGameFinished(finalGame);
	const [sortOption, setSortOption] = useState(SortOptions.points);
	const initialLeaderboard = route.data ? (route.data as string) : 'global';

	const [currentLeaderboard, setCurrentLeaderboard] = useState(initialLeaderboard);

	const initialMembers =
		initialLeaderboard === 'global' ? Object.keys(users) : (leaderboards[initialLeaderboard]?.members ?? []);

	const [members, setMembers] = useState<string[]>(initialMembers);
	const [stage, setCurrentStage] = useState<string>('all');

	const currentUser = auth.user?.uid;

	const hasLeaderboards = Object.keys(leaderboards).length > 0;
	const isGlobalLeaderboard = currentLeaderboard === 'global';

	const stages = useMemo(
		() =>
			Object.values(users).reduce((stages, user) => {
				if (user.score) {
					Object.keys(user.score).forEach(stage => stages.add(stage));
				}
				return stages;
			}, new Set<string>()),
		[users]
	);

	const sortedUsers = useMemo(
		() =>
			Object.values(users)
				.filter(user => members.includes(user.uid))
				.sort((a, b) => {
					const aScore = a.score?.[stage] ?? DEFAULT_USER_RESULT;
					const bScore = b.score?.[stage] ?? DEFAULT_USER_RESULT;
					return (
						bScore[sortOption.key] - aScore[sortOption.key] ||
						bScore.points - aScore.points ||
						bScore.exact - aScore.exact ||
						bScore.result - aScore.result ||
						bScore.onescore - aScore.onescore ||
						bScore.groups - aScore.groups ||
						bScore.penalty - aScore.penalty ||
						bScore.fail - aScore.fail
					);
				}),
		[users, members, stage, sortOption]
	);

	return (
		<Panel className={classNames('m-3 select-none p-3 sm:mx-[5%] sm:p-6')}>
			<div className={classNames('mb-4 flex flex-row items-center justify-between')}>
				<div className='text-2xl font-bold'>Leaderboards</div>
				<div className='flex items-center gap-2'>
					{isTournamentFinished && (
						<button
							onClick={() => setRoute({ page: Route.Recap })}
							className='rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-1.5 text-xs font-bold text-white transition-transform hover:scale-105'
						>
							My Recap
						</button>
					)}
					<RefreshComp />
				</div>
			</div>

			<div className='mb-4 flex flex-col items-center gap-4 sm:flex-row'>
				<>
					{hasLeaderboards && (
						<SelectLeaderboard
							users={users}
							leaderboards={leaderboards}
							currentLeaderboard={currentLeaderboard}
							setCurrentLeaderboard={setCurrentLeaderboard}
							setMembers={setMembers}
						/>
					)}

					<div className='flex flex-row flex-wrap justify-center gap-2'>
						<CreateLeaderboard
							onCreated={(id, updatedLeaderboards) => {
								setLeaderboards(updatedLeaderboards);
								setCurrentLeaderboard(id);
								setMembers(updatedLeaderboards[id]?.members ?? []);
							}}
						/>
						{!isGlobalLeaderboard && (
							<ShareLeaderboard
								leaderboardId={currentLeaderboard}
								joinToken={leaderboards[currentLeaderboard]?.joinToken}
							/>
						)}
					</div>
				</>
			</div>

			<RedactedSpoilers>
				<div className='flex flex-col items-center'>
					<div className='mb-6 flex flex-row flex-wrap items-center justify-center font-bold sm:justify-center'>
						{Object.values(SortOptions)
							.filter(o => o.key !== 'upset' || (competition.points.upset ?? 0) > 0)
							.filter(o => o.key !== 'boost' || hasBoosts(competition))
							.map(option => (
								<FilterOption
									key={option.key}
									active={option.text === sortOption.text}
									className={option.color}
									onClick={() => setSortOption(option)}
								>
									{option.text}
								</FilterOption>
							))}
					</div>
					<SelectStage setCurrentStage={setCurrentStage} currentStage={stage} stages={[...stages.values()]} />
				</div>
			</RedactedSpoilers>

			<div className='flex flex-col justify-center'>
				{sortedUsers.map((user, index) => {
					return (
						<div
							key={index}
							className='relative animate-fade-slide-up'
							style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}
						>
							<div
								className={classNames(
									'glass-card flex cursor-pointer flex-col items-center justify-between rounded-2xl border-2 p-3 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover sm:flex-row',
									currentUser === user.uid ? '' : 'border-transparent',
									'mx-1 my-4 sm:mx-[5%] md:mx-[5%] lg:mx-[20%]'
								)}
								style={currentUser === user.uid ? { borderColor: competition.color } : undefined}
								onClick={() => setRoute({ page: Route.Predictions, data: user.uid })}
							>
								<div className='mb-0 flex flex-col flex-wrap items-center justify-evenly sm:mr-4 sm:flex-row sm:justify-start'>
									<DesktopOnly>
										<div className='m-2 mr-6 flex flex-row items-center gap-2 text-xl font-bold'>
											<span
												className='flex size-8 items-center justify-center rounded-full text-white shadow-md'
												style={{
													background: `linear-gradient(135deg, ${competition.color}, ${competition.color}aa)`,
												}}
											>
												{index + 1}
											</span>
											{currentUser && currentUser !== user.uid && (
												<button
													onClick={e => {
														e.stopPropagation();
														setRoute({ page: Route.Compare, data: user.uid });
													}}
													className='rounded-md p-1 hover:bg-gray-600'
													title='Compare predictions'
												>
													<ArrowsRightLeftIcon className='size-5' />
												</button>
											)}
										</div>
									</DesktopOnly>
									<MobileOnly>
										<div
											className='absolute -left-0 top-0 flex flex-row items-center gap-1 rounded-full px-2 text-center font-bold text-white shadow-md'
											style={{
												background: `linear-gradient(135deg, ${competition.color}, ${competition.color}aa)`,
											}}
										>
											<span className='p-1'>{index + 1}</span>
											{currentUser && currentUser !== user.uid && (
												<button
													onClick={e => {
														e.stopPropagation();
														setRoute({ page: Route.Compare, data: user.uid });
													}}
													className='rounded-md p-1'
													title='Compare predictions'
												>
													<ArrowsRightLeftIcon className='size-4' />
												</button>
											)}
										</div>
									</MobileOnly>
									<div className='mb-2 flex flex-row flex-wrap items-center justify-center sm:mb-0'>
										<Image
											className='mr-2 size-8 rounded-full object-cover sm:mr-6 sm:size-12'
											src={user.photoURL}
											width={48}
											height={48}
											alt=''
										/>
										<span className='text-center font-bold sm:text-2xl'>{user.displayName}</span>
									</div>
								</div>
								<RedactedSpoilers>
									<UserScores user={user} stage={stage} highlightKey={sortOption.key} />
								</RedactedSpoilers>
							</div>
						</div>
					);
				})}
			</div>
		</Panel>
	);
};

export default Leaderboards;
