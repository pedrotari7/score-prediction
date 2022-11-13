import React, { ReactNode } from 'react';
import { User } from '../../interfaces/main';
import { classNames } from '../lib/utils/reactHelper';

const Circle = ({ children, className }: { children: ReactNode; className: string }) => (
	<div
		className={classNames(
			'w-6 h-6 p-4 mx-1 text-center flex flex-row items-center justify-center rounded-full select-none',
			className
		)}>
		{children}
	</div>
);

export const UserScores = ({ user }: { user: User }) => {
	return (
		<div className="flex flex-row justify-center items-center flex-wrap">
			<Circle className="bg-green-500">{user.score.exact}</Circle>
			<Circle className="bg-yellow-500">{user.score.result}</Circle>
			<Circle className="bg-pink-500">{user.score.onescore}</Circle>
			<Circle className="bg-red-500">{user.score.fail}</Circle>
			<Circle className="bg-purple-700">{user.score.groups}</Circle>
			<Circle className="bg-gray-500">{user.score.penalty}</Circle>
			<Circle className="bg-gray-700 w-10 h-10 p-4 my-2">{user.score.points}</Circle>
		</div>
	);
};
