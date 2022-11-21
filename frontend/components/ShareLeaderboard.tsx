import React, { useContext, useEffect, useState } from 'react';
import { classNames, getCompetitionClass } from '../lib/utils/reactHelper';
import CompetitionContext from '../context/CompetitionContext';
import { CheckIcon, ShareIcon } from '@heroicons/react/24/outline';
import { CopyToClipboard } from 'react-copy-to-clipboard';

const ShareLeaderboard = ({ leaderboardId }: { leaderboardId: string }) => {
	const competition = useContext(CompetitionContext);

	const gcc = (p: string) => getCompetitionClass(p, competition);

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
			}}>
			<div className={(gcc('hover:bg-dark'), 'flex flex-row items-center gap-2 cursor-pointer font-bold')}>
				{!copied && (
					<>
						<ShareIcon className={classNames(gcc('text-light'), 'h-8 w-8')} />
						<span>Share</span>
					</>
				)}
				{copied && (
					<>
						<CheckIcon className={classNames(gcc('text-light'), 'h-8 w-8 text-green-600')} />
						<span>Link copied to clipboard</span>
					</>
				)}
			</div>
		</CopyToClipboard>
	);
};

export default ShareLeaderboard;
