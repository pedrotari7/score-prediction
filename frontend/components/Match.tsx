import type { Fixture } from '../../interfaces/main';
import { isGameFinished } from '../../shared/utils';
import useCompetition from '../hooks/useCompetition';
import { classNames, formatGameDate } from '../lib/utils/reactHelper';
import Flag from './Flag';

const Match = ({
	game,
	className = '',
	showTeamNames = false,
}: {
	game: Fixture;
	className?: string;
	showTeamNames?: boolean;
}) => {
	const { gcc } = useCompetition();

	return (
		<div
			className={classNames(
				gcc('text-light'),
				'flex select-none flex-row items-center justify-evenly rounded p-2',
				className
			)}
		>
			<div
				className={classNames(
					'flex flex-row items-center justify-end',
					showTeamNames ? 'w-4/12 sm:w-5/12' : 'w-2/12 sm:w-5/12'
				)}
			>
				{showTeamNames && (
					<div className='flex flex-col items-center gap-0.5 sm:hidden'>
						<Flag team={game?.teams.home} />
						<span className='text-center text-[10px] leading-tight opacity-70'>
							{game?.teams.home.name}
						</span>
					</div>
				)}
				<span className='mr-2 hidden text-right sm:block'>{game?.teams.home.name}</span>
				<div className={classNames('flex items-center justify-center', showTeamNames ? 'hidden sm:flex' : '')}>
					<Flag team={game?.teams.home} />
				</div>
			</div>

			{!isGameFinished(game) && (
				<span className={classNames('text-center text-xs', showTeamNames ? 'w-4/12' : 'w-6/12 sm:w-4/12')}>
					{formatGameDate(game?.fixture.date, true)}
				</span>
			)}

			{isGameFinished(game) && (
				<span className={classNames('text-center font-bold', showTeamNames ? 'w-4/12' : 'w-6/12 sm:w-4/12')}>
					<span>{game.goals.home}</span>
					<span className='mx-2'>-</span>
					<span>{game.goals.away}</span>
				</span>
			)}

			<div
				className={classNames(
					'flex flex-row items-center justify-start',
					showTeamNames ? 'w-4/12 sm:w-5/12' : 'w-2/12 sm:w-5/12'
				)}
			>
				<div className={classNames('flex items-center justify-center', showTeamNames ? 'hidden sm:flex' : '')}>
					<Flag team={game?.teams.away} />
				</div>
				<span className='ml-2 hidden text-left sm:block'>{game?.teams.away.name}</span>
				{showTeamNames && (
					<div className='flex flex-col items-center gap-0.5 sm:hidden'>
						<Flag team={game?.teams.away} />
						<span className='text-center text-[10px] leading-tight opacity-70'>
							{game?.teams.away.name}
						</span>
					</div>
				)}
			</div>
		</div>
	);
};

export default Match;
