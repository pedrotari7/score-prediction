import { ArrowPathIcon } from '@heroicons/react/24/outline';
import React, { MouseEventHandler, useState } from 'react';
import useCompetition from '../hooks/useCompetition';
import { classNames } from '../lib/utils/reactHelper';

const RefreshButton = ({
	className = '',
	onClick,
}: {
	className?: string;
	onClick: MouseEventHandler<SVGSVGElement>;
}) => {
	const { gcc } = useCompetition();
	const [loading, setLoading] = useState(false);

	return (
		<ArrowPathIcon
			className={classNames(
				gcc('text-light'),
				loading ? 'animate-spin' : '',
				'size-6',
				'cursor-pointer hover:opacity-80',
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
