import React, { ReactNode } from 'react';
import { User } from '../../interfaces/main';
import { classNames } from '../lib/utils/reactHelper';
import { Tooltip } from 'react-tooltip';

export const Circle = ({ children, className }: { children: ReactNode; className: string }) => (
	<div
		className={classNames(
			'mx-1 flex size-6 select-none flex-row items-center justify-center rounded-full p-4 text-center',
			className
		)}
	>
		{children}
	</div>
);

const TooltipInto = ({ children, content }: { children: ReactNode; content: string }) => (
	<a data-tooltip-id='my-tooltip' data-tooltip-content={content} data-tooltip-place='bottom'>
		{children}
	</a>
);

export const UserScores = ({ user }: { user: User }) => {
	return (
		<div className='flex flex-row flex-wrap items-center justify-center'>
			<Tooltip id='my-tooltip' />
			<TooltipInto content='exact'>
				<Circle className='bg-green-600'>{user.score.exact}</Circle>
			</TooltipInto>
			<TooltipInto content='result'>
				<Circle className='bg-yellow-600'>{user.score.result}</Circle>
			</TooltipInto>

			<TooltipInto content='onescore'>
				<Circle className='bg-pink-600'>{user.score.onescore}</Circle>
			</TooltipInto>

			<TooltipInto content='fail'>
				<Circle className='bg-red-600'>{user.score.fail}</Circle>
			</TooltipInto>

			<TooltipInto content='groups'>
				<Circle className='bg-purple-700'>{user.score.groups}</Circle>
			</TooltipInto>

			<TooltipInto content='penalty'>
				<Circle className='bg-gray-500'>{user.score.penalty}</Circle>
			</TooltipInto>

			<TooltipInto content='points'>
				<Circle className='my-2 size-10 bg-gray-700 p-4'>{user.score.points}</Circle>
			</TooltipInto>
		</div>
	);
};
