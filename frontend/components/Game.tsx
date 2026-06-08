import { memo } from 'react';
import type { Predictions, UpdatePrediction } from '../../interfaces/main';
import { getUpsetSide, isNum, isPredictionUpset } from '../../shared/utils';
import Countdown, { zeroPad } from 'react-countdown';
import useCompetition from '../hooks/useCompetition';
import useNoSpoilers from '../hooks/useNoSpoilers';
import { useInputPrediction, UserInputPrediction } from '../hooks/useInputPrediction';
import { classNames, formatGameDate, formatScore, getCurrentDate } from '../lib/utils/reactHelper';
import { useTournamentStore } from '../store/tournamentStore';
import ClientOnly from './ClientOnly';
import Flag from './Flag';
import ResultContainer from './ResultContainer';
import { Round } from './Round';

const DEFAULT_PREDICTION = { home: null, away: null };

const ONE_HOUR = 60 * 60 * 1000;
const FIFTEEN_MIN = 15 * 60 * 1000;

const DeadlineCountdown = ({ gameDate }: { gameDate: Date }) => {
	const now = getCurrentDate();
	const timeTillKickoff = gameDate.getTime() - now.getTime();

	if (timeTillKickoff <= 0 || timeTillKickoff > ONE_HOUR) return null;

	const isUrgent = timeTillKickoff <= FIFTEEN_MIN;

	return (
		<ClientOnly>
			<div
				className={classNames(
					'rounded px-2 py-0.5 text-xs font-bold',
					isUrgent ? 'animate-pulse bg-red-600 text-white' : 'bg-yellow-600 text-white'
				)}
			>
				<Countdown
					date={gameDate}
					renderer={({ hours, minutes, seconds }) => (
						<span>
							{hours > 0 && `${zeroPad(hours)}:`}
							{zeroPad(minutes)}:{zeroPad(seconds)}
						</span>
					)}
				/>
			</div>
		</ClientOnly>
	);
};

const DEBUG_COUNTDOWN = false;

const DebugCountdowns = () => {
	if (!DEBUG_COUNTDOWN) return null;
	const now = new Date();
	return (
		<div className='m-4 flex flex-col gap-4 rounded bg-gray-800 p-4'>
			<div className='text-lg font-bold text-yellow-400'>Countdown Debug</div>
			<div className='flex flex-row flex-wrap gap-4'>
				<div className='flex flex-col items-center gap-1'>
					<span className='text-xs text-gray-400'>50 min left</span>
					<DeadlineCountdown gameDate={new Date(now.getTime() + 50 * 60 * 1000)} />
				</div>
				<div className='flex flex-col items-center gap-1'>
					<span className='text-xs text-gray-400'>14 min left</span>
					<DeadlineCountdown gameDate={new Date(now.getTime() + 14 * 60 * 1000)} />
				</div>
				<div className='flex flex-col items-center gap-1'>
					<span className='text-xs text-gray-400'>2 min left</span>
					<DeadlineCountdown gameDate={new Date(now.getTime() + 2 * 60 * 1000)} />
				</div>
				<div className='flex flex-col items-center gap-1'>
					<span className='text-xs text-gray-400'>2 hours (hidden)</span>
					<DeadlineCountdown gameDate={new Date(now.getTime() + 2 * 60 * 60 * 1000)} />
					<span className='text-xs text-gray-500'>should be empty</span>
				</div>
			</div>
		</div>
	);
};

