import { Fragment, type JSX, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BracketConfig, Fixture, Fixtures, Prediction, Standings, Team } from '../../interfaces/main';
import {
	getUpsetSide,
	isDrawFavorite,
	isGameFinished,
	isGameStarted,
	isNum,
	isPredictionUpset,
} from '../../shared/utils';
import useCompetition from '../hooks/useCompetition';
import ScoreInput from './ScoreInput';
import useMediaQuery from '../hooks/useMediaQuery';
import useNoSpoilers from '../hooks/useNoSpoilers';
import { classNames, getCurrentDate } from '../lib/utils/reactHelper';
import { Route, useTournamentStore } from '../store/tournamentStore';
import Flag from './Flag';
import { getPredictionResult } from './ResultContainer';

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
	date?: string;
}

const PlaceholderCard = ({ slot, matchHeight }: { slot: PlaceholderSlot; matchHeight: number }) => {
	const { gcc } = useCompetition();

	return (
		<div
			className={classNames(gcc('text-light'), 'glass-card flex w-full flex-col rounded-lg opacity-50')}
			style={{ minHeight: matchHeight }}
		>
			{slot.date && (
				<div className='px-2.5 pt-1.5 text-center text-[9px] tabular-nums opacity-40'>
					{formatMatchTime(slot.date)}
				</div>
			)}
			<div className={classNames('flex items-center gap-1.5 px-2.5 py-1', slot.date ? '' : 'pt-1.5')}>
				{slot.homeTeam && <Flag team={slot.homeTeam} className='!mx-0' />}
				<span className='truncate text-xs'>{slot.home}</span>
			</div>
			<div className='mx-2.5 border-t border-white/10' />
			<div className='flex items-center gap-1.5 px-2.5 py-1 pb-1.5'>
				{slot.awayTeam && <Flag team={slot.awayTeam} className='!mx-0' />}
				<span className='truncate text-xs'>{slot.away}</span>
			</div>
		</div>
	);
};

const DEFAULT_PREDICTION = { home: null, away: null } as unknown as Prediction;

