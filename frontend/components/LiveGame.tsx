import { DateTime } from 'luxon';
import { useRouter } from 'next/router';
import { useContext } from 'react';
import Countdown, { zeroPad } from 'react-countdown';
import FixturesContext from '../context/FixturesContext';
import UserContext from '../context/UserContext';
import { getCurrentDate } from '../lib/utils/reactHelper';
import ClientOnly from './ClientOnly';
import Flag from './Flag';

const LiveGame = ({ gameID }: { gameID: number }) => {
	const router = useRouter();
	const data = useContext(FixturesContext);
	const userInfo = useContext(UserContext);

	if (!data || !userInfo) return <></>;

	const game = data[gameID];

	const group = game?.league.round;

	const gameDate = DateTime.fromISO(game?.fixture.date);

	const isInPast = getCurrentDate() < gameDate;

	const timeDiff = gameDate.diff(getCurrentDate(), 'days').days;

	const isCountdown = timeDiff <= 1;

	return (
		<div className="text-light flex flex-col sm:flex-row items-center sm:justify-evenly my-2 rounded p-2 bg-gark shadow-pop">
			<span className="text-sm text-left sm:w-2/12 flex ">
				<div className="flex items-center justify-center">
					<span>{group}</span>
				</div>
			</span>

			<div className="w-10/12 flex flex-row justify-center items-center my-4">
				<div className="flex flex-row items-center justify-end sm:w-4/12">
					<span className="text-xl hidden sm:block mr-2">{game?.teams.home.name}</span>
					<Flag team={game?.teams.home} />
				</div>

				{isInPast && isCountdown && (
					<span className="text-3xl sm:w-4/12 text-center mx-2">
						<ClientOnly>
							<Countdown
								date={gameDate.toMillis()}
								onComplete={() => router.push('/')}
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
					<span className="text-3xl sm:w-4/12 text-center mx-2">
						{DateTime.fromISO(game?.fixture.date).toFormat('dd LLL HH:mm')}
					</span>
				)}

				{!isInPast && (
					<span className="text-3xl sm:w-4/12 text-center mx-2">
						<span>{game.goals.home}</span>
						<span className="mx-2">-</span>
						<span>{game.goals.away}</span>
					</span>
				)}

				<div className="flex flex-row items-center justify-start sm:w-4/12">
					<Flag team={game?.teams.away} />
					<span className="text-xl hidden sm:block ml-2">{game?.teams.away.name}</span>
				</div>
			</div>

			<span className="text-sm text-right sm:w-2/12">
				{game?.fixture.venue.name}, {game?.fixture.venue.city}
			</span>
		</div>
	);
};

export default LiveGame;
