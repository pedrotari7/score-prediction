import React, { useContext } from 'react';
import RouteContext, { Route } from '../context/RouteContext';
import { classNames } from '../lib/utils/reactHelper';
import DesktopOnly from './DesktopOnly';
import MobileOnly from './MobileOnly';
import RefreshButton from './RefreshButton';
import { DateTime } from 'luxon';
import Loading from './Loading';
import useCompetition from '../hooks/useCompetition';
import useUsers from '../hooks/useUsers';

const UsersList = () => {
	const { setRoute } = useContext(RouteContext)!;
	const { gcc } = useCompetition();

	const { users, loading, update } = useUsers();

	return (
		<div className={classNames(gcc('text-light'), 'm-3 select-none rounded-md p-3 shadow-pop sm:m-6 sm:p-6')}>
			<div className={classNames('mb-4 flex flex-row items-center justify-between')}>
				<div className='text-2xl font-bold'>Users</div>
				<RefreshButton onClick={update} />
			</div>

			<div className='flex w-full flex-col justify-evenly'>
				{loading && <Loading message='Fetching users...' />}
				{!loading &&
					users &&
					users.map((user, index) => {
						if (!user) return <></>;
						return (
							<div
								key={index}
								className='relative w-full'
								onClick={() => setRoute({ page: Route.Predictions, data: user.uid })}
							>
								<div
									className={
										classNames(
											gcc('bg-dark'),
											'my-2 flex w-full flex-row items-center gap-2 rounded p-4 sm:m-2',
											'cursor-pointer select-none'
										) +
										' ' +
										// eslint-disable-next-line tailwindcss/migration-from-tailwind-2
										classNames('hover:bg-opacity-50')
									}
								>
									<DesktopOnly>
										<div className='m-2 flex size-8 flex-row items-center justify-center text-xl font-bold'>
											<span
												className={classNames(
													gcc('bg-light'),
													gcc('text-dark'),
													'mr-1 flex size-full items-center justify-center rounded-full p-2 px-6'
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
												'absolute -left-0 -top-1 w-12 rounded-md text-center font-bold'
											)}
										>
											<span className='p-3'>{index + 1}</span>
										</div>
									</MobileOnly>
									<div className='flex flex-row flex-wrap items-center gap-4 text-left text-xs'>
										{user?.photoURL && (
											<img
												className='mr-2 size-8 rounded-full object-cover'
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