const Game = memo(function Game({
	predictions,
	updatePrediction,
	gameID,
	userID,
}: {
	predictions: Predictions;
	updatePrediction: UpdatePrediction;
	gameID: number;
	userID: string;
}) {
	const data = useTournamentStore(s => s.fixtures);
	const odds = useTournamentStore(s => s.odds);
	const boosts = useTournamentStore(s => s.boosts);
	const doUpdateBoost = useTournamentStore(s => s.updateBoost);
	const { gcc, competition } = useCompetition();
	const uid = useTournamentStore(s => s.uid);

	const maxBoosts = competition.points.boosts ?? 0;
	const myBoosts = boosts?.[uid] ?? [];
	const isBoosted = myBoosts.includes(gameID);
	const remainingBoosts = maxBoosts - myBoosts.length;

	const { RedactedSpoilers } = useNoSpoilers();

	const prediction = predictions?.[gameID]?.[userID] || DEFAULT_PREDICTION;

	const { homeInputRef, awayInputRef, handleContainerClick } = useInputPrediction(gameID, prediction);

	if (!data) return <></>;

	const isMyPredictions = uid === userID;

	const game = data[gameID];

	const gameDate = new Date(game?.fixture.date);

	const isInPast = getCurrentDate().getTime() >= gameDate.getTime();

	const isValidScore = (n: number | null) => isNum(n) && n >= 0;

	const upsetSide =
		!isInPast && (competition.points.upset ?? 0) > 0 && odds?.[gameID] ? getUpsetSide(odds[gameID]) : null;

	return (
		<div
			className={classNames(
				gcc('text-light'),
				gcc('bg-dark'),
				gcc('hover:bg-blue'),
				`my-2 flex flex-col items-center justify-evenly rounded p-2 shadow-pop lg:flex-row`,
				'cursor-pointer'
			)}
			onClick={() => handleContainerClick(isMyPredictions)}
		>
			<span className='flex w-full items-center justify-between gap-2 text-left text-xs lg:w-3/12'>
				<Round game={game} />
				<span className='flex items-center gap-2'>
					{!isInPast && <DeadlineCountdown gameDate={gameDate} />}
					<span className='text-xs'>{formatGameDate(game?.fixture.date, true)}</span>
				</span>
			</span>

			<div className='flex w-full flex-row items-center justify-between sm:justify-center lg:w-8/12'>
				<div className='flex w-3/12 flex-col items-center sm:w-5/12 sm:flex-row sm:items-center sm:justify-end lg:w-5/12'>
					<span className='mr-2 hidden font-bold sm:block'>{game?.teams.home.name}</span>
					<div className='relative'>
						<Flag team={game?.teams.home} />
						{upsetSide === 'home' && (
							<span className='absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-cyan-500' />
						)}
					</div>
					<span className='mt-1.5 text-center text-xs font-bold leading-tight sm:hidden'>
						{game?.teams.home.name}
					</span>
				</div>

				<div className='flex w-4/12 flex-row items-center justify-center lg:w-4/12'>
					{!isInPast && isMyPredictions && (
						<div className='relative flex flex-col items-center'>
							<div className='relative flex flex-row items-center'>
								<UserInputPrediction
									gameID={gameID}
									prediction={prediction}
									updatePrediction={updatePrediction}
									homeInputRef={homeInputRef}
									awayInputRef={awayInputRef}
								/>
								{(competition.points.upset ?? 0) > 0 &&
									odds?.[gameID] &&
									isNum(prediction.home) &&
									isNum(prediction.away) &&
									isPredictionUpset(prediction, odds[gameID]) && (
										<div className='absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-cyan-700 px-1.5 py-0.5 text-[9px] font-bold'>
											Upset pick
										</div>
									)}
							</div>
							{maxBoosts > 0 && (
								<button
									onClick={e => {
										e.stopPropagation();
										doUpdateBoost(gameID);
									}}
									disabled={!isBoosted && remainingBoosts <= 0}
									className={classNames(
										'mt-1 rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors',
										isBoosted
											? 'bg-indigo-500 text-white'
											: remainingBoosts > 0
												? 'bg-gray-600 text-gray-300 hover:bg-indigo-500/50'
												: 'cursor-not-allowed bg-gray-700 text-gray-500'
									)}
								>
									{isBoosted ? '2x Boosted' : `2x (${remainingBoosts} left)`}
								</button>
							)}
						</div>
					)}

					{!isInPast && !isMyPredictions && (
						<div className='relative mx-4 font-bold'>
							{formatScore(prediction.home)} - {formatScore(prediction.away)}
							{(competition.points.upset ?? 0) > 0 &&
								odds?.[gameID] &&
								isNum(prediction.home) &&
								isNum(prediction.away) &&
								isPredictionUpset(prediction, odds[gameID]) && (
									<div className='absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-cyan-700 px-1.5 py-0.5 text-[9px] font-bold'>
										Upset pick
									</div>
								)}
						</div>
					)}

					{isInPast && (
						<div className='mx-4 flex flex-col items-center justify-center font-bold lg:w-6/12'>
							<ResultContainer
								className='mb-2 min-w-result px-2'
								prediction={prediction}
								game={game}
								userID={userID}
							>
								{(!isValidScore(prediction.home) || !isValidScore(prediction.away)) && (
									<span>No prediction</span>
								)}
								{isValidScore(prediction.home) && isValidScore(prediction.away) && (
									<div className='flex flex-row items-center justify-center py-1'>
										{prediction.home} - {prediction.away}
									</div>
								)}
							</ResultContainer>
							<RedactedSpoilers message='Hidden' withIcon iconStyle='w-6 h-6' className='text-xs'>
								<div className='flex flex-row flex-wrap items-center justify-center'>
									{game.goals.home} - {game.goals.away}
									{game.score.penalty.home && (
										<div className='ml-2 text-sm'>
											<span>(</span>
											<span>{game.score.penalty.home}</span>
											<span className='mx-2'>-</span>
											<span>{game.score.penalty.away}</span>
											<span>)</span>
										</div>
									)}
									<span className='ml-2'>{game.fixture.status.short}</span>
								</div>
							</RedactedSpoilers>
						</div>
					)}
				</div>

				<div className='my-2 flex w-3/12 flex-col items-center sm:w-5/12 sm:flex-row sm:items-center sm:justify-start lg:my-0 lg:w-5/12'>
					<div className='relative'>
						<Flag team={game?.teams.away} />
						{upsetSide === 'away' && (
							<span className='absolute -bottom-0.5 -left-0.5 size-2 rounded-full bg-cyan-500' />
						)}
					</div>
					<span className='mt-1.5 text-center text-xs font-bold leading-tight sm:hidden'>
						{game?.teams.away.name}
					</span>
					<span className='ml-2 hidden font-bold sm:block'>{game?.teams.away.name}</span>
				</div>
			</div>

			<span className='my-2 text-right text-xs lg:my-0 lg:w-2/12'>
				{[game?.fixture.venue.name, game?.fixture.venue.city].filter(Boolean).join(', ')}
			</span>
		</div>
	);
});

export default Game;
export { DebugCountdowns };
