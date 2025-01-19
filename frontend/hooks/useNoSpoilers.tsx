import { EyeSlashIcon } from '@heroicons/react/24/outline';
import type { JSX } from 'react';
import { useContext } from 'react';
import NoSpoilersContext from '../context/NoSpoilersContext';
import { classNames } from '../lib/utils/reactHelper';

const useNoSpoilers = () => {
	const { noSpoilers, setNoSpoilers } = useContext(NoSpoilersContext)!;

	const RedactedSpoilers = ({
		children,
		message = '',
		withIcon = false,
		className = '',
		iconStyle = '',
	}: {
		children: JSX.Element;
		message?: string;
		withIcon?: boolean;
		className?: string;
		iconStyle?: string;
	}) => {
		return noSpoilers ? (
			<div className={classNames('flex flex-row items-center justify-center gap-2', className)}>
				{withIcon && <EyeSlashIcon className={classNames('size-8', iconStyle)} />}
				{message && <span>{message}</span>}
			</div>
		) : (
			children
		);
	};

	return { noSpoilers, setNoSpoilers, RedactedSpoilers };
};

export default useNoSpoilers;
