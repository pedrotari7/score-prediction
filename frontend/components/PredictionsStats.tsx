import { CheckIcon } from '@heroicons/react/24/outline';
import React from 'react';
import type { Fixture, Prediction, UserResult } from '../../interfaces/main';
import { getOutcome, isGameFinished, isGameStarted, median } from '../../shared/utils';
import useCompetition from '../hooks/useCompetition';
import useNoSpoilers from '../hooks/useNoSpoilers';
import { classNames } from '../lib/utils/reactHelper';
import Flag from './Flag';
import { Circle } from './UserScores';

export type PredictionStatFilter =
	| 'winH'
	| 'winA'
	| 'draw'
	| 'exact'
	| 'result'
	| 'onescore'
	| 'fail'
	| 'upset'
	| 'boost'
	| 'penalty';

const PredictionsStats = ({
	game,
	gamePredictions,
	resultsTally,
	activeFilter,
	onFilterChange,
}: {
	game: Fixture;
	gamePredictions: Prediction[];
	resultsTally: Partial<UserResult>;
	activeFilter?: PredictionStatFilter | null;
	onFilterChange?: (filter: PredictionStatFilter | null) => void;
}) => {
	const { RedactedSpoilers } = useNoSpoilers();
	const { gcc } = useCompetition();

	if (!game || !isGameStarted(game)) return <></>;

	const outcomes = gamePredictions.reduce(
		(acc, prediction) => {
			const outcome = getOutcome(prediction);
			if (!outcome) return acc;
			return { ...acc, [outcome]: acc[outcome] + 1 };
		},
		{ winH: 0, winA: 0, draw: 0 }
	);

	const toggleFilter = (filter: PredictionStatFilter) => {
		onFilterChange?.(activeFilter === filter ? null : filter);
	};

	const statClassName = (filter: PredictionStatFilter) =>
		classNames(
			onFilterChange ? 'cursor-pointer' : '',
			activeFilter === filter ? 'scale-105 ring-2 ring-white' : '',
			activeFilter && activeFilter !== filter ? 'opacity-50' : ''
		);

	const TickIcon = () => <CheckIcon className='size-6 text-green-500' />;

	const result = getOutcome(game.goals);
	const finished = isGameFinished(game);

	const [homePredictions, awayPredictions] = gamePredictions.reduce<number[][]>(
		([home, away], p) => [
			[...home, p.home],
			[...away, p.away],
		],
		[[], []]
	);

	return (
		<div>
			{isGameStarted(game) && (
				<div className='mt-6 flex flex-col items-center gap-6 xl:flex-row'>
					<div className='text-xl font-bold'>Stats</div>
					<div className='flex flex-row flex-wrap'>
						<div className='flex flex-row flex-wrap items-center justify-start gap-4'>
							<div
								onClick={() => toggleFilter('winH')}
								className={classNames(
									gcc('bg-blue'),
									'flex flex-row items-center justify-center gap-2 rounded-md p-2 shadow-pop transition-all duration-300',
									statClassName('winH')
								)}
							>
								<Flag team={game?.teams.home} />
								<span className='hidden text-xl sm:block'>{game?.teams.home.name}</span>
								<span className='text-xl font-bold'>{outcomes.winH}</span>
								<RedactedSpoilers>
									<>{finished && result === 'winH' && <TickIcon />}</>
								</RedactedSpoilers>
							</div>
							<div
								onClick={() => toggleFilter('winA')}
								className={classNames(
									gcc('bg-blue'),
									'flex flex-row items-center justify-center gap-2 rounded-md p-2 shadow-pop transition-all duration-300',
									statClassName('winA')
								)}
							>
								<Flag team={game?.teams.away} />
								<span className='hidden text-xl sm:block'>{game?.teams.away.name}</span>
								<span className='text-xl font-bold'>{outcomes.winA}</span>
								<RedactedSpoilers>
									<>{finished && result === 'winA' && <TickIcon />}</>
								</RedactedSpoilers>
							</div>

							<div
								onClick={() => toggleFilter('draw')}
								className={classNames(
									gcc('bg-blue'),
									'flex flex-row items-center justify-center gap-2 rounded-md p-2 shadow-pop transition-all duration-300',
									statClassName('draw')
								)}
							>
								<span className='text-xl'> Draw</span>
								<span className='text-xl font-bold'>{outcomes.draw}</span>
								<RedactedSpoilers>
									<>{finished && result === 'draw' && <TickIcon />}</>
								</RedactedSpoilers>
							</div>
						</div>
					</div>

					<RedactedSpoilers>
						<div className='flex flex-row flex-wrap items-center'>
							{(resultsTally.exact ?? 0) > 0 && (
								<Circle
									className={classNames('bg-green-600', statClassName('exact'))}
									onClick={() => toggleFilter('exact')}
								>
									{resultsTally.exact}
								</Circle>
							)}
							{(resultsTally.result ?? 0) > 0 && (
								<Circle
									className={classNames('bg-yellow-600', statClassName('result'))}
									onClick={() => toggleFilter('result')}
								>
									{resultsTally.result}
								</Circle>
							)}
							{(resultsTally.onescore ?? 0) > 0 && (
								<Circle
									className={classNames('bg-pink-600', statClassName('onescore'))}
									onClick={() => toggleFilter('onescore')}
								>
									{resultsTally.onescore}
								</Circle>
							)}
							{(resultsTally.fail ?? 0) > 0 && (
								<Circle
									className={classNames('bg-red-600', statClassName('fail'))}
									onClick={() => toggleFilter('fail')}
								>
									{resultsTally.fail}
								</Circle>
							)}
							{(resultsTally.upset ?? 0) > 0 && (
								<Circle
									className={classNames('bg-cyan-700', statClassName('upset'))}
									onClick={() => toggleFilter('upset')}
								>
									{resultsTally.upset}
								</Circle>
							)}
							{(resultsTally.boost ?? 0) > 0 && (
								<Circle
									className={classNames('bg-indigo-500', statClassName('boost'))}
									onClick={() => toggleFilter('boost')}
								>
									{resultsTally.boost}
								</Circle>
							)}
							{(resultsTally.penalty ?? 0) > 0 && (
								<Circle
									className={classNames('bg-gray-500', statClassName('penalty'))}
									onClick={() => toggleFilter('penalty')}
								>
									{resultsTally.penalty}
								</Circle>
							)}
						</div>
					</RedactedSpoilers>

					<RedactedSpoilers>
						<div className='flex flex-row items-center gap-2'>
							<span className='font-bold'>Average prediction</span>
							<span>{`${median(homePredictions)} - ${median(awayPredictions)}`}</span>
						</div>
					</RedactedSpoilers>
				</div>
			)}
		</div>
	);
};

export default PredictionsStats;
