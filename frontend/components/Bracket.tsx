import { Fragment, type JSX, useMemo } from 'react';
import type { BracketConfig, Fixture, Fixtures, Standings, Team } from '../../interfaces/main';
import { isGameFinished } from '../../shared/utils';
import useCompetition from '../hooks/useCompetition';
import useMediaQuery from '../hooks/useMediaQuery';
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

const MATCH_HEIGHT = 72;
const BASE_SLOT = 88;
const COLUMN_WIDTH = 168;
const CONNECTOR_WIDTH = 28;
const HEADER_HEIGHT = 28;

const M_MATCH_HEIGHT = 68;
const M_BASE_SLOT = 84;
const M_COLUMN_WIDTH = 140;
const M_CONNECTOR_WIDTH = 22;
const M_CENTER_WIDTH = 160;

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
	matchHeight,
}: {
	fixture: Fixture;
	onClick: () => void;
	RedactedSpoilers: RedactedSpoilersType;
	matchHeight: number;
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
				'glass-card flex w-full cursor-pointer flex-col rounded-lg text-left shadow-card transition-shadow hover:shadow-card-hover'
			)}
			style={{ minHeight: matchHeight }}
			onClick={onClick}
		>
			<div className='px-2.5 pt-1.5 text-center text-[9px] tabular-nums opacity-40'>
				{formatMatchTime(fixture.fixture.date)}
			</div>
			<div
				className={classNames(
					'flex items-center justify-between gap-1.5 px-2.5 py-1',
					finished && winner === 'home' ? 'font-bold' : finished ? 'opacity-50' : ''
				)}
			>
				<span className='flex items-center gap-1.5 truncate'>
					<Flag team={fixture.teams.home} className='!mx-0' />
					<span className='truncate text-xs'>{fixture.teams.home.name}</span>
				</span>
				{finished && (
					<RedactedSpoilers>
						<span className='text-sm font-bold tabular-nums'>
							{fixture.goals.home}
							{hasPenalties && (
								<span className='ml-0.5 text-[10px] opacity-60'>({fixture.score.penalty.home})</span>
							)}
						</span>
					</RedactedSpoilers>
				)}
			</div>
			<div className='mx-2.5 border-t border-white/10' />
			<div
				className={classNames(
					'flex items-center justify-between gap-1.5 px-2.5 py-1 pb-1.5',
					finished && winner === 'away' ? 'font-bold' : finished ? 'opacity-50' : ''
				)}
			>
				<span className='flex items-center gap-1.5 truncate'>
					<Flag team={fixture.teams.away} className='!mx-0' />
					<span className='truncate text-xs'>{fixture.teams.away.name}</span>
				</span>
				{finished && (
					<RedactedSpoilers>
						<span className='text-sm font-bold tabular-nums'>
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

interface PlaceholderSlot {
	home: string;
	away: string;
	homeTeam?: Team;
	awayTeam?: Team;
}

const PlaceholderCard = ({ slot, matchHeight }: { slot: PlaceholderSlot; matchHeight: number }) => {
	const { gcc } = useCompetition();

	return (
		<div
			className={classNames(
				gcc('text-light'),
				'glass-card flex w-full flex-col justify-center rounded-lg opacity-50'
			)}
			style={{ minHeight: matchHeight }}
		>
			<div className='flex items-center gap-1.5 px-2.5 py-1.5 text-xs'>
				{slot.homeTeam && <Flag team={slot.homeTeam} className='!mx-0' />}
				{slot.home}
			</div>
			<div className='mx-2.5 border-t border-white/10' />
			<div className='flex items-center gap-1.5 px-2.5 py-1.5 text-xs'>
				{slot.awayTeam && <Flag team={slot.awayTeam} className='!mx-0' />}
				{slot.away}
			</div>
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

const MirroredConnectors = ({ matchCount, slotHeight }: { matchCount: number; slotHeight: number }) => {
	const pairs = matchCount / 2;
	const elements = [];

	for (let i = 0; i < pairs; i++) {
		const y1 = slotHeight * (i * 2) + slotHeight / 2;
		const y2 = slotHeight * (i * 2 + 1) + slotHeight / 2;
		const yMid = (y1 + y2) / 2;

		elements.push(
			<Fragment key={i}>
				<div
					className='absolute right-0 w-1/2 rounded-tl-md border-l-2 border-t-2 border-white/15'
					style={{ top: y1, height: yMid - y1 }}
				/>
				<div
					className='absolute right-0 w-1/2 rounded-bl-md border-b-2 border-l-2 border-white/15'
					style={{ top: yMid, height: y2 - yMid }}
				/>
				<div className='absolute left-0 w-1/2 border-t-2 border-white/15' style={{ top: yMid }} />
			</Fragment>
		);
	}

	return <>{elements}</>;
};

type ResolvedSlot = { fixture: Fixture } | { slot: PlaceholderSlot };

type RoundSlots = { name: string; slots: ResolvedSlot[] };

const resolveSlotTeamIds = (label: string, groupMap: Map<string, number>): number[] => {
	const m = label.match(/^(\d+(?:st|nd|rd|th))\s+(.+)$/);
	if (!m) return [];
	const [, rank, groups] = m;
	if (groups.includes('/')) {
		return groups
			.split('/')
			.map(g => groupMap.get(`${rank} ${g}`))
			.filter((id): id is number => id != null);
	}
	const id = groupMap.get(`${rank} ${groups}`);
	return id != null ? [id] : [];
};

const getSlotTeamIds = (resolved: ResolvedSlot): number[] => {
	if (!('fixture' in resolved)) return [];
	return [resolved.fixture.teams.home.id, resolved.fixture.teams.away.id];
};

const describeSlotOutcome = (
	resolved: ResolvedSlot,
	type: 'W' | 'L',
	roundName: string
): { label: string; team?: Team } => {
	if ('fixture' in resolved) {
		const f = resolved.fixture;
		if (isGameFinished(f)) {
			const homeWins =
				f.goals.home > f.goals.away ||
				(f.goals.home === f.goals.away && f.score.penalty.home > f.score.penalty.away);
			const team = (type === 'W') === homeWins ? f.teams.home : f.teams.away;
			return { label: team.name, team };
		}
		return { label: `${type} ${f.teams.home.name} / ${f.teams.away.name}` };
	}
	const short = ROUND_SHORT[roundName] ?? roundName;
	if (resolved.slot.home.startsWith('W ') || resolved.slot.home.startsWith('L ')) {
		return { label: `${type} ${short}` };
	}
	return { label: `${type} ${resolved.slot.home} / ${resolved.slot.away}` };
};

const getQualifyingThirdPlaceKey = (standings: Standings, count: number): string | null => {
	const seen = new Map<string, { points: number; goalsDiff: number; goalsFor: number }>();
	for (const [, groupStandings] of standings) {
		for (const s of groupStandings) {
			if (s.rank !== 3) continue;
			const letter = s.group?.split(' ').pop() ?? '';
			if (!letter || !/^[A-L]$/.test(letter)) continue;
			seen.set(letter, {
				points: s.points ?? 0,
				goalsDiff: s.goalsDiff ?? 0,
				goalsFor: s.all?.goals?.for ?? 0,
			});
		}
	}
	if (seen.size < count) return null;
	const sorted = [...seen.entries()]
		.map(([group, stats]) => ({ group, ...stats }))
		.sort((a, b) => {
			if (a.points !== b.points) return b.points - a.points;
			if (a.goalsDiff !== b.goalsDiff) return b.goalsDiff - a.goalsDiff;
			return b.goalsFor - a.goalsFor;
		});
	return sorted
		.slice(0, count)
		.map(t => t.group)
		.sort()
		.join('');
};

const useBracketData = (fixtures: Fixtures, bracket: BracketConfig | undefined, standings: Standings) => {
	return useMemo(() => {
		if (!bracket) return { roundData: [], thirdPlace: null };

		const allFixtures = Object.values(fixtures);

		const groupMap = new Map<string, number>();
		const groupNameMap = new Map<string, string>();
		const groupTeamMap = new Map<string, Team>();
		for (const [, groupStandings] of standings) {
			for (const s of groupStandings) {
				const letter = s.group.split(' ').pop() ?? '';
				const ordinal = s.rank === 1 ? '1st' : s.rank === 2 ? '2nd' : s.rank === 3 ? '3rd' : null;
				if (ordinal && letter) {
					const key = `${ordinal} ${letter}`;
					groupMap.set(key, s.team.id);
					groupNameMap.set(key, s.team.name);
					groupTeamMap.set(key, s.team);
				}
			}
		}

		const r32ResolvedAway = new Map<number, string>();
		if (bracket.thirdPlaceCombinations) {
			const { matchups, table } = bracket.thirdPlaceCombinations;
			const comboKey = getQualifyingThirdPlaceKey(standings, matchups.length);
			const assignments = comboKey ? table[comboKey] : null;
			if (assignments) {
				bracket.rounds[0].slots?.forEach((slot, i) => {
					if (!slot.away.includes('/')) return;
					const homeMatch = slot.home.match(/^1st\s+([A-L])$/);
					if (!homeMatch) return;
					const idx = matchups.indexOf(homeMatch[1]);
					if (idx === -1) return;
					r32ResolvedAway.set(i, `3rd ${assignments[idx]}`);
				});
			}
		}

		const roundData: RoundSlots[] = [];
		let prevSlots: ResolvedSlot[] = [];

		for (let r = 0; r < bracket.rounds.length; r++) {
			const round = bracket.rounds[r];
			const roundFixtures = allFixtures.filter(f => f.league.round === round.name);
			const usedIds = new Set<number>();

			const slotCount = round.slots?.length ?? prevSlots.length / 2;
			const resolved: ResolvedSlot[] = Array.from({ length: slotCount }, (_, slotIndex) => {
				let fixture: Fixture | undefined;
				const slot = round.slots?.[slotIndex];

				if (slot) {
					const awayLabel = r32ResolvedAway.get(slotIndex) ?? slot.away;
					const homeIds = resolveSlotTeamIds(slot.home, groupMap);
					const awayIds = resolveSlotTeamIds(awayLabel, groupMap);
					fixture = roundFixtures.find(
						f =>
							!usedIds.has(f.fixture.id) &&
							homeIds.includes(f.teams.home.id) &&
							awayIds.includes(f.teams.away.id)
					);
				} else {
					const feed1 = getSlotTeamIds(prevSlots[slotIndex * 2]);
					const feed2 = getSlotTeamIds(prevSlots[slotIndex * 2 + 1]);
					if (feed1.length > 0 && feed2.length > 0) {
						fixture = roundFixtures.find(f => {
							if (usedIds.has(f.fixture.id)) return false;
							const ft = [f.teams.home.id, f.teams.away.id];
							return ft.some(t => feed1.includes(t)) && ft.some(t => feed2.includes(t));
						});
					}
				}

				if (fixture) {
					usedIds.add(fixture.fixture.id);
					return { fixture } as ResolvedSlot;
				}

				if (!slot) {
					const prevRoundName = bracket.rounds[r - 1].name;
					const feed1 = prevSlots[slotIndex * 2];
					const feed2 = prevSlots[slotIndex * 2 + 1];
					const home = describeSlotOutcome(feed1, 'W', prevRoundName);
					const away = describeSlotOutcome(feed2, 'W', prevRoundName);
					return {
						slot: {
							home: home.label,
							away: away.label,
							homeTeam: home.team,
							awayTeam: away.team,
						},
					} as ResolvedSlot;
				}
				const awayLabel = r32ResolvedAway.get(slotIndex) ?? slot.away;
				return {
					slot: {
						home: groupNameMap.get(slot.home) ?? slot.home,
						away: groupNameMap.get(awayLabel) ?? awayLabel,
						homeTeam: groupTeamMap.get(slot.home),
						awayTeam: groupTeamMap.get(awayLabel),
					},
				} as ResolvedSlot;
			});

			roundData.push({ name: round.name, slots: resolved });
			prevSlots = resolved;
		}

		let thirdPlace: ResolvedSlot | null = null;
		if (bracket.thirdPlace) {
			const thirdPlaceFixture = allFixtures.find(f => f.league.round === '3rd Place Final');
			if (thirdPlaceFixture) {
				thirdPlace = { fixture: thirdPlaceFixture };
			} else {
				const sfRound = roundData.find(r => r.name === 'Semi-finals');
				if (sfRound && sfRound.slots.length === 2) {
					const tpHome = describeSlotOutcome(sfRound.slots[0], 'L', 'Semi-finals');
					const tpAway = describeSlotOutcome(sfRound.slots[1], 'L', 'Semi-finals');
					thirdPlace = {
						slot: {
							home: tpHome.label,
							away: tpAway.label,
							homeTeam: tpHome.team,
							awayTeam: tpAway.team,
						},
					};
				} else {
					thirdPlace = { slot: bracket.thirdPlace };
				}
			}
		}

		return { roundData, thirdPlace };
	}, [fixtures, bracket, standings]);
};

const useRenderSlot = () => {
	const setRoute = useTournamentStore(s => s.setRoute);
	const { RedactedSpoilers } = useNoSpoilers();

	return (resolved: ResolvedSlot, matchHeight: number) => {
		if ('fixture' in resolved) {
			return (
				<BracketMatchCard
					fixture={resolved.fixture}
					onClick={() => setRoute({ page: Route.Match, data: resolved.fixture.fixture.id })}
					RedactedSpoilers={RedactedSpoilers}
					matchHeight={matchHeight}
				/>
			);
		}
		return <PlaceholderCard slot={resolved.slot} matchHeight={matchHeight} />;
	};
};

const RoundColumn = ({
	round,
	roundIndex,
	totalHeight,
	colWidth,
	matchHeight,
	baseSlot,
	renderSlot,
}: {
	round: RoundSlots;
	roundIndex: number;
	totalHeight: number;
	colWidth: number;
	matchHeight: number;
	baseSlot: number;
	renderSlot: (resolved: ResolvedSlot, matchHeight: number) => JSX.Element;
}) => {
	const slotHeight = baseSlot * Math.pow(2, roundIndex);

	return (
		<div className='relative shrink-0' style={{ width: colWidth, height: totalHeight }}>
			{round.slots.map((resolved, slotIndex) => {
				const yCenter = slotHeight * slotIndex + slotHeight / 2;
				const yTop = yCenter - matchHeight / 2;
				const key = 'fixture' in resolved ? resolved.fixture.fixture.id : `placeholder-${slotIndex}`;

				return (
					<div key={key} className='absolute px-1' style={{ top: yTop, left: 0, right: 0 }}>
						{renderSlot(resolved, matchHeight)}
					</div>
				);
			})}
		</div>
	);
};

const LinearBracket = ({
	roundData,
	thirdPlace,
	renderSlot,
	gcc,
}: {
	roundData: RoundSlots[];
	thirdPlace: ResolvedSlot | null;
	renderSlot: (resolved: ResolvedSlot, matchHeight: number) => JSX.Element;
	gcc: (p?: string) => string;
}) => {
	const firstRoundSlotCount = roundData[0].slots.length;
	const totalHeight = firstRoundSlotCount * BASE_SLOT;
	const bracketWidth = roundData.length * COLUMN_WIDTH + (roundData.length - 1) * CONNECTOR_WIDTH;

	return (
		<div className='mx-2 md:mx-8'>
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
									<RoundColumn
										round={round}
										roundIndex={roundIndex}
										totalHeight={totalHeight}
										colWidth={COLUMN_WIDTH}
										matchHeight={MATCH_HEIGHT}
										baseSlot={BASE_SLOT}
										renderSlot={renderSlot}
									/>
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
						<div style={{ width: COLUMN_WIDTH }}>{renderSlot(thirdPlace, MATCH_HEIGHT)}</div>
					</div>
				)}
			</div>
		</div>
	);
};

const MirroredBracket = ({
	roundData,
	thirdPlace,
	renderSlot,
	gcc,
}: {
	roundData: RoundSlots[];
	thirdPlace: ResolvedSlot | null;
	renderSlot: (resolved: ResolvedSlot, matchHeight: number) => JSX.Element;
	gcc: (p?: string) => string;
}) => {
	const allButFinal = roundData.slice(0, -1);
	const finalRound = roundData[roundData.length - 1];

	const leftRounds = allButFinal.map(r => ({ name: r.name, slots: r.slots.slice(0, r.slots.length / 2) }));
	const rightRounds = allButFinal.map(r => ({ name: r.name, slots: r.slots.slice(r.slots.length / 2) }));

	const halfSlotCount = leftRounds[0].slots.length;
	const halfHeight = halfSlotCount * M_BASE_SLOT;

	const rightArmDisplay = rightRounds.map((round, i) => ({ round, roundIndex: i })).reverse();

	const armWidth = allButFinal.length * M_COLUMN_WIDTH + (allButFinal.length - 1) * M_CONNECTOR_WIDTH;
	const totalWidth = armWidth * 2 + M_CENTER_WIDTH + M_CONNECTOR_WIDTH * 2;

	return (
		<div className='mx-2'>
			<div className='overflow-x-auto pb-4'>
				<div className='mx-auto' style={{ width: totalWidth }}>
					<div className='flex' style={{ height: halfHeight }}>
						{/* Left arm: R32 → R16 → QF → SF */}
						{leftRounds.map((round, roundIndex) => {
							const slotHeight = M_BASE_SLOT * Math.pow(2, roundIndex);
							return (
								<Fragment key={`left-${round.name}`}>
									<RoundColumn
										round={round}
										roundIndex={roundIndex}
										totalHeight={halfHeight}
										colWidth={M_COLUMN_WIDTH}
										matchHeight={M_MATCH_HEIGHT}
										baseSlot={M_BASE_SLOT}
										renderSlot={renderSlot}
									/>
									{roundIndex < leftRounds.length - 1 && (
										<div
											className='relative shrink-0'
											style={{ width: M_CONNECTOR_WIDTH, height: halfHeight }}
										>
											<Connectors matchCount={round.slots.length} slotHeight={slotHeight} />
										</div>
									)}
								</Fragment>
							);
						})}

						{/* Left connector to center */}
						<div className='relative shrink-0' style={{ width: M_CONNECTOR_WIDTH, height: halfHeight }}>
							<div
								className='absolute inset-x-0 border-t-2 border-white/15'
								style={{ top: halfHeight / 2 }}
							/>
						</div>

						{/* Center: Champion + Final + 3rd Place */}
						<div
							className={classNames(
								gcc('text-light'),
								'relative flex shrink-0 flex-col items-center justify-center gap-3'
							)}
							style={{ width: M_CENTER_WIDTH, height: halfHeight }}
						>
							<div className='flex flex-col items-center gap-1'>
								<div className='text-3xl'>🏆</div>
								<div className='text-[10px] font-bold uppercase tracking-wider opacity-60'>
									Champion
								</div>
							</div>
							<div className='w-full px-1'>{renderSlot(finalRound.slots[0], M_MATCH_HEIGHT)}</div>
							<div className='text-[10px] font-bold uppercase tracking-wider opacity-40'>Final</div>
							{thirdPlace && (
								<>
									<div className='w-full px-1'>{renderSlot(thirdPlace, M_MATCH_HEIGHT)}</div>
									<div className='text-[10px] font-bold uppercase tracking-wider opacity-40'>
										3rd Place
									</div>
								</>
							)}
						</div>

						{/* Right connector from center */}
						<div className='relative shrink-0' style={{ width: M_CONNECTOR_WIDTH, height: halfHeight }}>
							<div
								className='absolute inset-x-0 border-t-2 border-white/15'
								style={{ top: halfHeight / 2 }}
							/>
						</div>

						{/* Right arm (mirrored): SF → QF → R16 → R32 */}
						{rightArmDisplay.map(({ round, roundIndex }, displayIndex) => {
							const slotHeight = M_BASE_SLOT * Math.pow(2, roundIndex);
							return (
								<Fragment key={`right-${round.name}`}>
									{displayIndex > 0 && (
										<div
											className='relative shrink-0'
											style={{ width: M_CONNECTOR_WIDTH, height: halfHeight }}
										>
											<MirroredConnectors
												matchCount={round.slots.length}
												slotHeight={slotHeight}
											/>
										</div>
									)}
									<RoundColumn
										round={round}
										roundIndex={roundIndex}
										totalHeight={halfHeight}
										colWidth={M_COLUMN_WIDTH}
										matchHeight={M_MATCH_HEIGHT}
										baseSlot={M_BASE_SLOT}
										renderSlot={renderSlot}
									/>
								</Fragment>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
};

const BracketPage = ({ fixtures }: { fixtures: Fixtures }) => {
	const { gcc, competition } = useCompetition();
	const bracket = competition.bracket;
	const standings = useTournamentStore(s => s.standings);
	const { roundData, thirdPlace } = useBracketData(fixtures, bracket, standings);
	const renderSlot = useRenderSlot();
	const isDesktop = useMediaQuery('(min-width: 1536px)');

	if (!bracket || roundData.length === 0) {
		return (
			<div className={classNames(gcc('text-light'), 'flex items-center justify-center p-12 text-lg opacity-60')}>
				Bracket not available
			</div>
		);
	}

	const canMirror = roundData.length >= 3 && roundData[0].slots.length >= 4;

	if (isDesktop && canMirror) {
		return <MirroredBracket roundData={roundData} thirdPlace={thirdPlace} renderSlot={renderSlot} gcc={gcc} />;
	}

	return <LinearBracket roundData={roundData} thirdPlace={thirdPlace} renderSlot={renderSlot} gcc={gcc} />;
};

export default BracketPage;
