import { Stat, Statistic } from '../../interfaces/main';

const GameStats = ({ stats }: { stats: Statistic[] | undefined }) => {
	if (!stats) return <></>;

	const [homeStatistic, awayStatistic] = stats;

	const Statistic = ({ statistic }: { statistic: Statistic }) => {
		return (
			<div>
				{Object.values(statistic.statistics).map(({ value }: Stat, idx) => (
					<div key={idx} className="text-center h-6">
						{value ?? 0}
					</div>
				))}
			</div>
		);
	};

	const StatisticLabel = ({ statistic }: { statistic: Statistic }) => {
		return (
			<div>
				{Object.values(statistic.statistics).map(({ type }: Stat, idx) => (
					<div key={idx} className="text-center h-6">
						{type}
					</div>
				))}
			</div>
		);
	};

	return (
		<div className="bg-gray-700 rounded-md p-5 flex justify-center">
			<div className="flex flex-row justify-evenly text-sm sm:text-base w-full xl:w-1/3">
				<Statistic statistic={homeStatistic} />
				<StatisticLabel statistic={homeStatistic} />
				<Statistic statistic={awayStatistic} />
			</div>
		</div>
	);
};

export default GameStats;
