import { useMemo, useState } from 'react';
import type { Fixture, Fixtures, Predictions } from '../../interfaces/main';
import {
	calculateUserResultPoints,
	getExtraTimeResult,
	getGameStage,
	getResult,
	isGameFinished,
	isNum,
	isUpsetResult,
} from '../../shared/utils';
import useCompetition from '../hooks/useCompetition';
import useNoSpoilers from '../hooks/useNoSpoilers';
import { classNames } from '../lib/utils/reactHelper';
import { Route, useTournamentStore } from '../store/tournamentStore';
import Flag from './Flag';
import Panel from './Panel';
import ResultContainer from './ResultContainer';

type ResultType = 'exact' | 'result' | 'onescore' | 'fail' | 'missed';
type Filter = ResultType | 'all';

interface TimelineEntry {
	fixture: Fixture;
	prediction: { home: number; away: number } | null;
	actual: { home: number; away: number };
	points: number;
	resultType: ResultType;
	wasBoosted: boolean;
	wasUpset: boolean;
	cumulativePoints: number;
}

const RESULT_CONFIG: Record<ResultType, { label: string; bg: string; dot: string }> = {
	exact: { label: 'Exact', bg: 'bg-green-600', dot: 'bg-green-500' },
	result: { label: 'Result', bg: 'bg-yellow-600', dot: 'bg-yellow-500' },
	onescore: { label: '1 Score', bg: 'bg-pink-600', dot: 'bg-pink-500' },
	fail: { label: 'Wrong', bg: 'bg-red-600', dot: 'bg-red-500' },
	missed: { label: 'Missed', bg: 'bg-gray-600', dot: 'bg-gray-500' },
};

const FILTERS: { key: Filter; label: string }[] = [
	{ key: 'all', label: 'All' },
	{ key: 'exact', label: 'Exact' },
	{ key: 'result', label: 'Result' },
	{ key: 'onescore', label: '1 Score' },
	{ key: 'fail', label: 'Wrong' },
	{ key: 'missed', label: 'Missed' },
];

const getResultType = (pred: { home: number; away: number }, game: Fixture, isUpset: boolean): ResultType => {
	const ur = getResult(pred, game, isUpset);
	if (ur.exact) return 'exact';
	if (ur.result) return 'result';
	if (ur.onescore) return 'onescore';
	return 'fail';
};

