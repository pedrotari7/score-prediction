import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useTournamentStore, Route } from '../store/tournamentStore';
import useCompetition from '../hooks/useCompetition';
import { useRecapData } from '../hooks/useRecapData';
import type { Team } from '../../interfaces/main';
import { getExtraTimeResult } from '../../shared/utils';
import { classNames } from '../lib/utils/reactHelper';
import Flag from './Flag';

const CARD_GRADIENTS = [
	'from-purple-900 via-indigo-900 to-slate-900',
	'from-emerald-900 via-teal-800 to-slate-900',
	'from-red-900 via-orange-900 to-slate-900',
	'from-cyan-900 via-blue-900 to-slate-900',
	'from-amber-900 via-yellow-900 to-slate-900',
	'from-rose-900 via-pink-900 to-slate-900',
	'from-violet-900 via-purple-900 to-slate-900',
	'from-indigo-900 via-blue-800 to-slate-900',
];

const COUNT_UP_DURATION = 900;

const AnimatedNumber = ({
	value,
	label,
	size = 'large',
}: {
	value: number | string;
	label: string;
	size?: 'large' | 'small';
}) => {
	const isNumeric = typeof value === 'number';
	const [displayValue, setDisplayValue] = useState(isNumeric ? 0 : value);

	useEffect(() => {
		if (!isNumeric) {
			setDisplayValue(value);
			return;
		}

		const start = performance.now();
		let frame: ReturnType<typeof requestAnimationFrame>;

		const tick = (now: number) => {
			const progress = Math.min((now - start) / COUNT_UP_DURATION, 1);
			const eased = 1 - Math.pow(1 - progress, 3);
			setDisplayValue(Math.round(value * eased));
			if (progress < 1) frame = requestAnimationFrame(tick);
		};

		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	}, [value, isNumeric]);

	return (
		<div className='flex flex-col items-center'>
			<span
				className={classNames(
					'font-black tabular-nums',
					size === 'large' ? 'text-6xl sm:text-8xl' : 'text-4xl sm:text-5xl'
				)}
			>
				{displayValue}
			</span>
			<span className='mt-1 text-sm font-medium uppercase tracking-widest opacity-70'>{label}</span>
		</div>
	);
};

const MatchCard = ({
	homeTeam,
	awayTeam,
	prediction,
	actual,
	label,
	labelColor = 'bg-green-600',
}: {
	homeTeam: Team;
	awayTeam: Team;
	prediction: { home: number; away: number };
	actual: { home: number; away: number };
	label: string;
	labelColor?: string;
}) => (
	<div className='mx-auto w-full max-w-sm rounded-2xl bg-white/10 p-5 backdrop-blur-sm'>
		<div className={classNames('mb-3 inline-block rounded-full px-3 py-1 text-xs font-bold', labelColor)}>
			{label}
		</div>
		<div className='flex items-center justify-between gap-3'>
			<div className='flex flex-col items-center gap-1'>
				<Flag team={homeTeam} />
				<span className='max-w-[80px] truncate text-xs'>{homeTeam.name}</span>
			</div>
			<div className='flex flex-col items-center gap-1'>
				<div className='text-2xl font-black'>
					{prediction.home} - {prediction.away}
				</div>
				<div className='text-xs opacity-60'>
					Actual: {actual.home} - {actual.away}
				</div>
			</div>
			<div className='flex flex-col items-center gap-1'>
				<Flag team={awayTeam} />
				<span className='max-w-[80px] truncate text-xs'>{awayTeam.name}</span>
			</div>
		</div>
	</div>
);