const MobileBracketMatchCard = ({ fixture }: { fixture: Fixture }) => {
	const { gcc, competition } = useCompetition();
	const { RedactedSpoilers, noSpoilers } = useNoSpoilers();
	const setRoute = useTournamentStore(s => s.setRoute);
	const predictions = useTournamentStore(s => s.predictions);
	const updatePrediction = useTournamentStore(s => s.updatePrediction);
	const odds = useTournamentStore(s => s.odds);
	const uid = useTournamentStore(s => s.uid);

	const homeInputRef = useRef<HTMLInputElement>(null);
	const awayInputRef = useRef<HTMLInputElement>(null);

	const finished = isGameFinished(fixture);
	const started = isGameStarted(fixture);
	const gameID = fixture.fixture.id;
	const prediction = predictions?.[gameID]?.[uid] || DEFAULT_PREDICTION;
	const gameOdds = odds?.[gameID];
	const isInPast = getCurrentDate().getTime() >= new Date(fixture.fixture.date).getTime();
	const hasUpsetConfig = (competition.points.upset ?? 0) > 0;

	const winner = finished
		? fixture.goals.home > fixture.goals.away ||
			(fixture.goals.home === fixture.goals.away && fixture.score.penalty.home > fixture.score.penalty.away)
			? 'home'
			: 'away'
		: null;

	const hasPenalties = finished && fixture.score.penalty.home != null;

	const { isExactScore, isCorrectResult, isCorrectGoal, isWrong, isPredictValid } = started
		? getPredictionResult(prediction, fixture)
		: { isExactScore: false, isCorrectResult: false, isCorrectGoal: false, isWrong: false, isPredictValid: false };

	const resultBg =
		noSpoilers || !started
			? ''
			: isExactScore
				? 'bracket-result-exact'
				: isCorrectResult
					? 'bracket-result-correct'
					: isCorrectGoal
						? 'bracket-result-goal'
						: isWrong
							? 'bracket-result-wrong'
							: '';

	const upsetSide = !isInPast && hasUpsetConfig && gameOdds ? getUpsetSide(gameOdds) : null;

	const onPredictionChange = useCallback(
		async (value: string, team: 'home' | 'away') => {
			const parsed = parseInt(value);
			await updatePrediction({ ...prediction, [team]: isNaN(parsed) ? null : parsed }, gameID);
		},
		[prediction, gameID, updatePrediction]
	);

	const hasPrediction = isNum(prediction.home) && isNum(prediction.away);

	const handleClick = () => {
		if (!isInPast && !hasPrediction) {
			homeInputRef.current?.focus();
			return;
		}
		setRoute({ page: Route.Match, data: gameID });
	};

	const renderTeamScore = (side: 'home' | 'away') => {
		if (!isInPast) {
			return (
				<div className='flex shrink-0 items-center gap-1' onClick={e => e.stopPropagation()}>
					<ScoreInput
						innerRef={side === 'home' ? homeInputRef : awayInputRef}
						id={`bracket-${gameID}-${side}`}
						value={prediction[side]}
						className='!sm:h-7 !sm:w-9 !h-7 !w-9 !p-0 text-xs'
						onchange={e => onPredictionChange(e.target.value, side)}
					/>
				</div>
			);
		}
		return (
			<RedactedSpoilers>
				<span
					className={classNames(
						'shrink-0 text-xs font-bold tabular-nums',
						isPredictValid ? 'opacity-70' : 'text-red-400 opacity-40'
					)}
				>
					{isNum(prediction[side]) ? prediction[side] : '–'}
				</span>
			</RedactedSpoilers>
		);
	};

	return (
		<div
			className={classNames(
				gcc('text-light'),
				'glass-card relative flex w-full flex-col rounded-lg shadow-card transition-shadow hover:shadow-card-hover',
				resultBg
			)}
			onClick={handleClick}
		>
			{/* Date + Odds row */}
			<div className='flex items-center justify-between px-2.5 pt-1.5'>
				<span className='text-[9px] tabular-nums opacity-40'>{formatMatchTime(fixture.fixture.date)}</span>
				{gameOdds ? (
					<div className='flex items-center gap-0.5 text-[9px] tabular-nums'>
						<span
							className={classNames(
								'rounded px-1 py-0.5',
								upsetSide === 'home'
									? 'bg-cyan-700/30 font-bold text-cyan-300'
									: !isDrawFavorite(gameOdds) && gameOdds.home <= gameOdds.away
										? 'font-bold opacity-80'
										: 'opacity-40'
							)}
						>
							{gameOdds.home.toFixed(2)}
						</span>
						<span
							className={classNames(
								'rounded px-1 py-0.5',
								isDrawFavorite(gameOdds) ? 'font-bold opacity-80' : 'opacity-40'
							)}
						>
							{gameOdds.draw.toFixed(2)}
						</span>
						<span
							className={classNames(
								'rounded px-1 py-0.5',
								upsetSide === 'away'
									? 'bg-cyan-700/30 font-bold text-cyan-300'
									: !isDrawFavorite(gameOdds) && gameOdds.away <= gameOdds.home
										? 'font-bold opacity-80'
										: 'opacity-40'
							)}
						>
							{gameOdds.away.toFixed(2)}
						</span>
					</div>
				) : (
					<span />
				)}
			</div>

			{/* Home team row */}
			<div
				className={classNames(
					'flex items-center justify-between gap-1.5 px-2.5 py-1',
					finished && winner === 'home' ? 'font-bold' : finished ? 'opacity-50' : ''
				)}
			>
				<span className='flex min-w-0 items-center gap-1.5'>
					<Flag team={fixture.teams.home} className='!mx-0' />
					<span className='truncate text-xs'>{fixture.teams.home.name}</span>
					{upsetSide === 'home' && <span className='size-1.5 shrink-0 rounded-full bg-cyan-500' />}
				</span>
				<span className='flex shrink-0 items-center gap-2'>
					{renderTeamScore('home')}
					{finished && (
						<RedactedSpoilers>
							<span className='text-sm font-bold tabular-nums'>
								{fixture.goals.home}
								{hasPenalties && (
									<span className='ml-0.5 text-[10px] opacity-60'>
										({fixture.score.penalty.home})
									</span>
								)}
							</span>
						</RedactedSpoilers>
					)}
				</span>
			</div>

			<div className='mx-2.5 border-t border-white/10' />

			{/* Away team row */}
			<div
				className={classNames(
					'flex items-center justify-between gap-1.5 px-2.5 py-1 pb-1.5',
					finished && winner === 'away' ? 'font-bold' : finished ? 'opacity-50' : ''
				)}
			>
				<span className='flex min-w-0 items-center gap-1.5'>
					<Flag team={fixture.teams.away} className='!mx-0' />
					<span className='truncate text-xs'>{fixture.teams.away.name}</span>
					{upsetSide === 'away' && <span className='size-1.5 shrink-0 rounded-full bg-cyan-500' />}
				</span>
				<span className='flex shrink-0 items-center gap-2'>
					{renderTeamScore('away')}
					{finished && (
						<RedactedSpoilers>
							<span className='text-sm font-bold tabular-nums'>
								{fixture.goals.away}
								{hasPenalties && (
									<span className='ml-0.5 text-[10px] opacity-60'>
										({fixture.score.penalty.away})
									</span>
								)}
							</span>
						</RedactedSpoilers>
					)}
				</span>
			</div>

			{/* Upset badge */}
			{!isInPast &&
				hasUpsetConfig &&
				gameOdds &&
				isNum(prediction.home) &&
				isNum(prediction.away) &&
				isPredictionUpset(prediction, gameOdds) && (
					<div className='border-t border-white/10 px-2.5 py-1 text-center'>
						<span className='rounded-full bg-cyan-700 px-1.5 py-0.5 text-[8px] font-bold'>Upset pick</span>
					</div>
				)}
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
				const date = round.matchInfo?.[slotIndex]?.date;

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
							date,
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
						date,
					},
				} as ResolvedSlot;
			});

			roundData.push({ name: round.name, slots: resolved });
			prevSlots = resolved;
		}

		let thirdPlace: ResolvedSlot | null = null;
		if (bracket.thirdPlace) {
			const tpDate = bracket.thirdPlaceInfo?.date;
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
							date: tpDate,
						},
					};
				} else {
					thirdPlace = { slot: { ...bracket.thirdPlace, date: tpDate } };
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

const useMobileRenderSlot = () => {
	return (resolved: ResolvedSlot, matchHeight: number) => {
		if ('fixture' in resolved) {
			return <MobileBracketMatchCard fixture={resolved.fixture} />;
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

const M_PAIR_GAP = 8;
const M_PAIR_BETWEEN_GAP = 20;
const M_CONN_WIDTH = 24;

const MobilePairConnector = () => {
	const pairHeight = M_MATCH_HEIGHT * 2 + M_PAIR_GAP;
	const topCenter = M_MATCH_HEIGHT / 2;
	const bottomCenter = M_MATCH_HEIGHT + M_PAIR_GAP + M_MATCH_HEIGHT / 2;
	const midY = (topCenter + bottomCenter) / 2;

	return (
		<div className='relative shrink-0' style={{ width: M_CONN_WIDTH, height: pairHeight }}>
			<div
				className='absolute left-0 w-1/2 rounded-tr border-r-2 border-t-2 border-white/15'
				style={{ top: topCenter, height: midY - topCenter }}
			/>
			<div
				className='absolute left-0 w-1/2 rounded-br border-b-2 border-r-2 border-white/15'
				style={{ top: midY, height: bottomCenter - midY }}
			/>
			<div className='absolute right-0 w-1/2 border-t-2 border-white/15' style={{ top: midY }} />
		</div>
	);
};

const MobileSwipeableBracket = ({
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
	const scrollRef = useRef<HTMLDivElement>(null);
	const [activeRound, setActiveRound] = useState(0);
	const [animatingRound, setAnimatingRound] = useState<number | null>(null);
	const prevRoundRef = useRef(0);

	const totalSlides = roundData.length + (thirdPlace ? 1 : 0);

	const slides = useMemo(() => {
		const result: ({ type: 'round'; roundIndex: number; round: RoundSlots } | { type: '3rd' })[] = [];
		for (let i = 0; i < roundData.length; i++) {
			if (thirdPlace && i === roundData.length - 1) {
				result.push({ type: '3rd' });
			}
			result.push({ type: 'round', roundIndex: i, round: roundData[i] });
		}
		if (thirdPlace && roundData.length === 0) {
			result.push({ type: '3rd' });
		}
		return result;
	}, [roundData, thirdPlace]);

	const onScroll = useCallback(() => {
		const el = scrollRef.current;
		if (!el) return;
		const slideWidth = el.clientWidth;
		const idx = Math.round(el.scrollLeft / slideWidth);
		setActiveRound(idx);
	}, []);

	useEffect(() => {
		if (activeRound !== prevRoundRef.current) {
			setAnimatingRound(activeRound);
			prevRoundRef.current = activeRound;
			const timer = setTimeout(() => setAnimatingRound(null), 600);
			return () => clearTimeout(timer);
		}
	}, [activeRound]);

	const scrollToRound = (idx: number) => {
		const el = scrollRef.current;
		if (!el) return;
		el.scrollTo({ left: el.clientWidth * idx, behavior: 'smooth' });
	};

	return (
		<div className='flex flex-col gap-3 px-1 pb-4'>
			{/* Round indicator pills */}
			<div className='flex items-center justify-center gap-1.5 px-4 pt-1'>
				{slides.map((slide, i) => {
					const label = slide.type === '3rd' ? '3rd' : (ROUND_SHORT[slide.round.name] ?? slide.round.name);
					return (
						<button
							key={i}
							onClick={() => scrollToRound(i)}
							className={classNames(
								'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all duration-300',
								i === activeRound
									? 'bracket-pill-active scale-110 bg-white/20 text-white shadow-lg shadow-white/10'
									: 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
							)}
						>
							{label}
						</button>
					);
				})}
			</div>

			{/* Swipeable rounds container */}
			<div
				ref={scrollRef}
				onScroll={onScroll}
				className='bracket-swipe-container flex snap-x snap-mandatory overflow-x-auto'
			>
				{slides.map((slide, slideIndex) => {
					if (slide.type === '3rd') {
						return (
							<div key='3rd-place' className='flex w-full shrink-0 snap-center flex-col gap-2 px-4'>
								<div
									className={classNames(
										gcc('text-light'),
										'text-center text-sm font-bold tracking-wide',
										animatingRound === slideIndex ? 'bracket-title-flash' : ''
									)}
								>
									3rd Place
								</div>
								<div className={animatingRound === slideIndex ? 'bracket-card-enter' : ''}>
									{renderSlot(thirdPlace!, M_MATCH_HEIGHT)}
								</div>
							</div>
						);
					}

					const { round, roundIndex } = slide;
					const isLastRound = roundIndex === roundData.length - 1;
					const showConnectors = !isLastRound && round.slots.length >= 2;

					return (
						<div key={round.name} className='flex w-full shrink-0 snap-center flex-col gap-2 px-4'>
							<div
								className={classNames(
									gcc('text-light'),
									'text-center text-sm font-bold tracking-wide',
									animatingRound === slideIndex ? 'bracket-title-flash' : ''
								)}
							>
								{round.name}
							</div>

							{!showConnectors ? (
								<div className='flex flex-col gap-2.5'>
									{round.slots.map((resolved, slotIndex) => {
										const key =
											'fixture' in resolved ? resolved.fixture.fixture.id : `ph-${slotIndex}`;
										return (
											<div
												key={key}
												className={animatingRound === slideIndex ? 'bracket-card-enter' : ''}
												style={
													animatingRound === slideIndex
														? { animationDelay: `${slotIndex * 60}ms` }
														: undefined
												}
											>
												{renderSlot(resolved, M_MATCH_HEIGHT)}
											</div>
										);
									})}
								</div>
							) : (
								<div className='flex flex-col' style={{ gap: M_PAIR_BETWEEN_GAP }}>
									{(() => {
										const pairs: ResolvedSlot[][] = [];
										for (let i = 0; i < round.slots.length; i += 2) {
											pairs.push(round.slots.slice(i, i + 2));
										}
										return pairs.map((pair, pairIndex) => (
											<div key={pairIndex} className='flex items-stretch'>
												<div
													className='flex min-w-0 flex-1 flex-col'
													style={{ gap: M_PAIR_GAP }}
												>
													{pair.map((resolved, i) => {
														const slotIndex = pairIndex * 2 + i;
														const key =
															'fixture' in resolved
																? resolved.fixture.fixture.id
																: `ph-${slotIndex}`;
														return (
															<div
																key={key}
																className={
																	animatingRound === slideIndex
																		? 'bracket-card-enter'
																		: ''
																}
																style={
																	animatingRound === slideIndex
																		? {
																				animationDelay: `${slotIndex * 60}ms`,
																			}
																		: undefined
																}
															>
																{renderSlot(resolved, M_MATCH_HEIGHT)}
															</div>
														);
													})}
												</div>
												<MobilePairConnector />
											</div>
										));
									})()}
								</div>
							)}
						</div>
					);
				})}
			</div>

			{/* Swipe hint */}
			<div className={classNames(gcc('text-light'), 'text-center text-[10px] opacity-30')}>
				{activeRound < totalSlides - 1 ? 'Swipe for next round →' : '← Swipe back'}
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
	const mobileRenderSlot = useMobileRenderSlot();
	const isMobile = useMediaQuery('(max-width: 767px)');
	const isDesktop = useMediaQuery('(min-width: 1536px)');

	if (!bracket || roundData.length === 0) {
		return (
			<div className={classNames(gcc('text-light'), 'flex items-center justify-center p-12 text-lg opacity-60')}>
				Bracket not available
			</div>
		);
	}

	if (isMobile) {
		return (
			<MobileSwipeableBracket
				roundData={roundData}
				thirdPlace={thirdPlace}
				renderSlot={mobileRenderSlot}
				gcc={gcc}
			/>
		);
	}

	const canMirror = roundData.length >= 3 && roundData[0].slots.length >= 4;

	if (isDesktop && canMirror) {
		return <MirroredBracket roundData={roundData} thirdPlace={thirdPlace} renderSlot={renderSlot} gcc={gcc} />;
	}

	return <LinearBracket roundData={roundData} thirdPlace={thirdPlace} renderSlot={renderSlot} gcc={gcc} />;
};

export default BracketPage;
