import { ReactNode } from 'react';
import { Event, Fixture, FixtureExtraInfo, Player, PlayersMap, Result } from '../../interfaces/main';
import { isGameFinished } from '../../shared/utils';
import useCompetition from '../hooks/useCompetition';
import { classNames, DEFAULT_IMAGE } from '../lib/utils/reactHelper';

enum EventType {
	Goal = 'Goal',
	Subst = 'subst',
	Card = 'Card',
	Var = 'Var',
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
	const { gcc } = useCompetition();

	const Referee = () => (
		<div className='my-6 flex flex-row items-center justify-center'>
			<img className='mx-3 size-8' src='whistle.svg' />
			<div className='text-center text-sm'>{game.fixture.referee}</div>
		</div>
	);

	const Event = ({ event }: { event: Event }) => {
		const getPhoto = (player: Player) => players[player.id]?.photo;

		const isAwayTeam = event.team.id === game.teams.away.id;

		const TimeElapsed = () => (
			<div className='mx-2 flex w-5 flex-col items-center justify-center'>
				<span className='font-bold'>{event.time.elapsed}&apos;</span>
				{event.time.extra !== null && (
					<span className='text-xs font-bold text-gray-400'>+{event.time.extra}</span>
				)}
			</div>
		);

		const EventContainer = ({ children }: { children: ReactNode }) => {
			return (
				<div className={classNames('my-2 flex  items-center', isAwayTeam ? 'flex-row-reverse' : 'flex-row')}>
					{children}
				</div>
			);
		};

		const PlayerWithPhoto = ({ color = gcc('text-light'), player }: { color?: string; player: Player }) => {
			const playerPhoto = getPhoto(player);
			const photo = playerPhoto ?? DEFAULT_IMAGE;
			return (
				<div className={classNames('flex items-center', isAwayTeam ? 'flex-row-reverse' : 'flex-row')}>
					<img className='m-2 size-6 rounded-full object-cover sm:size-8' src={photo} />
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
					{isNormalGoal && <img className='mx-2 size-5' src='/events/goal.svg' />}
					{isOwnGoal && <img className='mx-2 size-5' src='/events/own_goal.svg' />}
					{isMissedPenalty && <img className='mx-2 size-5' src='/events/missed_penalty.svg' />}
					{isPenalty && <img className='mx-2 size-5' src='/events/penalty.svg' />}

					<div className={classNames('flex flex-col', isAwayTeam ? 'items-end' : 'items-start')}>
						<PlayerWithPhoto player={event.player} />
						{event.assist.name && <span className='mx-2 text-sm'>assist by {event.assist.name}</span>}
					</div>
				</EventContainer>
			);
		} else if (event.type === EventType.Subst) {
			return (
				<EventContainer>
					<TimeElapsed />
					<img
						className='mx-2 size-5'
						src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAMAAAC7IEhfAAAATlBMVEVHcEzkXVoAl17kXVkAl1/kXVoAl1zkWlrkXlrlXVkAl18An18AmV8Al17kXFrlXVvkXFoAl14Al14Al17kXVoAmF3kXVoAmF7lXlsAmF/fU5yDAAAAGHRSTlMA76DgQPBgMH+AIBBQwGBwwO/wr7+Q37C91jpQAAAAk0lEQVQ4y+XU2Q4CIQyF4cKAuI+OW/v+L+qF0YSlyX9r5lx/obQ0iPx/0pG5g9mGHWhQJoMyGZQfOJD729VG6eTJnLTS3NATH+0dX8vQRdh1hOOJcI4RvkzlyvPubU/tgirZxxLUg9I5pU6p022d4rku5wZOjtNAYW5LZ1j6J3dV5jJoO7PxfKVQKVSyz6hMF1lR3lY7HudLRmFoAAAAAElFTkSuQmCC'
					/>
					<div className={classNames('flex flex-col', isAwayTeam ? 'items-end' : 'items-start')}>
						<PlayerWithPhoto color='text-green-600' player={event.player} />
						<PlayerWithPhoto color='text-red-600' player={event.assist} />
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
					{isYellowCard && <img className='mx-3 h-5 w-3' src='/events/yellow_card.svg' />}
					{isSecondYellowCard && <img className='mx-3 h-5 w-3' src='/events/yellow_card.svg' />}
					{isRedCard && <img className='mx-3 h-5 w-3' src='/events/red_card.svg' />}
					<div className={classNames('flex flex-col', isAwayTeam ? 'items-end' : 'items-start')}>
						<PlayerWithPhoto player={event.player} />
						{event.comments && <span className='mx-2 text-sm'>{event.comments}</span>}
					</div>
				</EventContainer>
			);
		} else if (event.type === EventType.Var) {
			return (
				<EventContainer>
					<TimeElapsed />
					<svg
						width='24px'
						height='21px'
						viewBox='0 0 24 21'
						version='1.1'
						xmlns='http://www.w3.org/2000/svg'
					>
						<title>icVar</title>
						<g id='Page-1' stroke='none' strokeWidth='1' fill='none'>
							<g id='icVar' fill='white'>
								<polygon
									id='Fill-1'
									points='11.00702 9.18445 12.57398 9.18445 11.79102 6.7395'
								></polygon>
								<path
									d='M21.43802,0 L2.504,0 C1.121,0 0,1.12 0,2.50302 L0,14.07101 C0,15.45401 1.121,16.57501 2.504,16.57501 L21.43802,16.57501 C22.82102,16.57501 23.94202,15.45401 23.94202,14.07101 L23.94202,2.50302 C23.94202,1.12 22.82102,0 21.43802,0 Z M7.081,11.68201 C7.013,11.73901 6.927,11.76801 6.83902,11.76401 L5.42301,11.763 C5.33502,11.76801 5.24903,11.73901 5.181,11.68201 C5.11902,11.62802 5.07501,11.556 5.05402,11.47601 L3.275,5.33902 L3.25702,5.25101 C3.25702,5.20001 3.27802,5.15002 3.314,5.112 C3.349,5.073 3.39902,5.051 3.45102,5.051 L4.60401,5.051 C4.68402,5.04901 4.762,5.078 4.82001,5.133 C4.87201,5.18201 4.91001,5.24301 4.93002,5.31 L6.13001,9.64401 L7.33402,5.31 C7.35202,5.24002 7.39002,5.177 7.444,5.12802 C7.50302,5.07602 7.581,5.048 7.66001,5.051 L8.814,5.051 C8.86502,5.051 8.914,5.07401 8.94602,5.11301 C8.98001,5.15201 8.99903,5.20102 8.99903,5.25201 C8.99903,5.28101 8.996,5.31 8.99002,5.33801 L7.202,11.47601 C7.18601,11.55701 7.14301,11.629 7.081,11.68201 Z M14.83301,11.70102 C14.801,11.74002 14.75501,11.76202 14.70502,11.763 L13.56101,11.763 C13.42502,11.767 13.30301,11.681 13.26102,11.551 L12.944,10.621 L10.637,10.621 L10.32001,11.551 C10.27802,11.681 10.15601,11.76602 10.02002,11.76202 L8.875,11.763 C8.82501,11.76202 8.77902,11.74002 8.74701,11.70102 C8.711,11.664 8.69101,11.61401 8.69101,11.56201 C8.69,11.53302 8.69299,11.50501 8.70001,11.47601 L10.75101,5.32901 C10.78501,5.16303 10.93402,5.04602 11.10401,5.051 L12.48102,5.051 C12.65,5.04602 12.79901,5.16303 12.83301,5.32901 L14.88101,11.47601 C14.888,11.50501 14.89102,11.53302 14.89002,11.56201 C14.89002,11.61401 14.86902,11.664 14.83301,11.70102 Z M20.676,11.70102 C20.64401,11.741 20.595,11.76401 20.54401,11.763 L19.30301,11.763 C19.138,11.767 18.991,11.66202 18.94202,11.504 L17.97302,9.423 L17.12802,9.423 L17.12802,11.52301 C17.13001,11.58801 17.107,11.65002 17.06201,11.69601 C17.01901,11.741 16.96002,11.76501 16.89902,11.763 L15.69202,11.763 C15.63202,11.76401 15.57602,11.737 15.538,11.69101 C15.495,11.646 15.47101,11.586 15.47202,11.52301 L15.47202,5.30002 C15.47,5.23602 15.49201,5.173 15.534,5.12302 C15.573,5.07602 15.63202,5.05002 15.69299,5.051 L18.11502,5.051 C18.771,5.01202 19.41901,5.21701 19.93402,5.62601 C20.38602,6.04202 20.62601,6.63901 20.58902,7.25101 C20.60101,7.651 20.50202,8.04602 20.30301,8.392 C20.11402,8.70401 19.84101,8.957 19.51502,9.121 L20.703,11.457 C20.719,11.49002 20.728,11.526 20.72901,11.56201 C20.72901,11.61401 20.71002,11.66303 20.676,11.70102 Z'
									id='Fill-2'
								></path>
								<path
									d='M18.10401,6.43002 L17.12601,6.43002 L17.12601,8.01202 L18.10501,8.01401 C18.31799,8.02902 18.52701,7.95502 18.68201,7.80801 C18.82202,7.65201 18.89401,7.44702 18.88202,7.237 C18.892,7.02402 18.82001,6.814 18.681,6.651 C18.53,6.49701 18.319,6.41602 18.10401,6.43002 Z'
									id='Fill-3'
								></path>
								<path
									d='M17.6730369,19.52002 C17.677,18.97302 17.237,18.52502 16.689,18.521 L16.68802,18.52002 L7.23102,18.52002 C6.68802,18.52502 6.25202,18.96902 6.25702,19.51202 L6.25702,19.52002 C6.24802,20.06302 6.68002,20.51102 7.22302,20.52002 L7.23102,20.52002 L16.68802,20.52002 C17.23602,20.517 17.677,20.069 17.6730369,19.522 L17.6730369,19.52002 Z'
									id='Fill-4'
								></path>
							</g>
						</g>
					</svg>
					<div className={classNames('flex flex-col', isAwayTeam ? 'items-end' : 'items-start')}>
						<PlayerWithPhoto player={event.player} />
						{event.detail && <span className='mx-2 text-sm'>{event.detail}</span>}
					</div>
				</EventContainer>
			);
		}
		return <></>;
	};

