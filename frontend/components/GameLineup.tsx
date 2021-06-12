import { Lineup } from '../../interfaces/main';

const GameLineup = ({ lineups }: { lineups: Lineup }) => {
	return <pre>{JSON.stringify(lineups, null, 2)}</pre>;
};

export default GameLineup;
