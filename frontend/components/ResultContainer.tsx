import { ReactNode, MouseEventHandler } from 'react';
import { Fixture, Prediction } from '../../interfaces/main';
import { getExtraTimeResult, getOutcome, isNum, isPenaltyShootout } from '../../shared/utils';
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
	const result = getExtraTimeResult(game);

	const { home: predH, away: predA } = prediction;
	const { home: realH, away: realA } = result;

	const isResultValid = isNum(result.home) && isNum(result.away);
	const isPredictValid = isNum(prediction.home) && isNum(prediction.away);

	const isExactScore = isPredictValid && predH === realH && predA === realA;

	const isCorrectResult =
		!isExactScore && getOutcome(prediction) !== null && getOutcome(prediction) === getOutcome(result);

	const isCorrectGoal =
		!isExactScore && !isCorrectResult && getOutcome(prediction) !== null && (predH === realH || predA === realA);

	const isPenaltyWinner =
		isPenaltyShootout(game) &&
		getOutcome(prediction) !== null &&
		getOutcome(prediction) === getOutcome(game.score.penalty);

	const isWrong = isResultValid && !isExactScore && !isCorrectResult && !isCorrectGoal;

	return (
		<div
			onClick={onClick}
			className={classNames(
				className,
				'rounded-md text-center relative border-2',
				isExactScore ? 'bg-green-600' : '',
				isCorrectResult ? 'bg-yellow-600' : '',
				isCorrectGoal ? 'bg-pink-600' : '',
				isWrong ? 'bg-red-600' : '',
				isPredictValid ? 'border-transparent' : 'border-red-600'
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