const CardShell = ({
	gradient,
	children,
	onNext,
	onPrev,
	current,
	total,
}: {
	gradient: string;
	children: ReactNode;
	onNext: () => void;
	onPrev: () => void;
	current: number;
	total: number;
}) => (
	<div
		className={classNames(
			'relative flex size-full min-h-0 flex-1 flex-col overflow-y-auto bg-gradient-to-br',
			gradient
		)}
	>
		<div className='flex w-full gap-1 px-4 pt-4'>
			{Array.from({ length: total }).map((_, i) => (
				<div
					key={i}
					className={classNames(
						'h-1 flex-1 rounded-full transition-all duration-300',
						i <= current ? 'bg-white' : 'bg-white/20'
					)}
				/>
			))}
		</div>

		<div
			key={current}
			className={classNames(
				'flex flex-1 flex-col items-center justify-center px-6 py-8 text-center text-white',
				'animate-fade-slide-up'
			)}
		>
			{children}
		</div>

		<div className='absolute inset-0 flex'>
			<button className='w-1/3 cursor-pointer focus:outline-none' onClick={onPrev} aria-label='Previous' />
			<div className='w-1/3' />
			<button className='w-1/3 cursor-pointer focus:outline-none' onClick={onNext} aria-label='Next' />
		</div>

		<div className='pointer-events-none absolute inset-x-0 bottom-4 text-center text-xs uppercase tracking-widest text-white/40'>
			Tap to continue
		</div>
	</div>
);

