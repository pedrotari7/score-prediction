import { ReactNode, MouseEventHandler } from 'react';
import { Prediction, Result } from '../../interfaces/main';
import { getOutcome } from '../../shared/utils';
import { classNames } from '../lib/utils/reactHelper';

const ResultContainer = ({
	children,
	prediction,
	result,
	className = '',
	onClick = () => {},
}: {
	className?: string;
	children: ReactNode;
	prediction: Prediction;
	result: Result;
	onClick?: MouseEventHandler<HTMLDivElement>;
}) => {
	const { home: predH, away: predA } = prediction;
	const { home: realH, away: realA } = result;

	const isExactScore = predH === realH && predA === realA;
	const isCorrectResult =
		!isExactScore && getOutcome(prediction) !== null && getOutcome(prediction) === getOutcome(result);
	const isCorrectGoal =
		!isExactScore && !isCorrectResult && getOutcome(prediction) !== null && (predH === realH || predA === realA);
	const isWrong = !isExactScore && !isCorrectResult && !isCorrectGoal;

	return (
		<div
			onClick={onClick}
			className={classNames(
				className,
				'rounded-md text-center',
				isExactScore ? 'bg-green-500' : '',
				isCorrectResult ? 'bg-yellow-500' : '',
				isCorrectGoal ? 'bg-pink-500' : '',
				isWrong ? 'bg-red-500' : ''
			)}>
			{children}
		</div>
	);
};

export default ResultContainer;
