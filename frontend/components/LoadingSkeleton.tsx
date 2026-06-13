import useCompetition from '../hooks/useCompetition';
import { classNames } from '../lib/utils/reactHelper';
import Panel from './Panel';

const Pulse = ({ className = '' }: { className?: string }) => (
	<div className={classNames('relative overflow-hidden rounded bg-white/10', className)}>
		<div className='absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent' />
	</div>
);

const SkeletonUserRow = () => {
	const { gcc } = useCompetition();
	return (
		<div
			className={classNames(
				gcc('bg-blue'),
				'my-2 flex w-full flex-row items-center gap-4 rounded-md border-2 border-transparent p-4 sm:m-2 sm:w-max'
			)}
		>
			<Pulse className='size-8 shrink-0 rounded-full' />
			<div className='flex flex-1 items-center gap-4'>
				<Pulse className='h-6 w-24' />
				<Pulse className='h-4 w-10' />
			</div>
			<div className='flex flex-row items-center text-xl font-bold'>
				<Pulse className='mr-2 h-6 w-5' />
				<span className='opacity-20'>-</span>
				<Pulse className='ml-2 h-6 w-5' />
			</div>
		</div>
	);
};

const SkeletonLiveGame = () => {
	const { gcc } = useCompetition();
	return (
		<div className={classNames(gcc('bg-blue'), 'my-2 flex flex-col rounded p-2 shadow-pop')}>
			<div className='flex flex-col items-center sm:flex-row sm:justify-evenly'>
				{/* Round badge */}
				<span className='hidden sm:flex sm:w-2/12 sm:justify-center'>
					<Pulse className='h-7 w-16 rounded-xl' />
				</span>
				{/* Teams + score */}
				<div className='my-4 flex w-10/12 flex-row items-center justify-evenly sm:justify-center'>
					<div className='flex flex-row items-center justify-end sm:w-4/12'>
						<Pulse className='h-4 w-16 sm:w-28' />
						<Pulse className='mx-2 h-5 w-7 shrink-0' />
					</div>
					{/* Score / date */}
					<Pulse className='mx-2 h-9 w-28 shrink-0 sm:w-4/12' />
					<div className='flex flex-row items-center justify-start sm:w-4/12'>
						<Pulse className='mx-2 h-5 w-7 shrink-0' />
						<Pulse className='h-4 w-16 sm:w-28' />
					</div>
				</div>
				{/* Venue */}
				<span className='hidden sm:flex sm:w-2/12 sm:justify-end'>
					<Pulse className='h-4 w-28' />
				</span>
			</div>
		</div>
	);
};

const LoadingSkeleton = () => (
	<Panel className='relative m-4 flex select-none flex-col justify-center rounded-md p-4 shadow-pop sm:m-8 sm:p-8 md:mx-24'>
		{/* Header: "Next Game" + refresh icon */}
		<div className='mb-4 flex flex-row items-center justify-between'>
			<Pulse className='h-9 w-32' />
			<Pulse className='size-6 rounded-full' />
		</div>

		<SkeletonLiveGame />

		{/* My Prediction */}
		<div className='mt-6'>
			<Pulse className='mb-4 h-6 w-36' />
			<SkeletonUserRow />
		</div>

		{/* Predictions list */}
		<div className='z-10 mb-20 mt-6'>
			<Pulse className='mb-4 h-6 w-28' />
			{Array.from({ length: 4 }).map((_, i) => (
				<SkeletonUserRow key={i} />
			))}
		</div>
	</Panel>
);

export default LoadingSkeleton;
