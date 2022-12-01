import { CheckIcon } from '@heroicons/react/24/outline';
import React from 'react';
import { Fixture, Prediction, UserResult } from '../../interfaces/main';
import { getOutcome, isGameFinished, isGameStarted, median } from '../../shared/utils';
import useCompetition from '../hooks/useCompetition';
import useNoSpoilers from '../hooks/useNoSpoilers';
import { classNames } from '../lib/utils/reactHelper';
import Flag from './Flag';
import { Circle } from './UserScores';

const PredictionsStats = ({
	game,
	gamePredictions,
	resultsTally,
}: {
	game: Fixture;
	gamePredictions: Prediction[];
	resultsTally: Partial<UserResult>;
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

	const TickIcon = () => <CheckIcon className='h-6 w-6 text-green-500' />;

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
				<div className='mt-6 flex flex-col gap-6'>
					<div className='text-xl font-bold'>Stats</div>
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
								<RedactedSpoilers>
									<>{finished && result === 'winH' && <TickIcon />}</>
								</RedactedSpoilers>
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
								<RedactedSpoilers>
									<>{finished && result === 'winA' && <TickIcon />}</>
								</RedactedSpoilers>
							</div>

							<div
								className={classNames(
									gcc('bg-blue'),
									'flex flex-row items-center justify-center gap-2 rounded-md p-2 shadow-pop'
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
								<Circle className='bg-green-600'>{resultsTally.exact}</Circle>
							)}
							{(resultsTally.result ?? 0) > 0 && (
								<Circle className='bg-yellow-600'>{resultsTally.result}</Circle>
							)}
							{(resultsTally.onescore ?? 0) > 0 && (
								<Circle className='bg-pink-600'>{resultsTally.onescore}</Circle>
							)}
							{(resultsTally.fail ?? 0) > 0 && (
								<Circle className='bg-red-600'>{resultsTally.fail}</Circle>
							)}
							{(resultsTally.penalty ?? 0) > 0 && (
								<Circle className='bg-gray-500'>{resultsTally.penalty}</Circle>
							)}
						</div>
					</RedactedSpoilers>

					<div className='flex flex-row items-center gap-2'>
						<span className='font-bold'>Average prediction</span>
						<span>{`${median(homePredictions)} - ${median(awayPredictions)}`}</span>
					</div>
				</div>
			)}
		</div>
	);
};

export default PredictionsStats;
