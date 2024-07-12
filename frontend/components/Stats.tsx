import React from 'react';
import Panel from './Panel';
import { classNames } from '../lib/utils/reactHelper';
import useCompetition from '../hooks/useCompetition';
import { Fixtures, Predictions } from '../../interfaces/main';
import Match from './Match';
import { getPredictionResult } from './ResultContainer';

interface Props {
	fixtures: Fixtures;
	predictions: Predictions;
}

const Stats = ({ fixtures, predictions }: Props) => {
	const { gcc } = useCompetition();

	console.log('fixtures', fixtures);

	console.log('predictions', predictions);

	const maxPredictions = Object.values(predictions).reduce((acc, val) => {
		return Math.max(acc, Object.keys(val).length);
	}, 0);

	console.log('maxPredictions', maxPredictions);

	return (
		<Panel
			className={classNames(
				gcc('bg-dark'),
				`m-4 flex select-none flex-col justify-center rounded-md p-4 shadow-pop`,
				'mx-4 text-sm md:mx-24 lg:mx-48 lg:text-base'
			)}
		>
			<div className='mb-4 text-4xl font-bold'>Stats</div>

			<div>
				{Object.keys(fixtures).map(fixtureID => {
					const fixture = fixtures[parseInt(fixtureID)];
					const gamePredictions = predictions[parseInt(fixtureID)];

					const predictionsTally = Object.values(gamePredictions).reduce(
						(acc, val) => {
							const { isExactScore, isCorrectResult, isCorrectGoal, isWrong } = getPredictionResult(
								val,
								fixture
							);
							return {
								exact: acc.exact + (isExactScore ? 1 : 0),
								result: acc.result + (isCorrectResult ? 1 : 0),
								onescore: acc.onescore + (isCorrectGoal ? 1 : 0),
								fail: acc.fail + (isWrong ? 1 : 0),
								total: acc.total + 1,
							};
						},
						{ exact: 0, result: 0, onescore: 0, fail: 0, total: 0 }
					);

					console.log('predictionsTally', predictionsTally);

					return (
						<div key={fixtureID} className='flex flex-col items-center justify-start lg:flex-row'>
							<Match game={fixture} className='lg:w-1/3' />
							<div className='w-full lg:w-2/3'>
								<div
									className={classNames('flex flex-1 flex-row rounded-l-lg', gcc('bg-blue'))}
									style={{
										width: `calc(${Math.floor((100 * predictionsTally.total) / maxPredictions)}%)`,
									}}
								>
									<div className='px-2'>{predictionsTally.total}</div>
									<div className='child:rounded-lg flex flex-1 border-collapse flex-row pl-2 text-center'>
										{predictionsTally.exact ? (
											<div
												className='bg-green-600'
												style={{
													width: `calc(${Math.ceil((100 * predictionsTally.exact) / predictionsTally.total)}%)`,
												}}
											>
												{predictionsTally.exact}
											</div>
										) : null}
										{predictionsTally.result ? (
											<div
												className='bg-yellow-600'
												style={{
													width: `calc(${Math.ceil((100 * predictionsTally.result) / predictionsTally.total)}%)`,
												}}
											>
												{predictionsTally.result}
											</div>
										) : null}
										{predictionsTally.onescore ? (
											<div
												className='bg-pink-600'
												style={{
													width: `calc(${Math.ceil((100 * predictionsTally.onescore) / predictionsTally.total)}%)`,
												}}
											>
												{predictionsTally.onescore}
											</div>
										) : null}
										{predictionsTally.fail ? (
											<div
												className='bg-red-600'
												style={{
													width: `calc(${Math.ceil((100 * predictionsTally.fail) / predictionsTally.total)}%)`,
												}}
											>
												{predictionsTally.fail}
											</div>
										) : null}
									</div>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</Panel>
	);
};

export default Stats;
