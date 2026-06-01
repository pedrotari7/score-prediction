import { useEffect, useState } from 'react';
import { Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const DISMISSED_KEY = 'pwa-install-dismissed';

function isIos() {
	if (typeof navigator === 'undefined') return false;
	return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

function isStandalone() {
	if (typeof window === 'undefined') return false;
	return (
		'standalone' in window.navigator &&
		(window.navigator as Navigator & { standalone: boolean }).standalone === true
	);
}

const ShareIcon = () => (
	<svg
		viewBox='0 0 24 24'
		fill='none'
		stroke='currentColor'
		strokeWidth={1.5}
		className='inline size-5 align-text-bottom'
		style={{ color: '#60a5fa' }}
	>
		<path
			strokeLinecap='round'
			strokeLinejoin='round'
			d='M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15M9 12l3-3m0 0 3 3m-3-3v12'
		/>
	</svg>
);

const PlusIcon = () => (
	<svg
		viewBox='0 0 24 24'
		fill='none'
		stroke='currentColor'
		strokeWidth={1.5}
		className='inline size-5 align-text-bottom'
	>
		<path strokeLinecap='round' strokeLinejoin='round' d='M12 4.5v15m7.5-7.5h-15' />
	</svg>
);

const PwaInstallPrompt = ({ forceShow = false, onDismiss }: { forceShow?: boolean; onDismiss?: () => void }) => {
	const [visible, setVisible] = useState(forceShow);

	useEffect(() => {
		if (forceShow) {
			setVisible(true);
			return;
		}
		if (!isIos() || isStandalone()) return;
		const dismissed = localStorage.getItem(DISMISSED_KEY);
		if (!dismissed) {
			setVisible(true);
		}
	}, [forceShow]);

	const dismiss = () => {
		setVisible(false);
		if (forceShow) {
			onDismiss?.();
		} else {
			localStorage.setItem(DISMISSED_KEY, '1');
		}
	};

	return (
		<Transition
			show={visible}
			enter='transition ease-out duration-300'
			enterFrom='translate-y-full opacity-0'
			enterTo='translate-y-0 opacity-100'
			leave='transition ease-in duration-200'
			leaveFrom='translate-y-0 opacity-100'
			leaveTo='translate-y-full opacity-0'
		>
			<div className='fixed inset-x-0 bottom-0 z-50 px-3 pb-6'>
				<div className='relative mx-auto max-w-md rounded-2xl bg-[#1c1e20] p-5 shadow-xl ring-1 ring-white/10'>
					<button
						onClick={dismiss}
						className='absolute right-3 top-3 rounded-full p-1 text-gray-400 hover:text-white'
					>
						<XMarkIcon className='size-5' />
					</button>

					<p className='mb-3 text-base font-semibold text-white'>Install Score Prediction</p>
					<p className='mb-4 text-sm text-gray-300'>
						Add this app to your home screen for the best experience.
					</p>

					<ol className='space-y-3 text-sm text-gray-300'>
						<li className='flex items-start gap-2'>
							<span className='mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-medium text-white'>
								1
							</span>
							<span>
								Tap the <strong className='text-white'>Share</strong> button <ShareIcon /> in Safari
							</span>
						</li>
						<li className='flex items-start gap-2'>
							<span className='mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-medium text-white'>
								2
							</span>
							<span>
								Scroll down and tap <strong className='text-white'>Add to Home Screen</strong>{' '}
								<PlusIcon />
							</span>
						</li>
						<li className='flex items-start gap-2'>
							<span className='mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-medium text-white'>
								3
							</span>
							<span>
								Tap <strong className='text-white'>Add</strong> to confirm
							</span>
						</li>
					</ol>

					<button
						onClick={dismiss}
						className='mt-4 w-full rounded-lg bg-white/10 py-2 text-sm font-medium text-white transition hover:bg-white/20'
					>
						Got it
					</button>
				</div>
			</div>
		</Transition>
	);
};

export default PwaInstallPrompt;
