import { DateTime } from 'luxon';
import type { Fixture } from '../../interfaces/main';
import { isGameFinished } from '../../shared/utils';
import useCompetition from '../hooks/useCompetition';
import { classNames } from '../lib/utils/reactHelper';
import Flag from './Flag';

const Match = ({ game, className = '' }: { game: Fixture; className?: string }) => {
	const { gcc } = useCompetition();

	return (
		<div
			className={classNames(
				gcc('text-light'),
				'flex select-none flex-row items-center justify-evenly rounded p-2',
				className
			)}
		>
			<div className='flex w-2/12 flex-row items-center justify-end sm:w-5/12'>
				<span className='mr-2 hidden text-right sm:block'>{game?.teams.home.name}</span>
				<div className='flex items-center justify-center'>
					<Flag team={game?.teams.home} />
				</div>
			</div>

			{!isGameFinished(game) && (
				<span className='w-6/12 text-center text-xs sm:w-4/12'>
					{DateTime.fromISO(game?.fixture.date).toFormat('dd LLL HH:mm ccc')}
				</span>
			)}

			{isGameFinished(game) && (
				<span className='w-6/12 text-center font-bold sm:w-4/12'>
					<span>{game.goals.home}</span>
					<span className='mx-2'>-</span>
					<span>{game.goals.away}</span>
				</span>
			)}

			<div className='flex w-2/12 flex-row items-center justify-start sm:w-5/12'>
				<div className='flex items-center justify-center'>
					<Flag team={game?.teams.away} />
				</div>
				<span className='ml-2 hidden text-left sm:block'>{game?.teams.away.name}</span>
			</div>
		</div>
	);
};

export default Match;
