import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useTournamentStore } from '../store/tournamentStore';
import useCompetition from '../hooks/useCompetition';
import { getGameStage, getStageBoostInfo, hasBoosts, isNum } from '../../shared/utils';
import { getCurrentDate } from '../lib/utils/reactHelper';
import type { Team } from '../../interfaces/main';
import Flag from './Flag';

const DISMISSED_KEY = 'boost-reminder-dismissed';

const EXAMPLE_HOME = { id: 6, name: 'Brazil' } as Team;
const EXAMPLE_AWAY = { id: 26, name: 'Argentina' } as Team;

const BoostReminderModal = ({ forceShow = false, onDismiss }: { forceShow?: boolean; onDismiss?: () => void }) => {
	const [visible, setVisible] = useState(false);
	const fixtures = useTournamentStore(s => s.fixtures);
	const predictions = useTournamentStore(s => s.predictions);
	const boosts = useTournamentStore(s => s.boosts);
	const uid = useTournamentStore(s => s.uid);
	const { competition } = useCompetition();

	const shouldShow = useMemo(() => {
		if (!hasBoosts(competition) || !uid || !fixtures || !predictions) return false;

		const myBoosts = boosts?.[uid] ?? [];
		const now = getCurrentDate().getTime();

		return Object.values(fixtures).some(game => {
			const gameDate = new Date(game.fixture.date).getTime();
			if (gameDate <= now) return false;

			const pred = predictions[game.fixture.id]?.[uid];
			if (!pred || !isNum(pred.home) || !isNum(pred.away)) return false;

			if (myBoosts.includes(game.fixture.id)) return false;

			const stage = getGameStage(game);
			const { remaining } = getStageBoostInfo(competition, stage, myBoosts, fixtures);
			return remaining > 0;
		});
	}, [fixtures, predictions, boosts, uid, competition]);

	useEffect(() => {
		if (forceShow) {
			setVisible(true);
			return;
		}
		if (!shouldShow) return;
		const dismissed = sessionStorage.getItem(DISMISSED_KEY);
		if (!dismissed) {
			setVisible(true);
		}
	}, [forceShow, shouldShow]);

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
						<DialogPanel className='relative w-full max-w-sm overflow-hidden rounded-2xl bg-[#1c1e20] p-6 shadow-xl ring-1 ring-white/10'>
							<button
								onClick={dismiss}
								className='absolute right-3 top-3 rounded-full p-1 text-gray-400 transition-colors hover:text-white'
							>
								<XMarkIcon className='size-5' />
							</button>

							<div className='mb-4 flex items-center gap-3'>
								<div className='flex size-10 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-black text-indigo-400'>
									2x
								</div>
								<h2 className='text-lg font-bold text-white'>You have boosts available!</h2>
							</div>

							<p className='mb-4 text-sm leading-relaxed text-gray-300'>
								Boosts double the points you earn on a prediction. You have a limited number of boosts
								per stage, use them on the games you feel most confident about.
							</p>

							<div className='glass-card mb-4 rounded-2xl p-3'>
								<div className='mb-2 flex items-center justify-between'>
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
											<span className='flex h-10 w-12 items-center justify-center rounded bg-green-200 text-lg font-bold text-gray-800'>
												2
											</span>
											<span className='flex h-10 w-12 items-center justify-center rounded bg-green-200 text-lg font-bold text-gray-800'>
												1
											</span>
										</div>
										<div className='mt-1.5 flex flex-col items-center'>
											<div className='flex size-7 animate-pulse items-center justify-center rounded-full bg-indigo-500 text-[10px] font-black text-white shadow-lg shadow-indigo-500/40 ring-2 ring-indigo-400/50'>
												2x
											</div>
											<svg
												className='mt-0.5 size-3.5 animate-bounce text-indigo-400'
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

								<div className='mt-2 flex items-center justify-center gap-1 text-[10px]'>
									<span className='rounded bg-white/10 px-1.5 py-0.5 font-bold'>1.74</span>
									<span className='px-1.5 py-0.5 opacity-50'>3.60</span>
									<span className='rounded bg-cyan-700/30 px-1.5 py-0.5 font-bold text-cyan-300'>
										4.85
									</span>
								</div>
							</div>

							<p className='mb-5 text-xs leading-relaxed text-gray-400'>
								The <span className='font-bold text-indigo-400'>2x</span> button appears below your
								prediction score. Tap it to activate, tap again to remove. Boosts can only be set on
								games that haven&apos;t started yet.
							</p>

							<button
								onClick={dismiss}
								className='w-full rounded-xl bg-indigo-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-400'
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
