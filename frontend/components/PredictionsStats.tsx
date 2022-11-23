import React, { useContext } from 'react';
import { Fixture, GamePredictions } from '../../interfaces/main';
import { getOutcome, isGameFinished, isGameStarted } from '../../shared/utils';
import CompetitionContext from '../context/CompetitionContext';
import { classNames, getCompetitionClass } from '../lib/utils/reactHelper';
import Flag from './Flag';

const PredictionsStats = ({ game, gamePredictions }: { game: Fixture; gamePredictions: GamePredictions }) => {
	const competition = useContext(CompetitionContext);
	const gcc = (p: string) => getCompetitionClass(p, competition);

	if (!game || !isGameStarted(game)) return <></>;

	const outcomes = Object.entries(gamePredictions).reduce(
		(acc, [_, prediction]) => {
			const outcome = getOutcome(prediction);
			if (!outcome) return acc;
			return { ...acc, [outcome]: acc[outcome] + 1 };
		},
		{ winH: 0, winA: 0, draw: 0 }
	);

	const TickIcon = () => <img className='mx-1 h-7 w-7 p-1' src='/tick.svg' />;

	const result = getOutcome(game.goals);
	const finished = isGameFinished(game);

	return (
		<div>
			{isGameStarted(game) && (
				<div className='mt-6'>
					<div className='mb-4 text-xl'>Stats</div>
					<div className='flex flex-row flex-wrap'>
						<div className='flex flex-row flex-wrap items-center justify-start gap-4'>
							<div
								className={classNames(
									gcc('bg-blue'),
									'flex flex-row items-center justify-center gap-2 rounded-md p-2 shadow-pop'
								)}
							>
								<Flag team={game?.teams.home} />
								<span className='hidden text-xl sm:block'>{game?.teams.home.name}</span>
								<span className='text-xl font-bold'>{outcomes.winH}</span>
								{finished && result === 'winH' && <TickIcon />}
							</div>
							<div
								className={classNames(
									gcc('bg-blue'),
									'flex flex-row items-center justify-center gap-2 rounded-md p-2 shadow-pop'
								)}
							>
								<Flag team={game?.teams.away} />
								<span className='hidden text-xl sm:block'>{game?.teams.away.name}</span>
								<span className='text-xl font-bold'>{outcomes.winA}</span>
								{finished && result === 'winA' && <TickIcon />}
							</div>

							<div
								className={classNames(
									gcc('bg-blue'),
									'flex flex-row items-center justify-center gap-2 rounded-md p-2 shadow-pop'
								)}
							>
								<span className='text-xl'> Draw</span>
								<span className='text-xl font-bold'>{outcomes.draw}</span>
								{finished && result === 'draw' && <TickIcon />}
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default PredictionsStats;
