import { Fragment, useMemo } from 'react';
import type { BracketConfig, BracketSlot, Fixture, Fixtures } from '../../interfaces/main';
import { isGameFinished } from '../../shared/utils';
import useCompetition from '../hooks/useCompetition';
import useNoSpoilers from '../hooks/useNoSpoilers';
import { classNames } from '../lib/utils/reactHelper';
import { Route, useTournamentStore } from '../store/tournamentStore';
import Flag from './Flag';

const ROUND_SHORT: Record<string, string> = {
	'Round of 32': 'R32',
	'Round of 16': 'R16',
	'Quarter-finals': 'QF',
	'Semi-finals': 'SF',
	Final: 'Final',
};

const MATCH_HEIGHT = 56;
const BASE_SLOT = 72;
const COLUMN_WIDTH = 168;
const CONNECTOR_WIDTH = 28;
const HEADER_HEIGHT = 28;

const formatMatchTime = (isoStr: string) => {
	const d = new Date(isoStr);
	const day = String(d.getDate()).padStart(2, '0');
	const month = d.toLocaleString('en-US', { month: 'short' });
	const hours = String(d.getHours()).padStart(2, '0');
	const mins = String(d.getMinutes()).padStart(2, '0');
	return `${day} ${month} ${hours}:${mins}`;
};

type RedactedSpoilersType = ReturnType<typeof useNoSpoilers>['RedactedSpoilers'];

const BracketMatchCard = ({
	fixture,
	onClick,
	RedactedSpoilers,
}: {
	fixture: Fixture;
	onClick: () => void;
	RedactedSpoilers: RedactedSpoilersType;
}) => {
	const { gcc } = useCompetition();
	const finished = isGameFinished(fixture);

	const winner = finished
		? fixture.goals.home > fixture.goals.away ||
			(fixture.goals.home === fixture.goals.away && fixture.score.penalty.home > fixture.score.penalty.away)
			? 'home'
			: 'away'
		: null;

	const hasPenalties = finished && fixture.score.penalty.home != null;

	return (
		<button
			className={classNames(
				gcc('text-light'),
				'glass-card flex w-full cursor-pointer flex-col justify-center rounded-lg text-left shadow-card transition-shadow hover:shadow-card-hover'
			)}
			style={{ height: MATCH_HEIGHT }}
			onClick={onClick}
		>
			<div
				className={classNames(
					'flex items-center justify-between gap-1 px-2 py-1',
					finished && winner === 'home' ? 'font-bold' : finished ? 'opacity-50' : ''
				)}
			>
				<span className='flex items-center gap-1 truncate'>
					<Flag team={fixture.teams.home} className='!mx-0' />
					<span className='truncate text-xs'>{fixture.teams.home.name}</span>
				</span>
				{finished ? (
					<RedactedSpoilers>
						<span className='text-xs font-bold tabular-nums'>
							{fixture.goals.home}
							{hasPenalties && (
								<span className='ml-0.5 text-[10px] opacity-60'>({fixture.score.penalty.home})</span>
							)}
						</span>
					</RedactedSpoilers>
				) : (
					<span className='text-[9px] tabular-nums opacity-40'>{formatMatchTime(fixture.fixture.date)}</span>
				)}
			</div>
			<div className='mx-2 border-t border-white/10' />
			<div
				className={classNames(
					'flex items-center justify-between gap-1 px-2 py-1',
					finished && winner === 'away' ? 'font-bold' : finished ? 'opacity-50' : ''
				)}
			>
				<span className='flex items-center gap-1 truncate'>
					<Flag team={fixture.teams.away} className='!mx-0' />
					<span className='truncate text-xs'>{fixture.teams.away.name}</span>
				</span>
				{finished && (
					<RedactedSpoilers>
						<span className='text-xs font-bold tabular-nums'>
							{fixture.goals.away}
							{hasPenalties && (
								<span className='ml-0.5 text-[10px] opacity-60'>({fixture.score.penalty.away})</span>
							)}
						</span>
					</RedactedSpoilers>
				)}
			</div>
		</button>
	);
};

const PlaceholderCard = ({ slot }: { slot: BracketSlot }) => {
	const { gcc } = useCompetition();

	return (
		<div
			className={classNames(
				gcc('text-light'),
				'glass-card flex w-full flex-col justify-center rounded-lg opacity-50'
			)}
			style={{ height: MATCH_HEIGHT }}
		>
			<div className='px-2 py-1 text-xs'>{slot.home}</div>
			<div className='mx-2 border-t border-white/10' />
			<div className='px-2 py-1 text-xs'>{slot.away}</div>
		</div>
	);
};

const Connectors = ({ matchCount, slotHeight }: { matchCount: number; slotHeight: number }) => {
	const pairs = matchCount / 2;
	const elements = [];

	for (let i = 0; i < pairs; i++) {
		const y1 = slotHeight * (i * 2) + slotHeight / 2;
		const y2 = slotHeight * (i * 2 + 1) + slotHeight / 2;
		const yMid = (y1 + y2) / 2;

		elements.push(
			<Fragment key={i}>
				<div
					className='absolute left-0 w-1/2 rounded-tr-md border-r-2 border-t-2 border-white/15'
					style={{ top: y1, height: yMid - y1 }}
				/>
				<div
					className='absolute left-0 w-1/2 rounded-br-md border-b-2 border-r-2 border-white/15'
					style={{ top: yMid, height: y2 - yMid }}
				/>
				<div className='absolute right-0 w-1/2 border-t-2 border-white/15' style={{ top: yMid }} />
			</Fragment>
		);
	}

	return <>{elements}</>;
};

