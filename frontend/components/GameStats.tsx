import type { Stat, Statistic } from '../../interfaces/main';
import { getContrastYIQ, zip } from '../lib/utils/reactHelper';

const GameStats = ({ stats, colors }: { stats: Statistic[] | undefined; colors: string[] }) => {
	if (!stats) return <></>;

	const [homeStatistic, awayStatistic] = stats;

	if (!homeStatistic?.statistics || !awayStatistic?.statistics) return <></>;

	const [homeColor, awayColor] = colors;

	const combStats = zip<Stat>(
		Object.values(homeStatistic?.statistics),
		Object.values(awayStatistic?.statistics)
	).reduce(
		(acc, [s1, s2], idx) => ({ ...acc, [s1.type]: [idx, s1.value, s2.value] }),
		{} as Record<string, Array<number | string | null>>
	);

	const isBigger = (a: string | number | null, b: string | number | null) => {
		a = typeof a === 'string' ? parseInt(a.replace('%', '')) : (a ?? 0);
		b = typeof b === 'string' ? parseInt(b.replace('%', '')) : (b ?? 0);

		return a > b;
	};

	const ballPossession = combStats['Ball Possession'];
	delete combStats['Ball Possession'];

	const BallPossession = () => (
		<div className='mb-3 flex w-full flex-col gap-1.5'>
			<div className='text-center text-xs font-semibold uppercase tracking-widest text-light/50'>
				Ball Possession
			</div>

			<div className='flex h-3 w-full flex-row overflow-hidden rounded-full bg-white/5'>
				<div
					className='transition-all duration-500'
					style={{
						backgroundColor: `#${homeColor}`,
						width: ballPossession[1] ?? '50%',
					}}
				/>
				<div
					className='transition-all duration-500'
					style={{
						backgroundColor: `#${awayColor}`,
						width: ballPossession[2] ?? '50%',
					}}
				/>
			</div>

			<div className='flex w-full flex-row justify-between text-sm font-semibold'>
				<span>{ballPossession[1]}</span>
				<span>{ballPossession[2]}</span>
			</div>
		</div>
	);

	return (
		<div className='flex justify-center rounded-2xl border border-white/10 bg-white/5 p-4 shadow-panel sm:p-6'>
			<div className='flex w-full flex-col items-center justify-center text-sm sm:w-1/2 sm:text-base xl:w-1/3'>
				<BallPossession />
				{Object.entries(combStats).map(([type, [idx, homeValue, awayValue]]) => {
					let homeStyle = {};
					let awayStyle = {};

					if (isBigger(homeValue, awayValue)) {
						homeStyle = { backgroundColor: `#${homeColor}`, color: getContrastYIQ(homeColor) };
					} else if (isBigger(awayValue, homeValue)) {
						awayStyle = { backgroundColor: `#${awayColor}`, color: getContrastYIQ(awayColor) };
					}
					return (
						<div
							key={idx}
							className='flex w-full flex-row items-center justify-between gap-2 rounded-lg px-1 py-1.5 transition-colors duration-150 hover:bg-white/5'
						>
							<div
								className='flex h-7 w-12 items-center justify-center rounded-full bg-white/5 px-2 text-center font-semibold'
								style={homeStyle}
							>
								{homeValue ?? 0}
							</div>
							<div className='flex h-6 items-center text-center text-xs uppercase tracking-wide text-light/60 sm:text-sm'>
								{type}
							</div>
							<div
								className='flex h-7 w-12 items-center justify-center rounded-full bg-white/5 px-2 text-center font-semibold'
								style={awayStyle}
							>
								{awayValue ?? 0}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default GameStats;
