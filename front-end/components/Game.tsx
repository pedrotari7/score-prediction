import { DateTime } from 'luxon';

const Game = ({ game }: { game: any }) => {
	return (
		<div className="text-light flex flex-row items-center justify-evenly">
			<span>{DateTime.fromISO(game.fixture.date).toFormat('dd LLL HH:mm')}</span>
			<span>{game.teams.home.name}</span>
			<img className="object-cover h-3 w-5 mr-2" src={game.teams.home.logo} />
			<img className="object-cover h-3 w-5 mr-2" src={game.teams.away.logo} />
			<span>{game.teams.away.name}</span>
			<span>{game.league.round}</span>
			<span>{game.fixture.venue.name}</span>
			<span>{game.fixture.venue.city}</span>
		</div>
	);
};

export default Game;
