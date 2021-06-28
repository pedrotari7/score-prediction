import { ReactNode } from 'react';
import { Event, Fixture, FixtureExtraInfo, Player, PlayersMap, Result } from '../../interfaces/main';
import { isGameFinished } from '../../shared/utils';
import { classNames, DEFAULT_IMAGE } from '../lib/utils/reactHelper';

enum EventType {
	Goal = 'Goal',
	Subst = 'subst',
	Card = 'Card',
	Var = 'var',
}

const GameFacts = ({
	game,
	players,
	extraInfo,
}: {
	game: Fixture;
	players: PlayersMap;
	extraInfo: FixtureExtraInfo;
}) => {
	const Referee = () => (
		<div className="flex flex-row justify-center items-center my-6">
			<img className="mx-3 h-8 w-8" src="whistle.svg" />
			<div className="text-sm text-center">{game.fixture.referee}</div>
		</div>
	);

	const Event = ({ event }: { event: Event }) => {
		const getPhoto = (player: Player) => players[player.id]?.photo;

		const isAwayTeam = event.team.id === game.teams.away.id;

		const TimeElapsed = () => (
			<div className="flex flex-col items-center justify-center mx-2 w-5">
				<span className="font-bold">{event.time.elapsed}&apos;</span>
				{event.time.extra !== null && (
					<span className="font-bold text-xs text-gray-400">+{event.time.extra}</span>
				)}
			</div>
		);

		const EventContainer = ({ children }: { children: ReactNode }) => {
			return (
				<div className={classNames('flex items-center  my-2', isAwayTeam ? 'flex-row-reverse' : 'flex-row')}>
					{children}
				</div>
			);
		};

		const PlayerWithPhoto = ({ color = 'text-light', player }: { color?: string; player: Player }) => {
			const playerPhoto = getPhoto(player);
			const photo = playerPhoto ?? DEFAULT_IMAGE;
			return (
				<div className={classNames('flex items-center', isAwayTeam ? 'flex-row-reverse' : 'flex-row')}>
					<img className="object-cover h-6 w-6 sm:h-8 sm:w-8 rounded-full m-2" src={photo} />
					<span className={classNames(color)}>{player.name}</span>
				</div>
			);
		};

		if (event.type === EventType.Goal) {
			const isNormalGoal = event.detail === 'Normal Goal';
			const isOwnGoal = event.detail === 'Own Goal';
			const isMissedPenalty = event.detail === 'Missed Penalty';
			const isPenalty = event.detail === 'Penalty';

			return (
				<EventContainer>
					<TimeElapsed />
					{isNormalGoal && <img className="mx-2 h-5 w-5" src="/events/goal.svg" />}
					{isOwnGoal && <img className="mx-2 h-5 w-5" src="/events/own_goal.svg" />}
					{isMissedPenalty && <img className="mx-2 h-5 w-5" src="/events/missed_penalty.svg" />}
					{isPenalty && <img className="mx-2 h-5 w-5" src="/events/penalty.svg" />}

					<div className={classNames('flex flex-col', isAwayTeam ? 'items-end' : 'items-start')}>
						<PlayerWithPhoto player={event.player} />
						{event.assist.name && <span className="text-sm mx-2">assist by {event.assist.name}</span>}
					</div>
				</EventContainer>
			);
		} else if (event.type === EventType.Subst) {
			return (
				<EventContainer>
					<TimeElapsed />
					<img
						className="mx-2 h-5 w-5"
						src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAMAAAC7IEhfAAAATlBMVEVHcEzkXVoAl17kXVkAl1/kXVoAl1zkWlrkXlrlXVkAl18An18AmV8Al17kXFrlXVvkXFoAl14Al14Al17kXVoAmF3kXVoAmF7lXlsAmF/fU5yDAAAAGHRSTlMA76DgQPBgMH+AIBBQwGBwwO/wr7+Q37C91jpQAAAAk0lEQVQ4y+XU2Q4CIQyF4cKAuI+OW/v+L+qF0YSlyX9r5lx/obQ0iPx/0pG5g9mGHWhQJoMyGZQfOJD729VG6eTJnLTS3NATH+0dX8vQRdh1hOOJcI4RvkzlyvPubU/tgirZxxLUg9I5pU6p022d4rku5wZOjtNAYW5LZ1j6J3dV5jJoO7PxfKVQKVSyz6hMF1lR3lY7HudLRmFoAAAAAElFTkSuQmCC"
					/>
					<div className={classNames('flex flex-col', isAwayTeam ? 'items-end' : 'items-start')}>
						<PlayerWithPhoto color="text-green-500" player={event.player} />
						<PlayerWithPhoto color="text-red-500" player={event.assist} />
					</div>
				</EventContainer>
			);
		} else if (event.type === EventType.Card) {
			const isYellowCard = event.detail === 'Yellow Card';
			const isSecondYellowCard = event.detail === 'Seccond yellow card';
			const isRedCard = event.detail === 'Red Card';

			return (
				<EventContainer>
					<TimeElapsed />
					{isYellowCard && <img className="mx-3 h-5 w-3" src="/events/yellow_card.svg" />}
					{isSecondYellowCard && <img className="mx-3 h-5 w-3" src="/events/yellow_card.svg" />}
					{isRedCard && <img className="mx-3 h-5 w-3" src="/events/red_card.svg" />}
					<PlayerWithPhoto player={event.player} />
				</EventContainer>
			);
		}
		return <></>;
	};

	const Score = ({ score, label }: { score: Result; label: string }) => {
		if (score.home === null || score.away == null) return <></>;
		return (
			<div className="text-sm flex flex-row items-center">
				<div className="flex flex-grow bg-gray-500 h-0.5 opacity-80 "></div>
				<div className="w-max mx-8">
					{label} {score.home} - {score.away}
				</div>
				<div className="flex flex-grow bg-gray-500 h-0.5 opacity-80 "></div>
			</div>
		);
	};

	const HalfTimeScore = () => <Score score={game.score.halftime} label="HT" />;
	const FullTimeScore = () => <Score score={game.score.fulltime} label="FT" />;

	const events = extraInfo.events?.map((event, idx) => {
		const shouldAddHTScore = !addedHTScore && event.time.elapsed >= 45 && event.time.extra === null;
		const shouldAddFTScore = !addedFTScore && event.time.elapsed > 90 && event.time.extra === null;

		if (shouldAddHTScore) addedHTScore = shouldAddHTScore;
		if (shouldAddFTScore) addedFTScore = shouldAddFTScore;

		return (
			<div key={idx} className="w-full xl:w-1/3">
				{shouldAddHTScore && isGameFinished(game) && <HalfTimeScore />}
				{shouldAddFTScore && isGameFinished(game) && <FullTimeScore />}

				<Event event={event} />
				{shouldAddHTScore && !isGameFinished(game) && <HalfTimeScore />}
				{shouldAddFTScore && !isGameFinished(game) && <FullTimeScore />}
			</div>
		);
	});

	let addedHTScore = false;
	let addedFTScore = false;

	return (
		<div className="bg-gray-700 rounded-md p-2 flex flex-col text-sm sm:text-base xl:items-center justify-center">
			{isGameFinished(game) ? events : events?.reverse()}
			<Referee />
		</div>
	);
};

export default GameFacts;
