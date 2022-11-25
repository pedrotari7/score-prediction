import React, { useCallback, useContext, useEffect, useState } from 'react';
import CompetitionContext from '../context/CompetitionContext';
import RouteContext, { Route } from '../context/RouteContext';
import UserContext from '../context/UserContext';
import { classNames, getCompetitionClass } from '../lib/utils/reactHelper';
import { fetchUsers } from '../pages/api';
import DesktopOnly from './DesktopOnly';
import MobileOnly from './MobileOnly';
import RefreshButton from './RefreshButton';
import { DateTime } from 'luxon';

const UsersList = () => {
	const { setRoute } = useContext(RouteContext)!;
	const competition = useContext(CompetitionContext);
	const userInfo = useContext(UserContext);
	const [users, setUsers] = useState<any>();

	const update = useCallback(async () => {
		if (userInfo) {
			setUsers(await fetchUsers(userInfo.token, competition));
		}
	}, [userInfo, competition]);

	useEffect(() => {
		update();
	}, [update]);

	const gcc = (p: string) => getCompetitionClass(p, competition);

	return (
		<div className={classNames(gcc('text-light'), 'm-3 select-none rounded-md p-3 shadow-pop sm:m-6 sm:p-6')}>
			<div className={classNames('mb-4 flex flex-row items-center justify-between')}>
				<div className='text-2xl font-bold'>Users</div>
				<RefreshButton onClick={update} />
			</div>

			<div className='item-center flex w-full  flex-col justify-evenly'>
				{users &&
					users.map((user: any, index: number) => {
						if (!user) return <></>;
						return (
							<div
								key={index}
								className='relative w-full '
								onClick={() => setRoute({ page: Route.Predictions, data: user.uid })}
							>
								<div
									className={classNames(
										'w-full',
										gcc('bg-dark'),
										'my-2 flex flex-row items-center  gap-2 rounded p-4 sm:m-2',
										'cursor-pointer select-none hover:bg-opacity-50'
									)}
								>
									<DesktopOnly>
										<div className='m-2 flex h-8 w-8 flex-row items-center justify-center text-xl font-bold'>
											<span
												className={classNames(
													gcc('bg-light'),
													gcc('text-dark'),
													'p-2mr-1 flex h-full w-full items-center justify-center rounded-full'
												)}
											>
												{index + 1}
											</span>
										</div>
									</DesktopOnly>
									<MobileOnly>
										<div
											className={classNames(
												gcc('bg-light'),
												gcc('text-dark'),
												'absolute -top-1 -left-0 w-12 rounded-md text-center font-bold'
											)}
										>
											<span className='p-3'>{index + 1}</span>
										</div>
									</MobileOnly>
									<div className='flex flex-row flex-wrap items-center gap-4 text-left text-xs'>
										{user?.photoURL && (
											<img
												className='mr-2 h-8 w-8 rounded-full object-cover'
												src={user?.photoURL}
											/>
										)}
										<span className='text-lg font-bold'>{user?.displayName}</span>
										<span>{user?.uid}</span>
										<span>{user?.email}</span>
										<span>{user?.lastRefreshTime}</span>
										{user?.userExtraInfo?.lastCheckIn?._seconds && (
											<span className='rounded-md bg-cyan-900 p-2'>
												{DateTime.fromSeconds(
													user?.userExtraInfo?.lastCheckIn?._seconds
												).toRelative({ style: 'narrow' })}
											</span>
										)}
									</div>
								</div>
							</div>
						);
					})}
			</div>
		</div>
	);
};

export default UsersList;
