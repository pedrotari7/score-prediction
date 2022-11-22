import React, { ReactNode } from 'react';
import { User } from '../../interfaces/main';
import { classNames } from '../lib/utils/reactHelper';

const Circle = ({ children, className }: { children: ReactNode; className: string }) => (
	<div
		className={classNames(
			'mx-1 flex h-6 w-6 select-none flex-row items-center justify-center rounded-full p-4 text-center',
			className
		)}
	>
		{children}
	</div>
);

export const UserScores = ({ user }: { user: User }) => {
	return (
		<div className="flex flex-row flex-wrap items-center justify-center">
			<Circle className="bg-green-600">{user.score.exact}</Circle>
			<Circle className="bg-yellow-600">{user.score.result}</Circle>
			<Circle className="bg-pink-600">{user.score.onescore}</Circle>
			<Circle className="bg-red-600">{user.score.fail}</Circle>
			<Circle className="bg-purple-700">{user.score.groups}</Circle>
			<Circle className="bg-gray-500">{user.score.penalty}</Circle>
			<Circle className="my-2 h-10 w-10 bg-gray-700 p-4">{user.score.points}</Circle>
		</div>
	);
};
