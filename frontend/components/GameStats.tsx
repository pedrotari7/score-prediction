import { Stat, Statistic } from '../../interfaces/main';
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
		<div className='my-2 flex w-full flex-col'>
			<div className='w-full text-center'>Ball Possession</div>

			<div className='my-2 flex h-6 w-full flex-row items-center'>
				<div
					className='rounded-l-md py-2 text-left'
					style={{
						backgroundColor: `#${homeColor}`,
						color: getContrastYIQ(homeColor),
						width: ballPossession[1] ?? '50%',
					}}
				>
					<span className='my-2 h-6 w-12 px-2'>{ballPossession[1]}</span>
				</div>
				<div
					className='rounded-r-md py-2 text-right'
					style={{
						backgroundColor: `#${awayColor}`,
						color: getContrastYIQ(awayColor),
						width: ballPossession[2] ?? '50%',
					}}
				>
					<span className='my-2 h-6 w-12 px-2'>{ballPossession[2]}</span>
				</div>
			</div>
		</div>
	);

	return (
		<div className='flex justify-center rounded-md bg-gray-700 p-6'>
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
						<div key={idx} className='flex w-full flex-row items-center justify-between'>
							<div
								className='my-2 flex h-6 w-12 items-center justify-center rounded-md px-2 text-center'
								style={homeStyle}
							>
								{homeValue ?? 0}
							</div>
							<div className='my-2 flex h-6 items-center text-center'>{type}</div>
							<div
								className='my-2 flex h-6 w-12 items-center justify-center rounded-md px-2 text-center'
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
