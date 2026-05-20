import type { ReactNode } from 'react';
import React from 'react';
import type { User } from '../../interfaces/main';
import { DEFAULT_USER_RESULT } from '../../shared/utils';
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

export const UserScores = ({ user, stage }: { user: User; stage: string }) => {
	const stageScore = user.score[stage] ?? DEFAULT_USER_RESULT;
	return (
		<div className='flex flex-row flex-wrap items-center justify-center'>
			<Tooltip id='my-tooltip' />
			<TooltipInto content='exact'>
				<Circle className='bg-green-600'>{stageScore.exact}</Circle>
			</TooltipInto>
			<TooltipInto content='result'>
				<Circle className='bg-yellow-600'>{stageScore.result}</Circle>
			</TooltipInto>

			<TooltipInto content='onescore'>
				<Circle className='bg-pink-600'>{stageScore.onescore}</Circle>
			</TooltipInto>

			<TooltipInto content='fail'>
				<Circle className='bg-red-600'>{stageScore.fail}</Circle>
			</TooltipInto>

			<TooltipInto content='groups'>
				<Circle className='bg-purple-700'>{stageScore.groups}</Circle>
			</TooltipInto>

			<TooltipInto content='penalty'>
				<Circle className='bg-gray-500'>{stageScore.penalty}</Circle>
			</TooltipInto>

			<TooltipInto content='points'>
				<Circle className='my-2 size-10 bg-gray-700 p-4'>{stageScore.points}</Circle>
			</TooltipInto>
		</div>
	);
};
