import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useTournamentStore } from '../store/tournamentStore';
import useCompetition from '../hooks/useCompetition';
import { getGameStage, getStageBoostInfo, hasBoosts, isNum } from '../../shared/utils';
import { classNames, getCurrentDate } from '../lib/utils/reactHelper';
import type { Fixture, Team } from '../../interfaces/main';
import Flag from './Flag';
import ScoreInput from './ScoreInput';

const DISMISSED_KEY = 'boost-reminder-dismissed';

const EXAMPLE_HOME = { id: 6, name: 'Brazil' } as Team;
const EXAMPLE_AWAY = { id: 26, name: 'Argentina' } as Team;

const BoostableGameRow = ({ game }: { game: Fixture }) => {
	const predictions = useTournamentStore(s => s.predictions);
	const boosts = useTournamentStore(s => s.boosts);
	const uid = useTournamentStore(s => s.uid);
	const doUpdateBoost = useTournamentStore(s => s.updateBoost);
	const doUpdatePrediction = useTournamentStore(s => s.updatePrediction);
	const fixtures = useTournamentStore(s => s.fixtures);
	const { competition } = useCompetition();

	const homeRef = useRef<HTMLInputElement>(null);
	const awayRef = useRef<HTMLInputElement>(null);

	const gameID = game.fixture.id;
	const pred = predictions[gameID]?.[uid] ?? { home: null, away: null };
	const myBoosts = boosts?.[uid] ?? [];
	const isBoosted = myBoosts.includes(gameID);
	const stage = getGameStage(game);
	const { remaining } = getStageBoostInfo(competition, stage, myBoosts, fixtures);

	return (
		<div className='flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2'>
			<span className='shrink-0 text-xs font-medium text-white'>{game.teams.home.name}</span>
			<Flag team={game.teams.home} className='scale-75' />
			<div className='flex items-center gap-1'>
				<ScoreInput
					innerRef={homeRef}
					id={`boost-modal-${gameID}-home`}
					value={pred.home}
					className='!h-7 !w-8 !p-0 text-xs'
					onchange={e => {
						const val = parseInt(e.target.value);
						doUpdatePrediction({ ...pred, home: isNaN(val) ? (null as unknown as number) : val }, gameID);
					}}
				/>
				<span className='text-[10px] text-gray-400'>-</span>
				<ScoreInput
					innerRef={awayRef}
					id={`boost-modal-${gameID}-away`}
					value={pred.away}
					className='!h-7 !w-8 !p-0 text-xs'
					onchange={e => {
						const val = parseInt(e.target.value);
						doUpdatePrediction({ ...pred, away: isNaN(val) ? (null as unknown as number) : val }, gameID);
					}}
				/>
			</div>
			<Flag team={game.teams.away} className='scale-75' />
			<span className='shrink-0 text-xs font-medium text-white'>{game.teams.away.name}</span>
			<button
				onClick={e => {
					e.stopPropagation();
					doUpdateBoost(gameID);
				}}
				disabled={!isBoosted && remaining <= 0}
				className={classNames(
					'ml-auto flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-black transition-all duration-300',
					isBoosted
						? 'scale-110 bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 ring-2 ring-indigo-400/50'
						: remaining > 0
							? 'bg-gray-700/80 text-gray-300 ring-1 ring-gray-500/50 hover:scale-110 hover:bg-indigo-500/30 hover:text-white hover:ring-indigo-400/50'
							: 'cursor-not-allowed bg-gray-800/50 text-gray-600'
				)}
			>
				2x
			</button>
		</div>
	);
};

