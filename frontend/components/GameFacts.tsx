import { Fixture } from '../../interfaces/main';

const GameFacts = ({ game }: { game: Fixture }) => {
	return <pre>{JSON.stringify(game, null, 2)}</pre>;
};

export default GameFacts;
