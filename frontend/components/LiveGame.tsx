import { DateTime } from 'luxon';
import { Dispatch, SetStateAction, useContext } from 'react';
import Countdown, { zeroPad } from 'react-countdown';
import { isGameFinished } from '../../shared/utils';
import FixturesContext from '../context/FixturesContext';
import UpdateTournamentContext from '../context/UpdateTournamentContext';
import UserContext from '../context/UserContext';
import useCompetition from '../hooks/useCompetition';
import useNoSpoilers from '../hooks/useNoSpoilers';
import { classNames, getCurrentDate } from '../lib/utils/reactHelper';
import ClientOnly from './ClientOnly';
import Flag from './Flag';
import GameExtraInfo from './GameExtraInfo';
import { Round } from './Round';
import ShowMore from './ShowMore';

const LiveGame = ({
	gameID,
	setIsExtraInfoOpen,
}: {
	gameID: number;
	setIsExtraInfoOpen: Dispatch<SetStateAction<boolean>>;
}) => {
	const data = useContext(FixturesContext);
	const userInfo = useContext(UserContext);
	const { gcc } = useCompetition();
	const updateCompetition = useContext(UpdateTournamentContext)!;
	const { RedactedSpoilers, noSpoilers } = useNoSpoilers();

	if (!data || !userInfo) return <></>;

	const game = data[gameID];

	const gameDate = DateTime.fromISO(game?.fixture.date);

	const isInPast = getCurrentDate() < gameDate;

	const timeDiff = gameDate.diff(getCurrentDate(), 'days').days;

	const isCountdown = timeDiff <= 1;

	return (
		<ShowMore
			setIsOpen={setIsExtraInfoOpen}
			more={game.fixture.status.short !== 'NS' && !noSpoilers && <GameExtraInfo game={game} />}
			className={classNames(gcc('text-light'), gcc('bg-blue'), 'my-2 flex  flex-col rounded p-2 shadow-pop')}
		>
			<div className='flex flex-col items-center sm:flex-row sm:justify-evenly'>
				<span className='flex text-left text-sm sm:w-2/12 '>
					<div className='flex items-center justify-center'>
						<Round game={game} />
					</div>
				</span>

				<div className='my-4 flex w-10/12 flex-row items-center justify-evenly sm:justify-center'>
					<div className='flex flex-row items-center justify-end sm:w-4/12'>
						<span className='mr-2 hidden text-xl sm:block'>{game?.teams.home.name}</span>
						<Flag team={game?.teams.home} />
					</div>

					{isInPast && isCountdown && (
						<span className='mx-2 text-center text-3xl sm:w-4/12'>
							<ClientOnly>
								<Countdown
									date={gameDate.toMillis()}
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
						<span className='mx-2 text-center text-3xl sm:w-4/12'>
							{DateTime.fromISO(game?.fixture.date).toFormat('dd LLL HH:mm')}
						</span>
					)}

					{!isInPast && (
						<span className='mx-2 text-center text-3xl sm:w-4/12'>
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

					<div className='flex flex-row items-center justify-start sm:w-4/12'>
						<Flag team={game?.teams.away} />
						<span className='ml-2 hidden text-xl sm:block'>{game?.teams.away.name}</span>
					</div>
				</div>

				<span className='text-right text-sm sm:w-2/12'>
					{game?.fixture.venue.name}, {game?.fixture.venue.city}
				</span>
			</div>
		</ShowMore>
	);
};

export default LiveGame;