	const Score = ({ score, label }: { score: Result; label: string }) => {
		if (score.home === null || score.away == null) return <></>;
		return (
			<div className='flex flex-row items-center text-sm'>
				<div className='flex h-0.5 grow bg-gray-500 opacity-80 '></div>
				<div className='mx-8 w-max'>
					{label} {score.home} - {score.away}
				</div>
				<div className='flex h-0.5 grow bg-gray-500 opacity-80 '></div>
			</div>
		);
	};

	const HalfTimeScore = () => <Score score={game.score.halftime} label='HT' />;
	const FullTimeScore = () => <Score score={game.score.fulltime} label='FT' />;

	let addedHTScore = false;
	let addedFTScore = false;

	const events = extraInfo.events?.map((event, idx) => {
		const shouldAddHTScore = !addedHTScore && event.time.elapsed >= 45 && event.time.extra === null;
		const shouldAddFTScore = !addedFTScore && event.time.elapsed > 90 && event.time.extra === null;

		if (shouldAddHTScore) addedHTScore = shouldAddHTScore;
		if (shouldAddFTScore) addedFTScore = shouldAddFTScore;

		return (
			<div key={idx} className='w-full xl:w-1/3'>
				{shouldAddHTScore && isGameFinished(game) && <HalfTimeScore />}
				{shouldAddFTScore && isGameFinished(game) && <FullTimeScore />}

				<Event event={event} />
				{shouldAddHTScore && !isGameFinished(game) && <HalfTimeScore />}
				{shouldAddFTScore && !isGameFinished(game) && <FullTimeScore />}
			</div>
		);
	});

	return (
		<div className='flex flex-col justify-center rounded-md bg-gray-700 p-2 text-sm sm:text-base xl:items-center'>
			{isGameFinished(game) ? events : events?.reverse()}
			<Referee />
		</div>
	);
};

export default GameFacts;
