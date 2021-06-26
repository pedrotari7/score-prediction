import { ReactNode, MouseEventHandler } from 'react';
import { Fixture, Prediction } from '../../interfaces/main';
import { getOutcome, isPenaltyShootout } from '../../shared/utils';
import { classNames } from '../lib/utils/reactHelper';

const ResultContainer = ({
	children,
	prediction,
	game,
	className = '',
	onClick = () => {},
}: {
	className?: string;
	children: ReactNode;
	prediction: Prediction;
	game: Fixture;
	onClick?: MouseEventHandler<HTMLDivElement>;
}) => {
	let result = game.goals;

	if (['PEN', 'AET'].includes(game.fixture.status.short)) {
		result = game.score.extratime;
	}

	const { home: predH, away: predA } = prediction;
	const { home: realH, away: realA } = result;

	const isExactScore = predH === realH && predA === realA;

	const isCorrectResult =
		!isExactScore && getOutcome(prediction) !== null && getOutcome(prediction) === getOutcome(result);

	const isCorrectGoal =
		!isExactScore && !isCorrectResult && getOutcome(prediction) !== null && (predH === realH || predA === realA);

	const isPenaltyWinner =
		isPenaltyShootout(game) &&
		getOutcome(prediction) !== null &&
		getOutcome(prediction) === getOutcome(game.score.penalty);

	const isWrong = !isExactScore && !isCorrectResult && !isCorrectGoal && !isPenaltyWinner;

	return (
		<div
			onClick={onClick}
			className={classNames(
				className,
				'rounded-md text-center relative',
				isExactScore ? 'bg-green-500' : '',
				isCorrectResult ? 'bg-yellow-500' : '',
				isCorrectGoal ? 'bg-pink-500' : '',
				isWrong ? 'bg-red-500' : ''
			)}>
			{isPenaltyWinner && (
				<div className="absolute rounded-full bg-gray-500 w-7 h-7 -top-1 -right-3">
					<div className="flex items-center justify-center w-full h-full text-xs">+1</div>
				</div>
			)}
			{children}
		</div>
	);
};

export default ResultContainer;