type ResolvedSlot = { fixture: Fixture } | { slot: BracketSlot };

const useBracketData = (fixtures: Fixtures, bracket: BracketConfig | undefined) => {
	return useMemo(() => {
		if (!bracket) return { roundData: [], thirdPlace: null };

		const allFixtures = Object.values(fixtures);

		const roundData = bracket.rounds.map(round => {
			const roundFixtures = allFixtures
				.filter(f => f.league.round === round.name)
				.sort((a, b) => a.fixture.timestamp - b.fixture.timestamp);

			const resolved: ResolvedSlot[] = round.fixtureOrder.map((chronoIndex, bracketIndex) => {
				const fixture = roundFixtures[chronoIndex];
				if (fixture) return { fixture };
				return { slot: round.slots[bracketIndex] };
			});

			return { name: round.name, slots: resolved };
		});

		let thirdPlace: ResolvedSlot | null = null;
		if (bracket.thirdPlace) {
			const thirdPlaceFixture = allFixtures.find(f => f.league.round === '3rd Place Final');
			thirdPlace = thirdPlaceFixture ? { fixture: thirdPlaceFixture } : { slot: bracket.thirdPlace };
		}

		return { roundData, thirdPlace };
	}, [fixtures, bracket]);
};

const BracketPage = ({ fixtures }: { fixtures: Fixtures }) => {
	const { gcc, competition } = useCompetition();
	const setRoute = useTournamentStore(s => s.setRoute);
	const { RedactedSpoilers } = useNoSpoilers();

	const bracket = competition.bracket;

	const { roundData, thirdPlace } = useBracketData(fixtures, bracket);

	if (!bracket || roundData.length === 0) {
		return (
			<div className={classNames(gcc('text-light'), 'flex items-center justify-center p-12 text-lg opacity-60')}>
				Bracket not available
			</div>
		);
	}

	const firstRoundSlotCount = roundData[0].slots.length;
	const totalHeight = firstRoundSlotCount * BASE_SLOT;
	const bracketWidth = roundData.length * COLUMN_WIDTH + (roundData.length - 1) * CONNECTOR_WIDTH;

	const renderSlot = (resolved: ResolvedSlot) => {
		if ('fixture' in resolved) {
			return (
				<BracketMatchCard
					fixture={resolved.fixture}
					onClick={() => setRoute({ page: Route.Match, data: resolved.fixture.fixture.id })}
					RedactedSpoilers={RedactedSpoilers}
				/>
			);
		}
		return <PlaceholderCard slot={resolved.slot} />;
	};

	return (
		<div className='mx-2 md:mx-8 lg:mx-16'>
			<div className='overflow-x-auto pb-4'>
				<div className='mx-auto' style={{ width: bracketWidth }}>
					<div className='flex'>
						{roundData.map((round, i) => (
							<Fragment key={round.name}>
								<div
									className={classNames(gcc('text-light'), 'shrink-0 text-center text-xs font-bold')}
									style={{
										width: COLUMN_WIDTH,
										height: HEADER_HEIGHT,
										lineHeight: `${HEADER_HEIGHT}px`,
									}}
								>
									<span className='hidden sm:inline'>{round.name}</span>
									<span className='sm:hidden'>{ROUND_SHORT[round.name] ?? round.name}</span>
								</div>
								{i < roundData.length - 1 && (
									<div className='shrink-0' style={{ width: CONNECTOR_WIDTH }} />
								)}
							</Fragment>
						))}
					</div>

					<div className='flex' style={{ height: totalHeight }}>
						{roundData.map((round, roundIndex) => {
							const slotHeight = BASE_SLOT * Math.pow(2, roundIndex);

							return (
								<Fragment key={round.name}>
									<div
										className='relative shrink-0'
										style={{ width: COLUMN_WIDTH, height: totalHeight }}
									>
										{round.slots.map((resolved, slotIndex) => {
											const yCenter = slotHeight * slotIndex + slotHeight / 2;
											const yTop = yCenter - MATCH_HEIGHT / 2;
											const key =
												'fixture' in resolved
													? resolved.fixture.fixture.id
													: `placeholder-${slotIndex}`;

											return (
												<div
													key={key}
													className='absolute px-1'
													style={{ top: yTop, left: 0, right: 0 }}
												>
													{renderSlot(resolved)}
												</div>
											);
										})}
									</div>

									{roundIndex < roundData.length - 1 && (
										<div
											className='relative shrink-0'
											style={{ width: CONNECTOR_WIDTH, height: totalHeight }}
										>
											<Connectors matchCount={round.slots.length} slotHeight={slotHeight} />
										</div>
									)}
								</Fragment>
							);
						})}
					</div>
				</div>

				{thirdPlace && (
					<div className='mt-6 flex flex-col items-center gap-1'>
						<span className={classNames(gcc('text-light'), 'text-xs font-bold')}>3rd Place</span>
						<div style={{ width: COLUMN_WIDTH }}>{renderSlot(thirdPlace)}</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default BracketPage;
