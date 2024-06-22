import { MouseEventHandler, ReactNode, useContext, useState } from 'react';
import { Leaderboard, Users } from '../../interfaces/main';
import RouteContext, { Route } from '../context/RouteContext';
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

const Leaderboards = ({ users, leaderboards }: { users: Users; leaderboards: Record<string, Leaderboard> }) => {
	const auth = useAuth();
	const { RedactedSpoilers } = useNoSpoilers();
	const { route, setRoute } = useContext(RouteContext)!;
	const { gcc } = useCompetition();
	const [sortOption, setSortOption] = useState(SortOptions.points);
	const initialLeaderboard = route.data ? (route.data as string) : 'global';

	const [currentLeaderboard, setCurrentLeaderboard] = useState(initialLeaderboard);

	const initialMembers =
		initialLeaderboard === 'global' ? Object.keys(users) : leaderboards[initialLeaderboard]?.members ?? [];

	const [members, setMembers] = useState<string[]>(initialMembers);

	const currentUser = auth.user?.uid;

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
	}) => {
		return (
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
	};

	const hasLeaderboards = Object.keys(leaderboards).length > 0;
	const isGlobalLeaderboard = currentLeaderboard === 'global';

	const sortedUsers = Object.values(users)
		.filter(user => user.score && members.includes(user.uid))
		.sort(
			(a, b) =>
				b.score[sortOption.key] - a.score[sortOption.key] ||
				b.score.points - a.score.points ||
				b.score.exact - a.score.exact ||
				b.score.result - a.score.result ||
				b.score.onescore - a.score.onescore ||
				b.score.groups - a.score.groups ||
				b.score.penalty - a.score.penalty ||
				b.score.fail - a.score.fail
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
						<CreateLeaderboard />
						{!isGlobalLeaderboard && <ShareLeaderboard leaderboardId={currentLeaderboard} />}
					</div>
				</>
			</div>

			<RedactedSpoilers>
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
										<div className='m-2 mr-6 flex size-8 flex-row items-center justify-center text-xl font-bold'>
											<span
												className={classNames(
													gcc('bg-light'),
													gcc('text-dark'),
													'mr-1 flex size-full items-center justify-center rounded-full px-6'
												)}
											>
												{index + 1}
											</span>
										</div>
									</DesktopOnly>
									<MobileOnly>
										<div
											className={classNames(
												gcc('bg-light'),
												gcc('text-dark'),
												'absolute -left-0 top-0 w-12 rounded-md text-center font-bold'
											)}
										>
											<span className='p-3'>{index + 1}</span>
										</div>
									</MobileOnly>
									<div className='mb-2 flex flex-row flex-wrap items-center justify-center sm:mb-0'>
										<img
											className='mr-2 size-8 rounded-full object-cover sm:mr-6 sm:size-12'
											src={user.photoURL}
										/>
										<span className='text-center font-bold sm:text-2xl'>{user.displayName}</span>
									</div>
								</div>
								<RedactedSpoilers>
									<UserScores user={user} />
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
