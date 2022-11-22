import { ArrowPathIcon } from '@heroicons/react/24/outline';
import React, { MouseEventHandler, useContext, useState } from 'react';
import CompetitionContext from '../context/CompetitionContext';
import { classNames, getCompetitionClass } from '../lib/utils/reactHelper';

const RefreshButton = ({
	className = '',
	onClick,
}: {
	className?: string;
	onClick: MouseEventHandler<SVGSVGElement>;
}) => {
	const competition = useContext(CompetitionContext);
	const [loading, setLoading] = useState(false);

	const gcc = (p: string) => getCompetitionClass(p, competition);

	return (
		<ArrowPathIcon
			className={classNames(
				gcc('text-light'),
				loading ? 'animate-spin' : '',
				'h-6 w-6',
				'hover:opacity-80 cursor-pointer',
				className
			)}
			onClick={async event => {
				setLoading(true);
				await onClick(event);
				setLoading(false);
			}}
		/>
	);
};

export default RefreshButton;
