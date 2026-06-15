import type { ReactNode, MouseEventHandler } from 'react';
import type { Fixture, Prediction } from '../../interfaces/main';
import {
	getEarnedPoints,
	getExtraTimeResult,
	getOutcome,
	isGameStarted,
	isNum,
	isPenaltyShootout,
	isPredictionUpset,
} from '../../shared/utils';
import useNoSpoilers from '../hooks/useNoSpoilers';
import { classNames } from '../lib/utils/reactHelper';
import useCompetition from '../hooks/useCompetition';
import { useTournamentStore } from '../store/tournamentStore';

export const getPredictionResult = (prediction: Prediction, game: Fixture) => {
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

	return { isExactScore, isCorrectResult, isCorrectGoal, isPenaltyWinner, isWrong, isPredictValid };
};

const ResultContainer = ({
	children,
	prediction,
	game,
	className = '',
	onClick = () => {},
	userID,
	showEarnedPoints = true,
}: {
	className?: string;
	children: ReactNode;
	prediction: Prediction;
	game: Fixture;
	onClick?: MouseEventHandler<HTMLDivElement>;
	userID?: string;
	showEarnedPoints?: boolean;
}) => {
	const { gcc, competition } = useCompetition();
	const odds = useTournamentStore(s => s.odds);
	const boosts = useTournamentStore(s => s.boosts);
	const uid = useTournamentStore(s => s.uid);
	const { noSpoilers } = useNoSpoilers();

	const { isExactScore, isCorrectResult, isCorrectGoal, isPenaltyWinner, isWrong, isPredictValid } =
		getPredictionResult(prediction, game);

	const hasUpsetConfig = (competition.points.upset ?? 0) > 0;
	const gameOdds = hasUpsetConfig ? odds?.[game.fixture.id] : undefined;
	const started = isGameStarted(game);
	const predictionIsUpset = gameOdds && isPredictValid && isPredictionUpset(prediction, gameOdds);
	const earnedUpsetBonus = started && !noSpoilers && predictionIsUpset && (isExactScore || isCorrectResult);
	const isBoosted = userID && boosts?.[userID]?.includes(game.fixture.id);

	const totalEarnedPoints = getEarnedPoints(prediction, game, competition, gameOdds, !!isBoosted);

	const resultBgColor = noSpoilers
		? 'bg-white/10'
		: isExactScore
			? 'bg-green-600'
			: isCorrectResult
				? 'bg-yellow-600'
				: isCorrectGoal
					? 'bg-pink-600'
					: isWrong
						? 'bg-red-600'
						: 'bg-white/10';

	return (
		<div
			onClick={onClick}
			className={classNames(
				gcc('text-light'),
				resultBgColor,
				'relative rounded-xl border-2 text-center transition-colors duration-500',
				isPredictValid ? 'border-transparent' : 'border-red-600',
				className
			)}
		>
			{!noSpoilers && isPenaltyWinner && (
				<div className='absolute -right-2 -top-2 size-7 animate-pop-in rounded-full bg-gray-500'>
					<div className='flex size-full items-center justify-center text-xs'>
						+{competition.points.penalty}
					</div>
				</div>
			)}
			{earnedUpsetBonus && (
				<div className='absolute -left-2 -top-2 size-7 animate-pop-in rounded-full bg-cyan-700'>
					<div className='flex size-full items-center justify-center text-xs'>
						+{competition.points.upset}
					</div>
				</div>
			)}
			{showEarnedPoints && started && !noSpoilers && totalEarnedPoints > 0 && (
				<div className='absolute -bottom-3 -right-3 animate-pop-in whitespace-nowrap rounded-full bg-gray-900 px-2 py-1 text-xs font-bold text-white'>
					+{totalEarnedPoints} pts
				</div>
			)}
			{!started && predictionIsUpset && (
				<div className='absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-cyan-700 px-1.5 py-0.5 text-[9px] font-bold'>
					<span className='inline-block animate-pop-in'>Upset pick</span>
				</div>
			)}
			{isBoosted && (started || userID === uid) && (
				<div className='absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-500 px-1.5 py-0.5 text-[9px] font-bold text-white'>
					<span className='inline-block animate-pop-in'>2x</span>
				</div>
			)}
			{children}
		</div>
	);
};

export default ResultContainer;
