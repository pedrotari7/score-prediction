import React, { useEffect, useState } from 'react';
import { classNames } from '../lib/utils/reactHelper';
import { CheckIcon, ShareIcon } from '@heroicons/react/24/outline';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import useCompetition from '../hooks/useCompetition';

const ShareLeaderboard = ({ leaderboardId }: { leaderboardId: string }) => {
	const { gcc } = useCompetition();

	const [copied, setCopied] = useState(false);
	const [origin, setOrigin] = useState('');

	useEffect(() => {
		setOrigin(window.location.origin);
	}, []);

	const url = `${origin}?join=${leaderboardId}`;
	return (
		<CopyToClipboard
			text={url}
			onCopy={() => {
				setCopied(true);
				setTimeout(() => setCopied(false), 3000);
			}}
		>
			<div className={(gcc('hover:bg-dark'), 'flex cursor-pointer flex-row items-center gap-2 font-bold')}>
				{!copied && (
					<>
						<ShareIcon className={classNames(gcc('text-light'), 'size-8')} />
						<span>Share</span>
					</>
				)}
				{copied && (
					<>
						<CheckIcon className={classNames(gcc('text-light'), 'size-8 text-green-600')} />
						<span>Link copied to clipboard</span>
					</>
				)}
			</div>
		</CopyToClipboard>
	);
};

export default ShareLeaderboard;
