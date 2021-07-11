import { MouseEventHandler, ReactNode, useContext, useState } from 'react';
import { Users } from '../../interfaces/main';
import RouteContext, { Route } from '../context/RouteContext';
import { classNames } from '../lib/utils/reactHelper';
import DesktopOnly from './DesktopOnly';
import MobileOnly from './MobileOnly';

interface SortOption {
	key: string;
	text: string;
	color: string;
}

const SortOptions: Record<string, SortOption> = {
	points: { key: 'points', text: 'Points', color: ' bg-gray-700' },
	exact: { key: 'exact', text: 'Exact', color: 'bg-green-500' },
	result: { key: 'result', text: 'Correct Result', color: 'bg-yellow-500' },
	onescore: { key: 'onescore', text: 'Team Score', color: 'bg-pink-500' },
	penalty: { key: 'penalty', text: 'Penalties', color: 'bg-gray-500' },
	fail: { key: 'fail', text: 'Fail', color: 'bg-red-500' },
	groups: { key: 'groups', text: 'Groups', color: 'bg-purple-700' },
};

const Rankings = ({ users }: { users: Users }) => {
	const { setRoute } = useContext(RouteContext)!;
	const [sortOption, setSortOption] = useState(SortOptions.points);

	const Circle = ({ children, className }: { children: ReactNode; className: string }) => {
		return (
			<div
				className={classNames(
					'w-6 h-6 p-4 mx-1 text-center flex flex-row items-center justify-center rounded-full select-none',
					className
				)}>
				{children}
			</div>
		);
	};

	const FilterOption = ({
		children,
		className,
		active,
		onClick,
	}: {
		children: ReactNode;
		className: string;
		active: boolean;
		onClick: MouseEventHandler<HTMLDivElement>;
	}) => {
		return (
			<div
				onClick={onClick}
				className={classNames(
					'mx-2 my-2 p-2 rounded-md cursor-pointer select-none text-xs sm:text-lg',
					'hover:bg-opacity-50 hover:border-2 hover:border-gray-400 border-2',
					active ? 'border-white' : 'border-transparent',
					className
				)}>
				{children}
			</div>
		);
	};

	const sortedUsers = Object.values(users)
		.filter(user => user.score)
		.sort(
			(a, b) =>
				b.score[sortOption.key] - a.score[sortOption.key] ||
				b.score.points - a.score.points ||
				b.score.exact - a.score.exact ||
				b.score.result - a.score.result ||
				b.score.onescore - a.score.onescore ||
				b.score.groups - a.score.groups ||
				b.score.penalty - a.score.penalty ||
				b.score.fail - a.score.fail
		);

	return (
		<div className="m-3 sm:m-6 p-3 sm:p-6 shadow-pop rounded-md bg-dark text-light select-none">
			<div className="font-bold text-2xl mb-4">Ranking</div>

			<div className="font-bold flex flex-row flex-wrap items-center justify-center sm:justify-center mb-6">
				{Object.values(SortOptions).map(option => (
					<FilterOption
						key={option.key}
						active={option.text === sortOption.text}
						className={option.color}
						onClick={() => setSortOption(option)}>
						{option.text}
					</FilterOption>
				))}
			</div>
			<div className="flex flex-row item-center flex-wrap justify-evenly w-full">
				{sortedUsers.map((user, index) => {
					return (
						<div key={user.uid} className="relative w-full sm:w-max">
							<div
								className={classNames(
									'cursor-pointer hover:bg-opacity-50 flex flex-col sm:flex-row justify-center items-center',
									'rounded-md bg-blue my-4 mx-0 sm:mx-4 p-3'
								)}
								onClick={() => setRoute({ page: Route.Predictions, data: user.uid })}>
								<div className="flex flex-col sm:flex-row flex-wrap items-center justify-evenly mb-0 sm:justify-start sm:mr-4">
									<DesktopOnly>
										<div className="flex flex-row items-center justify-center w-8 h-8 m-2 font-bold text-xl">
											<span className="bg-light text-dark rounded-full w-full h-full flex items-center justify-center p-2mr-1">
												{index + 1}
											</span>
										</div>
									</DesktopOnly>
									<MobileOnly>
										<div className="absolute top-0 -left-0 bg-light rounded-md w-12 text-dark font-bold text-center">
											<span className="p-3">{index + 1}</span>
										</div>
									</MobileOnly>
									<div className="flex flex-row flex-wrap items-center justify-center mb-2 sm:mb-0">
										<img
											className="object-cover h-8 w-8 sm:h-12 sm:w-12 rounded-full mr-2"
											src={user.photoURL}
										/>
										<span className="text-center sm:text-2xl">{user.displayName}</span>
									</div>
								</div>
								<div className="flex flex-row justify-center items-center flex-wrap">
									<Circle className="bg-green-500">{user.score.exact}</Circle>
									<Circle className="bg-yellow-500">{user.score.result}</Circle>
									<Circle className="bg-pink-500">{user.score.onescore}</Circle>
									<Circle className="bg-red-500">{user.score.fail}</Circle>
									<Circle className="bg-purple-700">{user.score.groups}</Circle>
									<Circle className="bg-gray-500">{user.score.penalty}</Circle>
									<Circle className="bg-gray-700 w-10 h-10 p-4 my-2">{user.score.points}</Circle>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default Rankings;
