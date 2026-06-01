import Image from 'next/image';
import type { MouseEventHandler, ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import type { Leaderboard, Users } from '../../interfaces/main';
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
	points: { key: 'points', text: 'Points', color: ' bg-gray-700' },
	exact: { key: 'exact', text: 'Exact', color: 'bg-green-600' },
	result: { key: 'result', text: 'Correct Result', color: 'bg-yellow-600' },
	onescore: { key: 'onescore', text: 'Team Score', color: 'bg-pink-600' },
	penalty: { key: 'penalty', text: 'Penalties', color: 'bg-gray-500' },
	fail: { key: 'fail', text: 'Fail', color: 'bg-red-600' },
	groups: { key: 'groups', text: 'Groups', color: 'bg-purple-700' },
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
		className={
			classNames(
				'm-2 cursor-pointer select-none rounded-md p-2 text-xs sm:text-lg',
				'border-2 hover:border-2 hover:border-gray-400',
				active ? 'border-white' : 'border-transparent',
				className
			) +
			' ' +
			// eslint-disable-next-line tailwindcss/migration-from-tailwind-2
			classNames('hover:bg-opacity-50')
		}
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
	const { gcc } = useCompetition();
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
				.filter(user => user.score && user.score[stage] && members.includes(user.uid))
				.sort(
					(a, b) =>
						b.score[stage][sortOption.key] - a.score[stage][sortOption.key] ||
						b.score[stage].points - a.score[stage].points ||
						b.score[stage].exact - a.score[stage].exact ||
						b.score[stage].result - a.score[stage].result ||
						b.score[stage].onescore - a.score[stage].onescore ||
						b.score[stage].groups - a.score[stage].groups ||
						b.score[stage].penalty - a.score[stage].penalty ||
						b.score[stage].fail - a.score[stage].fail
				),
		[users, members, stage, sortOption]
	);

	return (
		<Panel className={classNames('m-3 select-none rounded-md p-3 shadow-pop sm:mx-[5%] sm:p-6')}>
			<div className={classNames('mb-4 flex flex-row items-center justify-between')}>
				<div className='text-2xl font-bold'>Leaderboards</div>
				<RefreshComp />
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
						{Object.values(SortOptions).map(option => (
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
						<div key={index} className='relative'>
							<div
								className={
									classNames(
										currentUser === user.uid ? 'border-white' : 'border-transparent',
										'flex cursor-pointer flex-col items-center justify-between border-8 sm:flex-row',
										gcc('bg-blue'),
										`mx-1 my-4 rounded-md p-3 sm:mx-[5%] md:mx-[5%] lg:mx-[20%]`
									) +
									' ' +
									// eslint-disable-next-line tailwindcss/migration-from-tailwind-2
									classNames('hover:bg-opacity-50')
								}
								onClick={() => setRoute({ page: Route.Predictions, data: user.uid })}
							>
								<div className='mb-0 flex flex-col flex-wrap items-center justify-evenly sm:mr-4 sm:flex-row sm:justify-start'>
									<DesktopOnly>
										<div className='m-2 mr-6 flex flex-row items-center gap-2 text-xl font-bold'>
											<span
												className={classNames(
													gcc('bg-light'),
													gcc('text-dark'),
													'flex size-8 items-center justify-center rounded-full px-6'
												)}
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
											className={classNames(
												gcc('bg-light'),
												gcc('text-dark'),
												'absolute -left-0 top-0 flex flex-row items-center gap-1 rounded-md px-2 text-center font-bold'
											)}
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
