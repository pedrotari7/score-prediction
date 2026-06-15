import type { Dispatch, SetStateAction } from 'react';
import Countdown, { zeroPad } from 'react-countdown';
import { getUpsetSide, isDrawFavorite, isGameFinished } from '../../shared/utils';
import useCompetition from '../hooks/useCompetition';
import useNoSpoilers from '../hooks/useNoSpoilers';
import { classNames, formatGameDate, getCurrentDate } from '../lib/utils/reactHelper';
import { useTournamentStore } from '../store/tournamentStore';
import dynamic from 'next/dynamic';
import ClientOnly from './ClientOnly';
import Flag from './Flag';
import { Round } from './Round';
import ShowMore from './ShowMore';

const GameExtraInfo = dynamic(() => import('./GameExtraInfo'));

const LiveGame = ({
	gameID,
	setIsExtraInfoOpen,
}: {
	gameID: number;
	setIsExtraInfoOpen: Dispatch<SetStateAction<boolean>>;
}) => {
	const data = useTournamentStore(s => s.fixtures);
	const odds = useTournamentStore(s => s.odds);
	const token = useTournamentStore(s => s.token);
	const { gcc, competition } = useCompetition();
	const updateCompetition = useTournamentStore(s => s.updateTournament);
	const { RedactedSpoilers, noSpoilers } = useNoSpoilers();

	if (!data || !token) return <></>;

	const game = data[gameID];
	const gameOdds = odds?.[gameID];

	const gameDate = new Date(game?.fixture.date);

	const isInPast = getCurrentDate().getTime() < gameDate.getTime();

	const timeDiff = (gameDate.getTime() - getCurrentDate().getTime()) / (1000 * 60 * 60 * 24);

	const isCountdown = timeDiff <= 1;

	return (
		<ShowMore
			setIsOpen={setIsExtraInfoOpen}
			more={game.fixture.status.short !== 'NS' && !noSpoilers ? <GameExtraInfo game={game} /> : null}
			className={classNames(gcc('text-light'), 'glass-card my-2 flex flex-col rounded-2xl p-3 shadow-card')}
		>
			<div className='flex flex-col items-center sm:flex-row sm:justify-evenly'>
				<span className='flex text-left text-sm sm:w-2/12'>
					<div className='flex items-center justify-center'>
						<Round game={game} />
					</div>
				</span>

				<div className='my-4 grid w-10/12 grid-cols-3 items-center'>
					<div className='flex flex-col items-center sm:flex-row sm:justify-end'>
						<span className='mr-0 hidden text-xl sm:mr-2 sm:block'>{game?.teams.home.name}</span>
						<Flag team={game?.teams.home} />
						<span className='mt-1 text-center text-xs font-bold leading-tight sm:hidden'>
							{game?.teams.home.name}
						</span>
					</div>

					{isInPast && isCountdown && (
						<span className='mx-1 text-center text-xl sm:mx-2 sm:text-3xl'>
							<ClientOnly>
								<Countdown
									date={gameDate.getTime()}
									onComplete={() => updateCompetition()}
									renderer={({ hours, minutes, seconds }) => (
										<span>
											{zeroPad(hours)}:{zeroPad(minutes)}:{zeroPad(seconds)}
										</span>
									)}
								/>
							</ClientOnly>
						</span>
					)}

					{isInPast && !isCountdown && (
						<span className='mx-2 text-center text-3xl'>{formatGameDate(game?.fixture.date)}</span>
					)}

					{!isInPast && (
						<span className='mx-2 text-center text-3xl'>
							<div>
								<RedactedSpoilers message='Hidden' withIcon>
									<>
										<span>{game.goals.home}</span>
										<span className='mx-2'>-</span>
										<span>{game.goals.away}</span>
									</>
								</RedactedSpoilers>
							</div>
							{game.score.penalty.home && !noSpoilers && (
								<div className='text-sm'>
									<span>(</span>
									<span>{game.score.penalty.home}</span>
									<span className='mx-2'>-</span>
									<span>{game.score.penalty.away}</span>
									<span> PEN)</span>
								</div>
							)}
							{!noSpoilers && (
								<div className='mt-2'>
									<span className='ml-1 text-xs'>{game.fixture.status.long}</span>
									{!isGameFinished(game) && game.fixture.status.elapsed && (
										<span className='mx-1 text-base'>{game.fixture.status.elapsed}&apos;</span>
									)}
								</div>
							)}
						</span>
					)}

					<div className='flex flex-col items-center sm:flex-row sm:justify-start'>
						<Flag team={game?.teams.away} />
						<span className='mt-1 text-center text-xs font-bold leading-tight sm:hidden'>
							{game?.teams.away.name}
						</span>
						<span className='ml-0 hidden text-xl sm:ml-2 sm:block'>{game?.teams.away.name}</span>
					</div>
				</div>

				<span className='text-right text-sm sm:w-2/12'>
					{[game?.fixture.venue.name, game?.fixture.venue.city].filter(Boolean).join(', ')}
				</span>
			</div>

			{gameOdds && (
				<div className='mt-3 flex flex-col items-center gap-1.5'>
					<span className='text-[10px] uppercase tracking-widest opacity-40'>Betting Odds</span>
					<div className='flex items-center gap-1 text-xs'>
						<div
							className={classNames(
								'group relative flex flex-col items-center rounded px-3 py-1',
								getUpsetSide(gameOdds) === 'home'
									? 'bg-cyan-700/30 font-bold text-cyan-300'
									: !isDrawFavorite(gameOdds) && gameOdds.home <= gameOdds.away
										? 'bg-white/10 font-bold'
										: 'opacity-50'
							)}
						>
							<span className='text-[10px] uppercase opacity-60'>Home</span>
							<span>{gameOdds.home.toFixed(2)}</span>
							{getUpsetSide(gameOdds) === 'home' && (
								<div className='pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-[10px] text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100'>
									Predict this result for +{competition.points.upset} bonus points
								</div>
							)}
						</div>
						<div
							className={classNames(
								'flex flex-col items-center rounded px-3 py-1',
								isDrawFavorite(gameOdds) ? 'bg-white/10 font-bold' : 'opacity-50'
							)}
						>
							<span className='text-[10px] uppercase opacity-60'>Draw</span>
							<span>{gameOdds.draw.toFixed(2)}</span>
						</div>
						<div
							className={classNames(
								'group relative flex flex-col items-center rounded px-3 py-1',
								getUpsetSide(gameOdds) === 'away'
									? 'bg-cyan-700/30 font-bold text-cyan-300'
									: !isDrawFavorite(gameOdds) && gameOdds.away <= gameOdds.home
										? 'bg-white/10 font-bold'
										: 'opacity-50'
							)}
						>
							<span className='text-[10px] uppercase opacity-60'>Away</span>
							<span>{gameOdds.away.toFixed(2)}</span>
							{getUpsetSide(gameOdds) === 'away' && (
								<div className='pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-[10px] text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100'>
									Predict this result for +{competition.points.upset} bonus points
								</div>
							)}
						</div>
					</div>
					{isDrawFavorite(gameOdds) && (
						<span className='text-[10px] opacity-40'>Draw favored — no upset bonus</span>
					)}
				</div>
			)}
		</ShowMore>
	);
};

export default LiveGame;
