import type { ReactNode } from 'react';
import React from 'react';
import type { User } from '../../interfaces/main';
import { DEFAULT_USER_RESULT, hasBoosts } from '../../shared/utils';
import useCompetition from '../hooks/useCompetition';
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

const highlight = (key: string, activeKey?: string) => (key === activeKey ? 'ring-2 ring-white scale-110' : '');

export const UserScores = ({ user, stage, highlightKey }: { user: User; stage: string; highlightKey?: string }) => {
	const { competition } = useCompetition();
	const stageScore = user.score?.[stage] ?? DEFAULT_USER_RESULT;
	const hasUpset = (competition.points.upset ?? 0) > 0;
	const showBoosts = hasBoosts(competition);
	return (
		<div className='flex flex-row flex-wrap items-center justify-center'>
			<Tooltip id='my-tooltip' />
			<TooltipInto content='Exact Score'>
				<Circle className={classNames('bg-green-600', highlight('exact', highlightKey))}>
					{stageScore.exact}
				</Circle>
			</TooltipInto>
			<TooltipInto content='Correct Result'>
				<Circle className={classNames('bg-yellow-600', highlight('result', highlightKey))}>
					{stageScore.result}
				</Circle>
			</TooltipInto>

			<TooltipInto content="One Team's Score">
				<Circle className={classNames('bg-pink-600', highlight('onescore', highlightKey))}>
					{stageScore.onescore}
				</Circle>
			</TooltipInto>

			<TooltipInto content='No Points'>
				<Circle className={classNames('bg-red-600', highlight('fail', highlightKey))}>{stageScore.fail}</Circle>
			</TooltipInto>

			<TooltipInto content='Groups'>
				<Circle className={classNames('bg-purple-700', highlight('groups', highlightKey))}>
					{stageScore.groups}
				</Circle>
			</TooltipInto>

			{hasUpset && (
				<TooltipInto content='Upset Bonus'>
					<Circle className={classNames('bg-cyan-700', highlight('upset', highlightKey))}>
						{stageScore.upset ?? 0}
					</Circle>
				</TooltipInto>
			)}

			{showBoosts && (
				<TooltipInto content='Boost Bonus'>
					<Circle className={classNames('bg-indigo-500', highlight('boost', highlightKey))}>
						{stageScore.boost ?? 0}
					</Circle>
				</TooltipInto>
			)}

			<TooltipInto content='Penalty Bonus'>
				<Circle className={classNames('bg-gray-500', highlight('penalty', highlightKey))}>
					{stageScore.penalty}
				</Circle>
			</TooltipInto>

			<TooltipInto content='Total Points'>
				<Circle className={classNames('my-2 size-10 bg-gray-700 p-4', highlight('points', highlightKey))}>
					{stageScore.points}
				</Circle>
			</TooltipInto>
		</div>
	);
};
