import React from 'react';
import { classNames } from '../lib/utils/reactHelper';
import useCompetition from '../hooks/useCompetition';

type Props = {
	readonly className?: string;
	children: React.ReactNode;
};

const Panel = ({ className = '', children }: Props) => {
	const { gcc } = useCompetition();

	return (
		<div className={classNames('mx-2 md:mx-24 lg:mx-48', gcc('text-light'), gcc('bg-dark'), className)}>
			{children}
		</div>
	);
};

export default Panel;
