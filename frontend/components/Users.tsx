import React, { useContext, useEffect, useState } from 'react';
import CompetitionContext from '../context/CompetitionContext';
import UserContext from '../context/UserContext';
import { classNames, getCompetitionClass } from '../lib/utils/reactHelper';
import { fetchUsers } from '../pages/api';
import DesktopOnly from './DesktopOnly';
import MobileOnly from './MobileOnly';

const UsersList = () => {
	const competition = useContext(CompetitionContext);
	const userInfo = useContext(UserContext);
	const [users, setUsers] = useState<any>();

	useEffect(() => {
		const doAsync = async () => {
			if (userInfo) {
				setUsers(await fetchUsers(userInfo.token, competition));
			}
		};
		doAsync();
	}, [userInfo, competition]);

	const gcc = (p: string) => getCompetitionClass(p, competition);

	return (
		<div className={classNames(gcc('text-light'), 'm-3 sm:m-6 p-3 sm:p-6 shadow-pop rounded-md select-none')}>
			<div className="font-bold text-2xl mb-4">Users</div>
			<div className="flex flex-col item-center  justify-evenly w-full">
				{users &&
					Object.values(users).map((user: any, index) => {
						return (
							<div key={user.uid} className="relative w-full ">
								<div
									className={classNames(
										'w-full',
										gcc('bg-dark'),
										'flex flex-row items-center gap-2  my-2 sm:m-2 rounded p-4',
										'cursor-pointer hover:bg-opacity-50 select-none'
									)}>
									<DesktopOnly>
										<div className="flex flex-row items-center justify-center w-8 h-8 m-2 font-bold text-xl">
											<span
												className={classNames(
													gcc('bg-light'),
													gcc('text-dark'),
													'rounded-full w-full h-full flex items-center justify-center p-2mr-1'
												)}>
												{index + 1}
											</span>
										</div>
									</DesktopOnly>
									<MobileOnly>
										<div
											className={classNames(
												gcc('bg-light'),
												gcc('text-dark'),
												'absolute -top-1 -left-0 rounded-md w-12 font-bold text-center'
											)}>
											<span className="p-3">{index + 1}</span>
										</div>
									</MobileOnly>
									<div className="text-xs text-left flex flex-row flex-wrap items-center gap-4">
										{user?.photoURL && (
											<img
												className="object-cover h-8 w-8 rounded-full mr-2"
												src={user?.photoURL}
											/>
										)}
										<span className="font-bold text-lg">{user?.displayName}</span>
										<span>{user?.uid}</span>
										<span>{user?.email}</span>
										<span>{user?.lastRefreshTime}</span>
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