const PredictionTimeline = ({ fixtures, predictions }: { fixtures: Fixtures; predictions: Predictions }) => {
	const uid = useTournamentStore(s => s.uid);
	const odds = useTournamentStore(s => s.odds);
	const boosts = useTournamentStore(s => s.boosts);
	const setRoute = useTournamentStore(s => s.setRoute);
	const { gcc, competition } = useCompetition();
	const { RedactedSpoilers } = useNoSpoilers();
	const [filter, setFilter] = useState<Filter>('all');

	const entries = useMemo(() => {
		if (!uid || !fixtures) return [];

		const userBoosts = boosts?.[uid] ?? [];
		const finished = Object.values(fixtures)
			.filter(isGameFinished)
			.sort((a, b) => a.fixture.timestamp - b.fixture.timestamp);

		let cumulative = 0;
		const result: TimelineEntry[] = [];

		for (const game of finished) {
			const pred = predictions[game.fixture.id]?.[uid];
			const hasPrediction = pred && isNum(pred.home) && isNum(pred.away);
			const actual = getExtraTimeResult(game);

			if (!hasPrediction) {
				result.push({
					fixture: game,
					prediction: null,
					actual,
					points: 0,
					resultType: 'missed',
					wasBoosted: false,
					wasUpset: false,
					cumulativePoints: cumulative,
				});
				continue;
			}

			const isUpset = isUpsetResult(game, odds);
			const resultType = getResultType(pred, game, isUpset);
			const wasBoosted = userBoosts.includes(game.fixture.id);
			const gameResult = getResult(pred, game, isUpset);
			let points = calculateUserResultPoints(gameResult, competition);
			if (wasBoosted) points *= 2;

			cumulative += points;

			result.push({
				fixture: game,
				prediction: { home: pred.home, away: pred.away },
				actual,
				points,
				resultType,
				wasBoosted,
				wasUpset: isUpset && (resultType === 'exact' || resultType === 'result'),
				cumulativePoints: cumulative,
			});
		}

		result.reverse();
		return result;
	}, [uid, fixtures, predictions, odds, boosts, competition]);

	const filtered = filter === 'all' ? entries : entries.filter(e => e.resultType === filter);

	const grouped = useMemo(() => {
		const groups: { stage: string; entries: TimelineEntry[] }[] = [];
		let currentStage = '';

		for (const entry of filtered) {
			const stage = getGameStage(entry.fixture);
			if (stage !== currentStage) {
				currentStage = stage;
				groups.push({ stage, entries: [] });
			}
			groups[groups.length - 1].entries.push(entry);
		}

		return groups;
	}, [filtered]);

	const counts = useMemo(
		() => ({
			all: entries.length,
			exact: entries.filter(e => e.resultType === 'exact').length,
			result: entries.filter(e => e.resultType === 'result').length,
			onescore: entries.filter(e => e.resultType === 'onescore').length,
			fail: entries.filter(e => e.resultType === 'fail').length,
			missed: entries.filter(e => e.resultType === 'missed').length,
		}),
		[entries]
	);

	if (entries.length === 0) {
		return (
			<Panel className='m-8 flex flex-col items-center justify-center p-8'>
				<p className='text-lg'>No finished predictions yet</p>
			</Panel>
		);
	}

	return (
		<Panel className='m-8 flex flex-col p-6 sm:p-8'>
			<h2 className='mb-6 text-2xl font-bold sm:text-3xl'>Prediction Timeline</h2>

			{/* Summary bar */}
			<div className='mb-6 flex flex-wrap gap-3'>
				{FILTERS.map(f => {
					const count = counts[f.key];
					const isActive = filter === f.key;
					const config = f.key !== 'all' ? RESULT_CONFIG[f.key] : null;
					return (
						<button
							key={f.key}
							onClick={() => setFilter(f.key)}
							className={classNames(
								'rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-200',
								isActive
									? config
										? `${config.bg} text-white`
										: 'bg-white/20 text-white'
									: 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
							)}
						>
							{f.label} ({count})
						</button>
					);
				})}
			</div>

			{/* Timeline */}
			<RedactedSpoilers message='Timeline hidden in no-spoilers mode'>
				<div className='relative'>
					{grouped.map(group => (
						<div key={group.stage} className='mb-6'>
							<div className='mb-3 text-sm font-bold text-gray-400'>{group.stage}</div>
							<div className='relative ml-3 border-l border-white/10 pl-6'>
								{group.entries.map(entry => {
									const config = RESULT_CONFIG[entry.resultType];
									return (
										<div key={entry.fixture.fixture.id} className='group relative mb-4 last:mb-0'>
											{/* Dot on timeline */}
											<div
												className={classNames(
													'absolute right-[calc(100%+1.25rem)] top-1/2 size-2.5 -translate-y-1/2 rounded-full ring-2 ring-[#181a1b]',
													config.dot
												)}
											/>

											{/* Card */}
											<div
												onClick={() =>
													setRoute({ page: Route.Match, data: entry.fixture.fixture.id })
												}
												className={classNames(
													gcc('bg-dark'),
													'flex cursor-pointer flex-row items-center justify-between rounded-md p-3 text-sm'
												)}
											>
												{/* Prediction (left) */}
												<div className='flex w-3/12 items-center justify-center'>
													{entry.prediction ? (
														<ResultContainer
															prediction={entry.prediction}
															game={entry.fixture}
															className='px-2 py-1'
															showEarnedPoints={false}
														>
															<span className='font-bold'>
																{entry.prediction.home} - {entry.prediction.away}
															</span>
														</ResultContainer>
													) : (
														<span className='text-xs text-gray-500'>—</span>
													)}
												</div>

												{/* Teams + actual (center) */}
												<div className='flex w-6/12 items-center gap-2'>
													<div className='flex flex-1 flex-col items-center gap-0.5 sm:flex-row-reverse sm:items-center sm:gap-1'>
														<Flag team={entry.fixture.teams.home} />
														<span className='text-center text-[10px] leading-tight opacity-70 sm:text-right sm:text-xs'>
															{entry.fixture.teams.home.name}
														</span>
													</div>
													<span className='shrink-0 font-bold'>
														{entry.actual.home} - {entry.actual.away}
													</span>
													<div className='flex flex-1 flex-col items-center gap-0.5 sm:flex-row sm:items-center sm:gap-1'>
														<Flag team={entry.fixture.teams.away} />
														<span className='text-center text-[10px] leading-tight opacity-70 sm:text-left sm:text-xs'>
															{entry.fixture.teams.away.name}
														</span>
													</div>
												</div>

												{/* Points (right) */}
												<div className='flex w-3/12 items-center justify-center gap-1.5'>
													<span
														className={classNames(
															'font-bold',
															entry.points > 0 ? 'text-white' : 'text-gray-500'
														)}
													>
														{entry.points > 0 ? `+${entry.points}` : '0'}
													</span>
													{entry.wasBoosted && (
														<span className='rounded-full bg-indigo-500 px-1.5 py-0.5 text-[10px] font-bold text-white'>
															2x
														</span>
													)}
												</div>
											</div>
										</div>
									);
								})}
							</div>
						</div>
					))}
				</div>
			</RedactedSpoilers>
		</Panel>
	);
};

export default PredictionTimeline;