const TournamentRecap = () => {
	const { competition } = useCompetition();
	const uid = useTournamentStore(s => s.uid);
	const fixtures = useTournamentStore(s => s.fixtures);
	const predictions = useTournamentStore(s => s.predictions);
	const users = useTournamentStore(s => s.users);
	const odds = useTournamentStore(s => s.odds);
	const boosts = useTournamentStore(s => s.boosts);
	const setRoute = useTournamentStore(s => s.setRoute);

	const recap = useRecapData(uid, fixtures, predictions, users, odds, boosts, competition);
	const [cardIndex, setCardIndex] = useState(0);

	const cards: { id: string; render: () => ReactNode }[] = [];

	if (recap) {
		cards.push({
			id: 'overview',
			render: () => (
				<>
					<div className='mb-2 text-sm font-bold uppercase tracking-widest opacity-60'>
						{competition.name.toUpperCase()}
					</div>
					<h1 className='mb-8 text-3xl font-black sm:text-5xl'>Your Tournament Story</h1>
					<AnimatedNumber value={recap.totalPredictions} label='Predictions Made' />
					<div className='mt-8 flex gap-8'>
						<AnimatedNumber value={recap.totalPoints} label='Total Points' size='small' />
						<AnimatedNumber value={recap.totalGamesFinished} label='Games Played' size='small' />
					</div>
				</>
			),
		});

		if (recap.bestMoment) {
			const best = recap.bestMoment;
			const actual = getExtraTimeResult(best.fixture);
			cards.push({
				id: 'best',
				render: () => (
					<>
						<h2 className='mb-2 text-sm font-bold uppercase tracking-widest opacity-60'>Best Moment</h2>
						<h3 className='mb-6 text-2xl font-black sm:text-4xl'>
							{best.resultType === 'exact' ? 'Nailed it.' : 'Called it.'}
						</h3>
						<MatchCard
							homeTeam={best.fixture.teams.home}
							awayTeam={best.fixture.teams.away}
							prediction={best.prediction}
							actual={actual}
							label={`+${best.points} points${best.wasUpset ? ' (upset!)' : ''}${best.wasBoosted ? ' (2x boost!)' : ''}`}
							labelColor={best.resultType === 'exact' ? 'bg-green-600' : 'bg-yellow-600'}
						/>
						<p className='mt-4 text-sm opacity-60'>{best.fixture.league.round}</p>
					</>
				),
			});
		}

		if (recap.longestStreak && recap.longestStreak.length >= 2) {
			const streak = recap.longestStreak;
			cards.push({
				id: 'streak',
				render: () => (
					<>
						<h2 className='mb-2 text-sm font-bold uppercase tracking-widest opacity-60'>Hot Streak</h2>
						<h3 className='mb-6 text-2xl font-black sm:text-4xl'>Unstoppable.</h3>
						<AnimatedNumber value={streak.length} label='Games scoring points in a row' />
						<div className='mt-6 flex items-center gap-2 text-sm opacity-70'>
							<span>
								{streak.startGame.teams.home.name} vs {streak.startGame.teams.away.name}
							</span>
							<span>to</span>
							<span>
								{streak.endGame.teams.home.name} vs {streak.endGame.teams.away.name}
							</span>
						</div>
					</>
				),
			});
		}

		if (recap.boldestCall) {
			const bold = recap.boldestCall;
			const actual = getExtraTimeResult(bold.fixture);
			cards.push({
				id: 'boldest',
				render: () => (
					<>
						<h2 className='mb-2 text-sm font-bold uppercase tracking-widest opacity-60'>Boldest Call</h2>
						<h3 className='mb-6 text-2xl font-black sm:text-4xl'>
							{bold.wasUpset ? 'You saw it coming.' : 'Fortune favors the bold.'}
						</h3>
						<MatchCard
							homeTeam={bold.fixture.teams.home}
							awayTeam={bold.fixture.teams.away}
							prediction={bold.prediction}
							actual={actual}
							label={bold.wasUpset ? 'Upset predicted!' : 'Underdog pick'}
							labelColor='bg-cyan-700'
						/>
					</>
				),
			});
		}

		if (recap.boostReport.games.length > 0) {
			cards.push({
				id: 'boosts',
				render: () => (
					<>
						<h2 className='mb-2 text-sm font-bold uppercase tracking-widest opacity-60'>Boost Report</h2>
						<h3 className='mb-6 text-2xl font-black sm:text-4xl'>
							{recap.boostReport.totalBonusPoints > 3 ? 'Smart picks.' : 'High risk, high reward.'}
						</h3>
						<div className='flex flex-col gap-3'>
							{recap.boostReport.games.map((g, i) => {
								const actual = getExtraTimeResult(g.fixture);
								return (
									<div
										key={g.fixture.fixture.id}
										className='animate-fade-slide-up rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm'
										style={{ animationDelay: `${i * 80}ms` }}
									>
										<div className='flex items-center justify-between text-sm'>
											<div className='flex items-center gap-2'>
												<Flag team={g.fixture.teams.home} className='scale-75' />
												<span className='font-bold'>
													{g.prediction.home}-{g.prediction.away}
												</span>
												<Flag team={g.fixture.teams.away} className='scale-75' />
											</div>
											<span className='text-xs opacity-60'>
												(Actual: {actual.home}-{actual.away})
											</span>
											<span
												className={classNames(
													'rounded-full px-2 py-0.5 text-xs font-bold',
													g.resultType === 'exact'
														? 'bg-green-600'
														: g.resultType === 'result'
															? 'bg-yellow-600'
															: g.resultType === 'onescore'
																? 'bg-pink-600'
																: 'bg-red-600'
												)}
											>
												+{g.points}
											</span>
										</div>
									</div>
								);
							})}
						</div>
						<div className='mt-4 text-lg font-bold'>
							+{recap.boostReport.totalBonusPoints} bonus points from boosts
						</div>
					</>
				),
			});
		}

		if (recap.nemesis) {
			cards.push({
				id: 'nemesis',
				render: () => (
					<>
						<h2 className='mb-2 text-sm font-bold uppercase tracking-widest opacity-60'>Your Nemesis</h2>
						<h3 className='mb-6 text-2xl font-black sm:text-4xl'>{recap.nemesis!.category}.</h3>
						<p className='mb-4 text-lg opacity-80'>{recap.nemesis!.description}</p>
						<div className='rounded-2xl bg-white/10 p-6 backdrop-blur-sm'>
							<div className='text-5xl font-black text-red-400'>{recap.nemesis!.count}</div>
							<div className='mt-1 text-sm opacity-60'>times they got you</div>
						</div>
					</>
				),
			});
		}

		cards.push({
			id: 'accuracy',
			render: () => {
				const { exact, result, onescore, fail, total } = recap.accuracy;
				const pct = (n: number) => Math.round((n / total) * 100);
				return (
					<>
						<h2 className='mb-2 text-sm font-bold uppercase tracking-widest opacity-60'>Accuracy</h2>
						<h3 className='mb-8 text-2xl font-black sm:text-4xl'>
							{pct(exact + result) >= 50 ? 'Sharp eye.' : 'Room to grow.'}
						</h3>
						<div className='w-full max-w-xs space-y-3'>
							{[
								{ label: 'Exact Score', count: exact, color: 'bg-green-600', pctVal: pct(exact) },
								{ label: 'Correct Result', count: result, color: 'bg-yellow-600', pctVal: pct(result) },
								{ label: 'One Score', count: onescore, color: 'bg-pink-600', pctVal: pct(onescore) },
								{ label: 'Missed', count: fail, color: 'bg-red-600', pctVal: pct(fail) },
							].map((row, i) => (
								<div
									key={row.label}
									className='animate-fade-slide-up'
									style={{ animationDelay: `${i * 100}ms` }}
								>
									<div className='mb-1 flex justify-between text-sm'>
										<span>{row.label}</span>
										<span className='font-bold'>
											{row.count} ({row.pctVal}%)
										</span>
									</div>
									<div className='h-3 w-full overflow-hidden rounded-full bg-white/10'>
										<div
											className={classNames(
												'h-full rounded-full transition-all duration-700',
												row.color
											)}
											style={{ width: `${row.pctVal}%` }}
										/>
									</div>
								</div>
							))}
						</div>
						{recap.favoriteScoreline && (
							<div className='mt-8 rounded-2xl bg-white/10 px-6 py-4 backdrop-blur-sm'>
								<div className='text-xs uppercase tracking-widest opacity-60'>Go-to scoreline</div>
								<div className='mt-1 text-3xl font-black'>{recap.favoriteScoreline.scoreline}</div>
								<div className='text-sm opacity-60'>
									predicted {recap.favoriteScoreline.count} times
								</div>
							</div>
						)}
					</>
				);
			},
		});

		cards.push({
			id: 'final',
			render: () => (
				<>
					<h2 className='mb-2 text-sm font-bold uppercase tracking-widest opacity-60'>Final Standing</h2>
					<h3 className='mb-6 text-2xl font-black sm:text-4xl'>
						{recap.rank === 1 ? 'Champion.' : recap.topPercentile <= 25 ? 'Top tier.' : 'Well played.'}
					</h3>
					<div className='mb-2 text-8xl font-black sm:text-9xl'>#{recap.rank}</div>
					<div className='text-sm opacity-60'>out of {recap.totalPlayers} players</div>
					{recap.topPercentile <= 50 && (
						<div className='mt-4 rounded-full bg-white/10 px-4 py-2 text-sm font-bold backdrop-blur-sm'>
							Top {recap.topPercentile || 1}%
						</div>
					)}
					{recap.stageRanks.length > 0 && (
						<div className='mt-8 grid grid-cols-2 gap-3'>
							{recap.stageRanks
								.filter(s => s.points > 0)
								.map((s, i) => (
									<div
										key={s.stage}
										className='animate-fade-slide-up rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm'
										style={{ animationDelay: `${i * 80}ms` }}
									>
										<div className='text-xs opacity-60'>{s.stage}</div>
										<div className='text-2xl font-black'>#{s.rank}</div>
										<div className='text-xs opacity-50'>{s.points} pts</div>
									</div>
								))}
						</div>
					)}
					<button
						onClick={() => setRoute({ page: Route.Leaderboard })}
						className='relative z-10 mt-8 rounded-full bg-white px-8 py-3 font-bold text-black transition-transform hover:scale-105'
					>
						View Leaderboard
					</button>
				</>
			),
		});
	}

	const totalCards = cards.length;

	const goNext = useCallback(() => {
		setCardIndex(i => Math.min(i + 1, totalCards - 1));
	}, [totalCards]);

	const goPrev = useCallback(() => {
		setCardIndex(i => Math.max(i - 1, 0));
	}, []);

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === 'ArrowRight' || e.key === ' ') goNext();
			if (e.key === 'ArrowLeft') goPrev();
		};
		window.addEventListener('keydown', handler);
		return () => window.removeEventListener('keydown', handler);
	}, [goNext, goPrev]);

	if (!recap) {
		return (
			<div className='flex min-h-[60vh] flex-col items-center justify-center text-center text-white'>
				<h2 className='mb-4 text-2xl font-bold'>No recap available yet</h2>
				<p className='mb-6 opacity-60'>Complete some predictions first to see your tournament story!</p>
				<button
					onClick={() => setRoute({ page: Route.Predictions, data: uid })}
					className='rounded-full bg-white px-6 py-3 font-bold text-black'
				>
					Make Predictions
				</button>
			</div>
		);
	}

	const currentCard = cards[cardIndex];

	return (
		<CardShell
			gradient={CARD_GRADIENTS[cardIndex % CARD_GRADIENTS.length]}
			onNext={goNext}
			onPrev={goPrev}
			current={cardIndex}
			total={totalCards}
		>
			{currentCard.render()}
		</CardShell>
	);
};

export default TournamentRecap;
