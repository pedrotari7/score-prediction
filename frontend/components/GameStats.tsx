import { Stat, Statistic } from '../../interfaces/main';
import { getContrastYIQ, zip } from '../lib/utils/reactHelper';

const GameStats = ({ stats, colors }: { stats: Statistic[] | undefined; colors: string[] }) => {
	if (!stats) return <></>;

	const [homeStatistic, awayStatistic] = stats;

	if (!homeStatistic.statistics || !awayStatistic.statistics) return <></>;

	const [homeColor, awayColor] = colors;

	const combStats = zip(Object.values(homeStatistic?.statistics), Object.values(awayStatistic?.statistics)).reduce(
		(acc, [s1, s2], idx) => ({ ...acc, [s1.type]: [idx, s1.value, s2.value] }),
		{} as Record<string, Array<number | string>>
	);

	const isBigger = (a: string | number | null, b: string | number | null) => {
		a = typeof a === 'string' ? parseInt(a.replace('%', '')) : a ?? 0;
		b = typeof b === 'string' ? parseInt(b.replace('%', '')) : b ?? 0;

		return a > b;
	};

	const ballPossession = combStats['Ball Possession'];
	delete combStats['Ball Possession'];

	const BallPossession = () => (
		<div className="flex flex-col w-full my-2">
			<div className="w-full text-center">Ball Possession</div>

			<div className="flex flex-row w-full h-6 my-2">
				<div
					className="rounded-l-md text-left"
					style={{
						backgroundColor: `#${homeColor}`,
						color: getContrastYIQ(homeColor),
						width: ballPossession[1],
					}}>
					<span className="h-6 my-2 px-2 w-12">{ballPossession[1]}</span>
				</div>
				<div
					className="rounded-r-md text-right"
					style={{
						backgroundColor: `#${awayColor}`,
						color: getContrastYIQ(awayColor),
						width: ballPossession[2],
					}}>
					<span className="h-6 my-2 px-2 w-12">{ballPossession[2]}</span>
				</div>
			</div>
		</div>
	);

	return (
		<div className="bg-gray-700 rounded-md p-6 flex justify-center">
			<div className="flex flex-col justify-center items-center text-sm sm:text-base w-full xl:w-1/3 sm:w-1/2">
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
						<div key={idx} className="flex flex-row justify-between w-full">
							<div className="text-center h-6 rounded-md my-2 px-2 w-12" style={homeStyle}>
								{homeValue ?? 0}
							</div>
							<div className="text-center h-6 my-2">{type}</div>
							<div className="text-center h-6 rounded-md my-2 px-2 w-12" style={awayStyle}>
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