const BoostReminderModal = ({ forceShow = false, onDismiss }: { forceShow?: boolean; onDismiss?: () => void }) => {
	const [visible, setVisible] = useState(false);
	const fixtures = useTournamentStore(s => s.fixtures);
	const predictions = useTournamentStore(s => s.predictions);
	const boosts = useTournamentStore(s => s.boosts);
	const uid = useTournamentStore(s => s.uid);
	const { competition } = useCompetition();

	const boostableGames = useMemo(() => {
		if (!hasBoosts(competition) || !uid || !fixtures || !predictions) return [];

		const myBoosts = boosts?.[uid] ?? [];
		const now = getCurrentDate().getTime();

		return Object.values(fixtures)
			.filter(game => {
				const gameDate = new Date(game.fixture.date).getTime();
				if (gameDate <= now) return false;

				const pred = predictions[game.fixture.id]?.[uid];
				if (!pred || !isNum(pred.home) || !isNum(pred.away)) return false;

				if (myBoosts.includes(game.fixture.id)) return false;

				const stage = getGameStage(game);
				const { remaining } = getStageBoostInfo(competition, stage, myBoosts, fixtures);
				return remaining > 0;
			})
			.sort((a, b) => a.fixture.timestamp - b.fixture.timestamp);
	}, [fixtures, predictions, boosts, uid, competition]);

	useEffect(() => {
		if (forceShow) {
			setVisible(true);
			return;
		}
		if (boostableGames.length === 0) return;
		const dismissed = sessionStorage.getItem(DISMISSED_KEY);
		if (!dismissed) {
			setVisible(true);
		}
	}, [forceShow, boostableGames]);

	const dismiss = () => {
		setVisible(false);
		if (forceShow) {
			onDismiss?.();
		} else {
			sessionStorage.setItem(DISMISSED_KEY, '1');
		}
	};

	return (
		<Transition show={visible} as={Fragment}>
			<Dialog onClose={dismiss} className='relative z-50'>
				<TransitionChild
					as={Fragment}
					enter='transition-opacity ease-out duration-200'
					enterFrom='opacity-0'
					enterTo='opacity-100'
					leave='transition-opacity ease-in duration-150'
					leaveFrom='opacity-100'
					leaveTo='opacity-0'
				>
					<DialogBackdrop className='fixed inset-0 bg-black/60 backdrop-blur-sm' />
				</TransitionChild>

				<div className='fixed inset-0 flex items-center justify-center p-4'>
					<TransitionChild
						as={Fragment}
						enter='transition ease-out duration-200'
						enterFrom='opacity-0 scale-95'
						enterTo='opacity-100 scale-100'
						leave='transition ease-in duration-150'
						leaveFrom='opacity-100 scale-100'
						leaveTo='opacity-0 scale-95'
					>
						<DialogPanel
							onKeyDown={e => e.stopPropagation()}
							className='relative max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-2xl bg-[#1c1e20] p-4 shadow-xl ring-1 ring-white/10'
						>
							<button
								onClick={dismiss}
								className='absolute right-3 top-3 rounded-full p-1 text-gray-400 transition-colors hover:text-white'
							>
								<XMarkIcon className='size-5' />
							</button>

							<div className='mb-3 flex items-center gap-3'>
								<div className='flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-black text-indigo-400'>
									2x
								</div>
								<h2 className='text-base font-bold text-white'>You have boosts available!</h2>
							</div>

							<p className='mb-3 text-xs leading-relaxed text-gray-300'>
								Boosts double your points on a prediction. Tap the{' '}
								<span className='font-bold text-indigo-400'>2x</span> button below your score to
								activate — use them on games you&apos;re most confident about.
							</p>

							<div className='glass-card mb-3 rounded-2xl p-3'>
								<div className='mb-1.5 flex items-center justify-between'>
									<span className='rounded-full bg-green-700 px-2 py-0.5 text-[10px] font-bold text-white'>
										L 1
									</span>
									<span className='text-[10px] text-gray-200'>17 Jun 22:00 Wed</span>
								</div>

								<div className='flex items-center justify-between'>
									<div className='flex flex-col items-center gap-1'>
										<Flag team={EXAMPLE_HOME} />
										<span className='text-[10px] font-bold text-white'>{EXAMPLE_HOME.name}</span>
									</div>

									<div className='relative flex flex-col items-center'>
										<div className='flex items-center gap-1'>
											<span className='flex h-8 w-10 items-center justify-center rounded bg-green-200 text-base font-bold text-gray-800'>
												2
											</span>
											<span className='flex h-8 w-10 items-center justify-center rounded bg-green-200 text-base font-bold text-gray-800'>
												1
											</span>
										</div>
										<div className='mt-1 flex flex-col items-center'>
											<div className='flex size-6 animate-pulse items-center justify-center rounded-full bg-indigo-500 text-[10px] font-black text-white shadow-lg shadow-indigo-500/40 ring-2 ring-indigo-400/50'>
												2x
											</div>
											<svg
												className='mt-0.5 size-3 animate-bounce text-indigo-400'
												fill='none'
												viewBox='0 0 24 24'
												stroke='currentColor'
												strokeWidth={2.5}
											>
												<path strokeLinecap='round' strokeLinejoin='round' d='M5 15l7-7 7 7' />
											</svg>
											<span className='text-[9px] font-medium text-indigo-400'>Tap here!</span>
										</div>
									</div>

									<div className='flex flex-col items-center gap-1'>
										<Flag team={EXAMPLE_AWAY} />
										<span className='text-[10px] font-bold text-white'>{EXAMPLE_AWAY.name}</span>
									</div>
								</div>

								<div className='mt-1.5 flex items-center justify-center gap-1 text-[10px]'>
									<span className='rounded bg-white/15 px-1.5 py-0.5 font-bold text-white'>1.74</span>
									<span className='px-1.5 py-0.5 font-bold text-gray-400'>3.60</span>
									<span className='rounded bg-cyan-500/20 px-1.5 py-0.5 font-bold text-cyan-200'>
										4.85
									</span>
								</div>
							</div>

							{boostableGames.length > 0 && (
								<div className='mb-4'>
									<p className='mb-1.5 text-xs font-semibold text-gray-400'>
										Games you can boost ({boostableGames.length})
									</p>
									<div className='flex flex-col gap-1'>
										{boostableGames.map(game => (
											<BoostableGameRow key={game.fixture.id} game={game} />
										))}
									</div>
								</div>
							)}

							<button
								onClick={dismiss}
								className='w-full rounded-xl bg-indigo-500 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-400'
							>
								Got it
							</button>
						</DialogPanel>
					</TransitionChild>
				</div>
			</Dialog>
		</Transition>
	);
};

export default BoostReminderModal;
