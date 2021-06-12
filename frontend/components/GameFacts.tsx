import { Event, Fixture } from '../../interfaces/main';
import { classNames } from '../lib/utils/reactHelper';

enum EventType {
	Goal = 'Goal',
	Subst = 'subst',
	Card = 'card',
	Var = 'var',
}

const GameFacts = ({ game }: { game: Fixture }) => {
	const Event = ({ event }: { event: Event }) => {
		const EventContainer = ({ children }: { children: JSX.Element[] }) => {
			const isAwayTeam = event.team.id === game.teams.away.id;
			return (
				<div className={classNames('flex items-center my-4', isAwayTeam ? 'flex-row-reverse' : 'flex-row')}>
					{children}
				</div>
			);
		};
		if (event.type === EventType.Goal) {
			return (
				<EventContainer>
					<span className="mx-2 font-bold">{event.time.elapsed}'</span>
					<img className="mx-2 h-5 w-5" src="/events/goal.svg" />
					<div className="mx-2 flex flex-col">
						<span>{event.player.name}</span>
						{event.assist.name && <span className="text-sm">assist by {event.assist.name}</span>}
					</div>
				</EventContainer>
			);
		} else if (event.type === EventType.Subst) {
			return (
				<EventContainer>
					<span className="mx-2 font-bold">{event.time.elapsed}'</span>
					<img
						className="mx-2 h-5 w-5"
						src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAMAAAC7IEhfAAAATlBMVEVHcEzkXVoAl17kXVkAl1/kXVoAl1zkWlrkXlrlXVkAl18An18AmV8Al17kXFrlXVvkXFoAl14Al14Al17kXVoAmF3kXVoAmF7lXlsAmF/fU5yDAAAAGHRSTlMA76DgQPBgMH+AIBBQwGBwwO/wr7+Q37C91jpQAAAAk0lEQVQ4y+XU2Q4CIQyF4cKAuI+OW/v+L+qF0YSlyX9r5lx/obQ0iPx/0pG5g9mGHWhQJoMyGZQfOJD729VG6eTJnLTS3NATH+0dX8vQRdh1hOOJcI4RvkzlyvPubU/tgirZxxLUg9I5pU6p022d4rku5wZOjtNAYW5LZ1j6J3dV5jJoO7PxfKVQKVSyz6hMF1lR3lY7HudLRmFoAAAAAElFTkSuQmCC"
					/>
					<div className="mx-2 flex flex-col">
						<span className="text-green-500">{event.player.name}</span>
						<span className="text-red-500">{event.assist.name}</span>
					</div>
				</EventContainer>
			);
		}
		return <></>;
	};
	return (
		<div className="bg-gray-700 rounded-md p-2">
			{game?.events?.map((event, idx) => (
				<>
					<Event key={idx} event={event} />
				</>
			))}
		</div>
	);
};

export default GameFacts;
